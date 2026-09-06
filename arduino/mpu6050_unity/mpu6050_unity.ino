#include <Wire.h>
#include <math.h>

// MPU-6050 pitch/roll stream for Unity.
// Uno wiring: VCC->5V, GND->GND, SDA->A4, SCL->A5.

constexpr unsigned long SEND_INTERVAL_MS = 30;
constexpr float SMOOTHING = 0.18f;

uint8_t mpuAddress = 0;
unsigned long lastSentAt = 0;
float smoothPitch = 0.0f;
float smoothRoll = 0.0f;
bool hasReading = false;

bool deviceRespondsAt(uint8_t address) {
  Wire.beginTransmission(address);
  return Wire.endTransmission() == 0;
}

bool writeRegister(uint8_t registerAddress, uint8_t value) {
  Wire.beginTransmission(mpuAddress);
  Wire.write(registerAddress);
  Wire.write(value);
  return Wire.endTransmission() == 0;
}

bool readAcceleration(int16_t &rawX, int16_t &rawY, int16_t &rawZ) {
  Wire.beginTransmission(mpuAddress);
  Wire.write(0x3B);

  if (Wire.endTransmission(false) != 0) {
    return false;
  }

  if (Wire.requestFrom(mpuAddress, (uint8_t)6) != 6) {
    return false;
  }

  rawX = (int16_t)(Wire.read() << 8 | Wire.read());
  rawY = (int16_t)(Wire.read() << 8 | Wire.read());
  rawZ = (int16_t)(Wire.read() << 8 | Wire.read());
  return true;
}

void setup() {
  Serial.begin(115200);
  Wire.begin();
  delay(250);

  if (deviceRespondsAt(0x68)) {
    mpuAddress = 0x68;
  } else if (deviceRespondsAt(0x69)) {
    mpuAddress = 0x69;
  } else {
    Serial.println("ERROR,MPU_NOT_FOUND");
    while (true) {
      delay(1000);
    }
  }

  if (!writeRegister(0x6B, 0x00)) {
    Serial.println("ERROR,MPU_WAKE_FAILED");
    while (true) {
      delay(1000);
    }
  }

  Serial.println("READY,MPU6050_UNITY");
}

void loop() {
  if (millis() - lastSentAt < SEND_INTERVAL_MS) {
    return;
  }

  lastSentAt = millis();

  int16_t rawX;
  int16_t rawY;
  int16_t rawZ;

  if (!readAcceleration(rawX, rawY, rawZ)) {
    return;
  }

  const float x = rawX / 16384.0f;
  const float y = rawY / 16384.0f;
  const float z = rawZ / 16384.0f;
  const float pitch = atan2(-x, sqrt(y * y + z * z)) * 180.0f / PI;
  const float roll = atan2(y, z) * 180.0f / PI;

  if (!hasReading) {
    smoothPitch = pitch;
    smoothRoll = roll;
    hasReading = true;
  } else {
    smoothPitch += (pitch - smoothPitch) * SMOOTHING;
    smoothRoll += (roll - smoothRoll) * SMOOTHING;
  }

  Serial.print("TILT,");
  Serial.print(smoothPitch, 2);
  Serial.print(',');
  Serial.println(smoothRoll, 2);
}
