# MedNova ESP32 Ventilator Telemetry Node

This directory contains the firmware code for connecting an ESP32 microcontroller to the MedNova backend. The node simulates real-time ventilator sensor readings and streams the data dynamically to be evaluated by the MedNova AI evaluation engine.

## 📋 Features

* **Auto-Reconnection WiFi Manager**: Keeps trying to connect on Wi-Fi dropouts.
* **JSON Telemetry Generator**: Packages Spo2, Heart Rate, Airway Pressure, Temperature, Airflow, and Respiratory Rate into JSON matching the expected API schema.
* **Multi-State Clinical Simulator**: Cycles through typical clinical scenarios (Normal Breathing, Weaning, Hypoxia, Obstruction) to test notifications and web dashboard graphs.
* **On-board Diagnostics LED**:
  * **Rapid Flashing**: Attempting connection to Wi-Fi.
  * **Steady ON**: Connection successful, idle.
  * **Brief Flash OFF/ON**: Dispatching telemetry packet.
  * **2-Flash Sequence**: Server connection timeout or endpoint host unreachable.
  * **3-Flash Sequence**: Request rejected by server (e.g. Device MAC/UUID not registered, or Device not assigned to an active patient).

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
Install the following libraries via **Tools -> Manage Libraries**:
* **`ArduinoJson`** (by Benoit Blanchon, v6.x or v7.x)

### 3. Firmware Customization
Open [ventilator_sensor_node.ino](file:///d:/Documents/Projects/MedNOVA/firmware/ventilator_sensor_node/ventilator_sensor_node.ino) and update the configuration variables at the top of the file:
```cpp
// Network Credentials
const char* wifi_ssid     = "YOUR_WIFI_SSID";
const char* wifi_password = "YOUR_WIFI_PASSWORD";

// Target Ingestion Server (Replace with your server IP and Port)
const char* backend_url   = "http://192.168.1.100:8000/api/v1/iot/readings";

// Precompiled connection code (5-digit numeric pairing code)
// This code must match a registered device in the database
const char* connection_code = "58392"; 
```

### 4. Upload Firmware
1. Connect your ESP32 to your PC using a micro-USB data cable.
2. Select the correct COM Port under **Tools -> Port**.
3. Click the **Upload** arrow icon.

---

## 🩺 Simulator Behaviors
The simulated patient transitions through 4 distinct states every 4 minutes (60 seconds per state):
1. **Normal (0 - 60s)**: Patient values are stable (SpO2: 98%, Heart Rate: 72 BPM, Airway Pressure: 15 cmH2O).
2. **Weaning (60 - 120s)**: Airway pressure and respiratory rate adjust as the ventilator dials down support.
3. **Hypoxia Stress (120 - 180s)**: SpO2 drops to ~85% and Heart Rate rises to ~120 BPM, triggering a **High/Critical Alert** on the MedNova server.
4. **Airway Obstruction (180 - 240s)**: Airway pressure spikes to ~40 cmH2O and airflow drops, triggering an **Airway Obstruction Alert**.

---

## 🔌 Hardware Wiring Guide (Physical Sensors)
If you wish to transition from simulated telemetry to physical sensors:

1. **MAX30102 (SpO2 & Heart Rate)**:
   * Connection: I2C (SDA -> GPIO 21, SCL -> GPIO 22 on ESP32)
   * Library: `SparkFun MAX3010x Pulse Oximeter Library`
2. **BMP280/BME280 (Airway Pressure & Temperature)**:
   * Connection: I2C (SDA -> GPIO 21, SCL -> GPIO 22)
   * Library: `Adafruit BMP280 Library`
3. **Flow Sensor (Airflow)**:
   * Connection: Analog Pin (e.g. GPIO 34) or Digital Pulse Frequency pin.
