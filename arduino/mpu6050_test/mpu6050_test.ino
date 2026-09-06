#include <Wire.h>
#include <math.h>

// Friendly Arduino-only test for a GY-521 / MPU-6050.
// Arduino Uno wiring:
//   GY-521 VCC -> Uno 5V
//   GY-521 GND -> Uno GND
//   GY-521 SCL -> Uno A5
//   GY-521 SDA -> Uno A4
// Leave XDA, XCL, AD0 and INT disconnected.

constexpr unsigned long PRINT_INTERVAL_MS = 300;
constexpr float TILT_THRESHOLD_DEGREES = 12.0f;
constexpr float MOTION_THRESHOLD_G = 0.08f;

unsigned long lastPrintedAt = 0;
uint8_t mpuAddress = 0;
float previousX = 0.0f;
float previousY = 0.0f;
float previousZ = 0.0f;
bool hasPreviousReading = false;

bool deviceRespondsAt(uint8_t address) {
  Wire.beginTransmission(address);
  return Wire.endTransmission() == 0;
}

uint8_t findMpuAddress() {
  if (deviceRespondsAt(0x68)) {
    return 0x68;
  }

  if (deviceRespondsAt(0x69)) {
    return 0x69;
  }

  return 0;
}

bool writeRegister(uint8_t registerAddress, uint8_t value) {
  Wire.beginTransmission(mpuAddress);
  Wire.write(registerAddress);
  Wire.write(value);
  return Wire.endTransmission() == 0;
}

bool readAcceleration(int16_t &rawX, int16_t &rawY, int16_t &rawZ) {
  Wire.beginTransmission(mpuAddress);
  Wire.write(0x3B);  // First accelerometer register.

  if (Wire.endTransmission(false) != 0) {
    return false;
  }

  const uint8_t received = Wire.requestFrom(mpuAddress, (uint8_t)6);
  if (received != 6) {
    return false;
  }

  rawX = (int16_t)(Wire.read() << 8 | Wire.read());
  rawY = (int16_t)(Wire.read() << 8 | Wire.read());
  rawZ = (int16_t)(Wire.read() << 8 | Wire.read());
  return true;
}

void printDirection(float pitch, float roll) {
  const bool pitchIsLevel = fabs(pitch) < TILT_THRESHOLD_DEGREES;
  const bool rollIsLevel = fabs(roll) < TILT_THRESHOLD_DEGREES;

  if (pitchIsLevel && rollIsLevel) {
    Serial.print("LEVEL");
    return;
  }

  if (!pitchIsLevel) {
    Serial.print(pitch > 0 ? "BACK" : "FORWARD");
  }

  if (!rollIsLevel) {
    if (!pitchIsLevel) {
      Serial.print(" + ");
    }
    Serial.print(roll > 0 ? "RIGHT" : "LEFT");
  }
}

void setup() {
  Serial.begin(115200);
  Wire.begin();
  delay(250);

  Serial.println();
  Serial.println("========================================");
  Serial.println("        MPU-6050 TILT TEST");
  Serial.println("========================================");

  mpuAddress = findMpuAddress();

  if (mpuAddress == 0) {
    Serial.println("ERROR: Nothing responded at 0x68 or 0x69.");
    Serial.println("The sketch is running correctly; this is a connection issue.");
    Serial.println("Check that the module LED is on and that its header is soldered.");
    Serial.println("Verify VCC->5V, GND->GND, SDA->A4 and SCL->A5.");
    while (true) {
      delay(1000);
    }
  }

  Serial.print("Found an I2C device at address 0x");
  Serial.println(mpuAddress, HEX);

  // Register 0x6B controls sleep mode. Writing zero wakes the sensor.
  if (!writeRegister(0x6B, 0x00)) {
    Serial.println("ERROR: Sensor responded but could not be woken.");
    while (true) {
      delay(1000);
    }
  }

  Serial.println("Sensor connected successfully!");
  Serial.println("Keep it flat: Pitch and Roll should be near 0 degrees.");
  Serial.println("========================================");
}

void loop() {
  if (millis() - lastPrintedAt < PRINT_INTERVAL_MS) {
    return;
  }

  lastPrintedAt = millis();

  int16_t rawX;
  int16_t rawY;
  int16_t rawZ;

  if (!readAcceleration(rawX, rawY, rawZ)) {
    Serial.println("ERROR: Lost connection to the MPU-6050.");
    return;
  }

  const float x = rawX / 16384.0f;
  const float y = rawY / 16384.0f;
  const float z = rawZ / 16384.0f;

  const float roll = atan2(y, z) * 180.0f / PI;
  const float pitch = atan2(-x, sqrt(y * y + z * z)) * 180.0f / PI;
  const float totalAcceleration = sqrt(x * x + y * y + z * z);
  const float changeSinceLastReading = hasPreviousReading
    ? sqrt(
        (x - previousX) * (x - previousX) +
        (y - previousY) * (y - previousY) +
        (z - previousZ) * (z - previousZ))
    : 0.0f;

  const bool isMoving =
    fabs(totalAcceleration - 1.0f) > MOTION_THRESHOLD_G ||
    changeSinceLastReading > MOTION_THRESHOLD_G;

  previousX = x;
  previousY = y;
  previousZ = z;
  hasPreviousReading = true;

  Serial.print("Motion: ");
  Serial.print(isMoving ? "MOVING" : "STILL ");
  Serial.print(" | Accel X: ");
  Serial.print(x, 2);
  Serial.print("g Y: ");
  Serial.print(y, 2);
  Serial.print("g Z: ");
  Serial.print(z, 2);
  Serial.print("g Total: ");
  Serial.print(totalAcceleration, 2);
  Serial.print("g | Tilt: ");
  printDirection(pitch, roll);
  Serial.print(" | Pitch: ");
  Serial.print(pitch, 1);
  Serial.print(" deg   Roll: ");
  Serial.print(roll, 1);
  Serial.println(" deg");
}
