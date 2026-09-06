// Arduino-only joystick test.
// Wiring:
//   GND -> GND
//   +5V -> 5V
//   VRx -> A0
//   VRy -> A1
// Leave SW disconnected for this first test.

constexpr uint8_t JOYSTICK_X_PIN = A0;
constexpr uint8_t JOYSTICK_Y_PIN = A1;
constexpr unsigned long SEND_INTERVAL_MS = 300;
constexpr int LOW_EDGE = 350;
constexpr int HIGH_EDGE = 650;

unsigned long lastSentAt = 0;

void setup() {
  Serial.begin(115200);
  delay(250);
  Serial.println();
  Serial.println("========================================");
  Serial.println("         JOYSTICK TEST IS READY");
  Serial.println("========================================");
  Serial.println("Move the stick and watch the direction.");
  Serial.println("X and Y should be near 512 at the centre,");
  Serial.println("and approach 0 or 1023 at the edges.");
  Serial.println("========================================");
}

void loop() {
  if (millis() - lastSentAt < SEND_INTERVAL_MS) {
    return;
  }

  lastSentAt = millis();

  const int x = analogRead(JOYSTICK_X_PIN);
  const int y = analogRead(JOYSTICK_Y_PIN);

  Serial.print("Direction: ");

  const bool horizontalCentre = x >= LOW_EDGE && x <= HIGH_EDGE;
  const bool verticalCentre = y >= LOW_EDGE && y <= HIGH_EDGE;

  if (horizontalCentre && verticalCentre) {
    Serial.print("CENTRE");
  } else {
    if (!verticalCentre) {
      Serial.print(y < LOW_EDGE ? "UP" : "DOWN");
    }

    if (!horizontalCentre) {
      if (!verticalCentre) {
        Serial.print(" + ");
      }
      Serial.print(x < LOW_EDGE ? "LEFT" : "RIGHT");
    }
  }

  Serial.print("   |   X: ");
  Serial.print(x);
  Serial.print("   Y: ");
  Serial.println(y);
}
