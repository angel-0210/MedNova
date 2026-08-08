# MedNova ESP32 Ventilator Telemetry Node

This directory contains the firmware for connecting an ESP32 microcontroller to the MedNova backend. The node reads **live** vitals from a MAX30102 pulse oximeter and a waterproof DS18B20 temperature probe, and streams them to the MedNova AI evaluation engine in real time.

## 📋 Features

* **Auto-Reconnection WiFi Manager**: Keeps trying to connect on Wi-Fi dropouts.
* **Live Pulse Oximetry**: SpO2 and heart rate from a MAX30102 using the Maxim reference algorithm over a 4-second sample window.
* **Live Patient Temperature**: DS18B20 waterproof probe on the 1-Wire bus.
* **Reading Validation**: A packet is sent only when the sensors agree it is real — no finger on the sensor, an unstable algorithm result, or a disconnected probe all skip transmission rather than publish a fabricated vital to the ward dashboard.
* **On-board Diagnostics LED**:
  * **Rapid Flashing**: Attempting connection to Wi-Fi.
  * **Steady ON**: Connection successful, idle.
  * **Brief Flash OFF/ON**: Dispatching telemetry packet.
  * **2-Flash Sequence**: Server connection timeout or endpoint host unreachable.
  * **3-Flash Sequence**: Request rejected by server (unregistered `connection_code`, or device not assigned to an active patient).
  * **Continuous 1-Flash / 2-Flash at boot**: Fatal — MAX30102 / DS18B20 not detected. Check wiring.

---

## 🔌 Hardware Wiring

| Component | ESP32 Pin | Notes |
|---|---|---|
| MAX30102 `SDA` | GPIO 21 | I2C data |
| MAX30102 `SCL` | GPIO 22 | I2C clock |
| MAX30102 `VIN` / `GND` | 3V3 / GND | **3.3 V only** |
| DS18B20 `DATA` (yellow) | GPIO 4 | **Requires a 4.7 kΩ resistor between DATA and 3V3** — the bus does not work without it |
| DS18B20 `VDD` (red) | 3V3 | |
| DS18B20 `GND` (black) | GND | |
| Status LED | GPIO 2 | Built-in on most ESP32 dev boards |

---

## 🛠️ Setup Instructions

### 1. IDE Setup
1. Download and install [Arduino IDE](https://www.arduino.cc/en/software).
2. Install the ESP32 board manager:
   * Go to **File -> Preferences**.
   * In *Additional Boards Manager URLs*, enter: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`.
   * Go to **Tools -> Board -> Boards Manager**, search for `esp32` by Espressif, and click **Install**.
3. Select your board from **Tools -> Board -> ESP32 Arduino** (e.g., `ESP32 Dev Module`).

### 2. Dependency Libraries
Install via **Tools -> Manage Libraries**:
* **`SparkFun MAX3010x Pulse and Proximity Sensor Library`** (by SparkFun) — provides both the driver and `spo2_algorithm.h`
* **`DallasTemperature`** (by Miles Burton) — accept the prompt to also install **`OneWire`** (by Paul Stoffregen)

*(The JSON body is built with `snprintf`, so no ArduinoJson is required.)*

### 3. Firmware Customization
Open [ventilator_sensor_node.ino](ventilator_sensor_node/ventilator_sensor_node.ino) and update the configuration block at the top:
```cpp
// Network Credentials
const char* wifi_ssid     = "YOUR_WIFI_SSID";
const char* wifi_password = "YOUR_WIFI_PASSWORD";

// Target Ingestion Server — the host machine's LAN IP, never localhost/127.0.0.1
const char* backend_url   = "http://192.168.1.100:8000/api/v1/iot/readings";

// Precompiled connection code (5-digit numeric pairing code).
// Must match a devices.connection_code row that has an ACTIVE patient assignment.
const char* connection_code = "29381";
```

The ESP32 and the backend host must be on the **same network**, and the backend must be started with `--host 0.0.0.0` (this is what `npm run backend` does) or the node cannot reach it.

### 4. Calibration
Two knobs near the top of the sketch are meant to be tuned against real hardware:

* `temp_offset_c` — a DS18B20 on skin reads below core temperature, and every probe and placement differs. Compare one reading against a clinical thermometer and trim the offset. Do **not** compensate by widening the accepted range.
* `finger_ir_threshold` — the mean IR level that counts as "a finger is present". Raise it if the node posts readings with nothing attached; lower it for cold or poorly perfused hands.

### 5. Upload Firmware
1. Connect your ESP32 to your PC using a micro-USB **data** cable.
2. Select the correct COM Port under **Tools -> Port**.
3. Click the **Upload** arrow icon.
4. Open **Serial Monitor at 115200 baud** and rest a fingertip on the MAX30102. The first packet appears after roughly 4 seconds of stable contact.

---

## 📡 What Gets Sent

`POST /api/v1/iot/readings`

```json
{ "connection_code": "29381", "spo2": 97.0, "heart_rate": 78.0, "temperature": 36.85 }
```

`timestamp` is omitted on purpose — the backend stamps readings at receipt, which removes the need for an NTP client or RTC on the node.

The server responds `201 Created`, stores the reading, runs the AI risk prediction, raises an alert if thresholds are crossed, and broadcasts `new_telemetry` over the dashboard WebSocket.

### Server response codes
| Code | Meaning | Fix |
|---|---|---|
| `201` | Accepted | — |
| `404` | `connection_code` not registered | Register the device, or correct the code in the sketch |
| `400` | Device has no active patient assignment | Assign the device to a patient |
| `422` | A value fell outside the accepted range | SpO2 0–100, heart rate 0–300, temperature 20–50 °C |

---

## 🩺 Testing Without Hardware
To exercise the dashboard, alerting, and WebSocket path without an ESP32 on the bench, post the same body by hand:

```bash
curl -X POST http://<HOST_IP>:8000/api/v1/iot/readings \
  -H "Content-Type: application/json" \
  -d '{"connection_code":"29381","spo2":88.0,"heart_rate":124.0,"temperature":38.4}'
```

Those values score 60 (`medium` risk). An alert is raised **unless** the patient already has a pending `medium` alert or one was raised in the last 5 minutes — `AlertService` deduplicates by patient and alert type. Acknowledge or resolve the existing alert first if you want to see a fresh one appear.
