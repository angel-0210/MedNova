/**
 * MedNova Ventilator Telemetry Node for ESP32
 *
 * Reads live SpO2 + heart rate from a MAX30102 pulse-oximeter and patient
 * temperature from a waterproof DS18B20 probe, then POSTs them to the MedNova
 * backend's IoT ingestion API.
 *
 * Hardware:
 * - ESP32 Development Board (e.g. ESP32-WROOM-32)
 * - MAX30102 pulse oximeter  -> I2C: SDA=GPIO21, SCL=GPIO22, VIN=3V3, GND=GND
 * - DS18B20 waterproof probe -> DATA=GPIO4, VDD=3V3, GND=GND
 *                               + 4.7k resistor between DATA and 3V3 (required)
 * - Status LED on GPIO 2 (built-in on most boards)
 *
 * Libraries (Arduino Library Manager):
 * - "SparkFun MAX3010x Pulse and Proximity Sensor Library"
 * - "DallasTemperature" (by Miles Burton)   -- pulls in "OneWire" by Paul Stoffregen
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <MAX30105.h>
#include "spo2_algorithm.h"
#include <OneWire.h>
#include <DallasTemperature.h>

// =========================================================================
// 1. CONFIGURATION PARAMETERS (Modify these to match your environment)
// =========================================================================

// Network Credentials
const char* wifi_ssid     = "MANMEET";
const char* wifi_password = "10102020";

// MedNova API Server. Use the host machine's LAN IP -- not localhost/127.0.0.1 --
// and make sure uvicorn runs with --host 0.0.0.0.
const char* backend_url   = "http://10.85.55.127:8000/api/v1/iot/readings";

// Precompiled connection code (5-digit numeric pairing code).
// Must match a devices.connection_code row that has an ACTIVE patient assignment,
// otherwise the server answers 404 (unknown device) or 400 (no patient).
const char* connection_code = "29381";

// Pin map
const int status_led_pin = 2;
const int temp_probe_pin = 4;

// -- Calibration knobs -----------------------------------------------------
// A DS18B20 taped to skin or tucked in an axilla reads BELOW core temperature,
// and every probe/placement differs. Compare against a clinical thermometer once
// and trim this offset; do not "fix" a low reading by widening the valid range.
const float temp_offset_c = 0.0;

// Mean IR level below which we assume no finger is on the sensor. Raise it if the
// node posts readings with nothing attached, lower it for cold/poorly perfused hands.
const long finger_ir_threshold = 50000;

// =========================================================================
// 2. HARDWARE OBJECTS & SAMPLE BUFFERS
// =========================================================================
MAX30105 pulseSensor;
OneWire oneWire(temp_probe_pin);
DallasTemperature tempProbe(&oneWire);

// The Maxim algorithm wants a fixed window. At sampleRate 100 with 4x averaging the
// sensor emits ~25 Hz, so 100 samples is a 4-second window -- one reading per cycle.
// ponytail: whole-window-at-a-time instead of a sliding window. That caps updates at
// ~0.25 Hz; shift the buffer by 25 samples per pass if the ward wants 1 Hz traces.
const int32_t sample_count = 100;
uint32_t ir_buffer[sample_count];
uint32_t red_buffer[sample_count];

// =========================================================================
// 3. SETUP & INITIALIZATION
// =========================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n====================================");
  Serial.println("MedNova ESP32 Ventilator Node v2.0.0");
  Serial.println("====================================");

  pinMode(status_led_pin, OUTPUT);
  digitalWrite(status_led_pin, LOW);

  // A missing sensor must halt, not silently stream nothing. Blink forever so the
  // fault is visible on a node with no serial monitor attached.
  if (!pulseSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("FATAL: MAX30102 not found on I2C. Check SDA=21 / SCL=22 and 3V3 power.");
    while (true) flashLED(1, 150);
  }
  // Red + IR at 411us pulse width -- the reference configuration for the Maxim SpO2 algorithm.
  pulseSensor.setup(60, 4, 2, 100, 411, 4096);

  tempProbe.begin();
  if (tempProbe.getDeviceCount() == 0) {
    Serial.println("FATAL: no DS18B20 on the 1-Wire bus. Check GPIO4 and the 4.7k pull-up.");
    while (true) flashLED(2, 150);
  }

  Serial.println("Sensors online. Place a finger on the MAX30102 to begin.");
  connectToWiFi();
}

// =========================================================================
// 4. MAIN LOOP
// =========================================================================
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  // Blocks for one ~4s acquisition window, which also paces transmission.
  float spo2, heart_rate;
  if (!readPulseOximeter(&spo2, &heart_rate)) {
    return;
  }

  float temperature;
  if (!readTemperature(&temperature)) {
    return;
  }

  Serial.printf("SpO2 %.1f%%  HR %.1f bpm  Temp %.2f C\n", spo2, heart_rate, temperature);
  dispatchTelemetry(buildPayload(spo2, heart_rate, temperature));
}

// =========================================================================
// 5. WI-FI MANAGEMENT
// =========================================================================
void connectToWiFi() {
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(wifi_ssid);

  WiFi.begin(wifi_ssid, wifi_password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    digitalWrite(status_led_pin, !digitalRead(status_led_pin));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(status_led_pin, HIGH);
    Serial.println("\nWi-Fi Connected successfully!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    digitalWrite(status_led_pin, LOW);
    Serial.println("\nWi-Fi connection failed. Will retry in loop.");
  }
}

// =========================================================================
// 6. SENSOR ACQUISITION
// =========================================================================

/**
 * Fills the sample window and runs the Maxim SpO2/HR algorithm.
 * Returns false (and posts nothing) whenever the reading cannot be trusted --
 * no finger, or the algorithm flagging its own output invalid. Publishing a
 * fabricated vital to a monitoring dashboard is worse than publishing none.
 */
