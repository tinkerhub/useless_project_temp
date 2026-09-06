#include <Wire.h>
#include <math.h>

// Combined Arduino input stream for the Unity cube demo.
//
// Joystick wiring:
//   GND -> GND
//   +5V -> 5V
//   VRx -> A0
//   VRy -> A1
//
// Existing push button:
//   One leg -> digital pin 2
//   Other leg -> GND
//
// GY-521 / MPU-6050:
//   VCC -> 5V
//   GND -> GND
//   SDA -> A4
//   SCL -> A5

constexpr uint8_t JOYSTICK_X_PIN = A0;
constexpr uint8_t JOYSTICK_Y_PIN = A1;
constexpr uint8_t BUTTON_PIN = 2;
constexpr unsigned long SEND_INTERVAL_MS = 30;
constexpr float TILT_SMOOTHING = 0.18f;

unsigned long lastSentAt = 0;
uint8_t mpuAddress = 0;
bool mpuReady = false;
bool hasTiltReading = false;
float smoothPitch = 0.0f;
float smoothRoll = 0.0f;

bool deviceRespondsAt(uint8_t address) {
  Wire.beginTransmission(address);
  return Wire.endTransmission() == 0;
}

bool writeMpuRegister(uint8_t registerAddress, uint8_t value) {
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

void sendTilt() {
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

  if (!hasTiltReading) {
    smoothPitch = pitch;
    smoothRoll = roll;
    hasTiltReading = true;
  } else {
    smoothPitch += (pitch - smoothPitch) * TILT_SMOOTHING;
    smoothRoll += (roll - smoothRoll) * TILT_SMOOTHING;
  }

  Serial.print("TILT,");
  Serial.print(smoothPitch, 2);
  Serial.print(',');
  Serial.println(smoothRoll, 2);
}

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Serial.begin(115200);
  Wire.begin();
  delay(250);

  if (deviceRespondsAt(0x68)) {
    mpuAddress = 0x68;
  } else if (deviceRespondsAt(0x69)) {
    mpuAddress = 0x69;
  }

  if (mpuAddress != 0) {
    mpuReady = writeMpuRegister(0x6B, 0x00);
  }

  Serial.println("READY,UNITY_CONTROLLER");
  Serial.println(mpuReady ? "READY,MPU6050" : "WARNING,MPU6050_NOT_FOUND");
}

void loop() {
  if (millis() - lastSentAt < SEND_INTERVAL_MS) {
    return;
  }

  lastSentAt = millis();

  const int x = analogRead(JOYSTICK_X_PIN);
  const int y = analogRead(JOYSTICK_Y_PIN);
  const bool buttonPressed = digitalRead(BUTTON_PIN) == LOW;

  // Unity expects: INPUT,<x 0-1023>,<y 0-1023>,<button 0 or 1>
  Serial.print("INPUT,");
  Serial.print(x);
  Serial.print(',');
  Serial.print(y);
  Serial.print(',');
  Serial.println(buttonPressed ? 1 : 0);

  if (mpuReady) {
    sendTilt();
  }
}
