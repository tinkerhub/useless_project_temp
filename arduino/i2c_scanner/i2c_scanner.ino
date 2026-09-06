#include <Wire.h>

// Finds any I2C sensor connected to an Arduino Uno.
// SDA -> A4, SCL -> A5.

void setup() {
  Serial.begin(115200);
  Wire.begin();
  delay(250);

  Serial.println();
  Serial.println("========================================");
  Serial.println("            I2C SENSOR SCAN");
  Serial.println("========================================");
}

void loop() {
  uint8_t devicesFound = 0;

  Serial.println("Scanning...");

  for (uint8_t address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    const uint8_t result = Wire.endTransmission();

    if (result == 0) {
      Serial.print("FOUND a device at address 0x");
      if (address < 16) {
        Serial.print('0');
      }
      Serial.println(address, HEX);
      devicesFound++;
    }
  }

  if (devicesFound == 0) {
    Serial.println("NO DEVICES FOUND - check power, GND, SDA and SCL.");
  } else {
    Serial.println("Scan complete. The MPU-6050 is normally 0x68 or 0x69.");
  }

  Serial.println("----------------------------------------");
  delay(3000);
}