bool readPulseOximeter(float* spo2_out, float* heart_rate_out) {
  double ir_total = 0;
  for (int32_t i = 0; i < sample_count; i++) {
    while (!pulseSensor.available()) pulseSensor.check();
    red_buffer[i] = pulseSensor.getRed();
    ir_buffer[i]  = pulseSensor.getIR();
    ir_total += ir_buffer[i];
    pulseSensor.nextSample();
  }

  if (ir_total / sample_count < finger_ir_threshold) {
    Serial.println("Waiting for finger on MAX30102...");
    return false;
  }

  int32_t spo2, heart_rate;
  int8_t spo2_valid, heart_rate_valid;
  maxim_heart_rate_and_oxygen_saturation(
    ir_buffer, sample_count, red_buffer,
    &spo2, &spo2_valid, &heart_rate, &heart_rate_valid);

  // The server rejects out-of-range vitals with a 422, so gate on the same bounds
  // it enforces (spo2 0-100, heart_rate 0-300) plus a physiological floor.
  if (!spo2_valid || spo2 < 70 || spo2 > 100) {
    Serial.println("Discarded: SpO2 reading not stable yet.");
    return false;
  }
  if (!heart_rate_valid || heart_rate < 30 || heart_rate > 250) {
    Serial.println("Discarded: heart rate reading not stable yet.");
    return false;
  }

  *spo2_out = (float)spo2;
  *heart_rate_out = (float)heart_rate;
  return true;
}

/** Reads the waterproof probe. Returns false on a disconnected or implausible probe. */
bool readTemperature(float* temperature_out) {
  tempProbe.requestTemperatures();
  float celsius = tempProbe.getTempCByIndex(0);

  if (celsius == DEVICE_DISCONNECTED_C) {
    Serial.println("Discarded: DS18B20 not responding.");
    return false;
  }

  celsius += temp_offset_c;

  // Server contract is 20-50 C. Anything outside it is a wiring or placement fault,
  // not a patient -- clamping would hide that, so drop the packet instead.
  if (celsius < 20.0 || celsius > 50.0) {
    Serial.printf("Discarded: temperature %.2f C is outside the 20-50 C range.\n", celsius);
    return false;
  }

  *temperature_out = celsius;
  return true;
}

// =========================================================================
// 7. TELEMETRY SERIALIZATION & TRANSMISSION
// =========================================================================

/**
 * Builds the IotIngestPayload body. `timestamp` is deliberately omitted -- the
 * backend defaults it to receipt time, which saves an NTP client and an RTC.
 * ponytail: add SNTP + an ISO-8601 timestamp field if readings ever need to
 * survive a network stall without collapsing onto the reconnect time.
 */
String buildPayload(float spo2, float heart_rate, float temperature) {
  char payload[160];
  snprintf(payload, sizeof(payload),
           "{\"connection_code\":\"%s\",\"spo2\":%.1f,\"heart_rate\":%.1f,\"temperature\":%.2f}",
           connection_code, spo2, heart_rate, temperature);
  return String(payload);
}

void dispatchTelemetry(String json_payload) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Telemetry skipped: No Wi-Fi Connection");
    return;
  }

  digitalWrite(status_led_pin, LOW);

  HTTPClient http;

  Serial.println("\n--- Dispatching Telemetry ---");
  Serial.print("Payload: ");
  Serial.println(json_payload);

  http.begin(backend_url);
  http.addHeader("Content-Type", "application/json");
  // Without these a dead server stalls the node for the platform default (~60s).
  http.setConnectTimeout(5000);
  http.setTimeout(5000);

  int http_code = http.POST(json_payload);

  if (http_code > 0) {
    Serial.print("HTTP Response Code: ");
    Serial.println(http_code);

    if (http_code == HTTP_CODE_CREATED || http_code == HTTP_CODE_OK) {
      Serial.println("Telemetry successfully accepted!");
      digitalWrite(status_led_pin, HIGH);
    } else {
      // 404 = connection_code not registered. 400 = device has no active patient
      // assignment. 422 = a value fell outside the server's range.
      Serial.print("Ingestion rejected: ");
      Serial.println(http.getString());
      flashLED(3, 100);
    }
  } else {
    Serial.print("HTTP POST failed, transport error: ");
    Serial.println(http.errorToString(http_code).c_str());
    flashLED(2, 400);
  }

  http.end();
}

void flashLED(int count, int delay_ms) {
  for (int i = 0; i < count; i++) {
    digitalWrite(status_led_pin, HIGH);
    delay(delay_ms);
    digitalWrite(status_led_pin, LOW);
    delay(delay_ms);
  }
}
