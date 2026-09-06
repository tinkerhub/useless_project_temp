// First hardware test for the Arduino-to-Unity controller.
// Wire a push button between digital pin 2 and GND.
// INPUT_PULLUP keeps the pin stable without an external resistor.

constexpr uint8_t BUTTON_PIN = 2;
constexpr unsigned long DEBOUNCE_MS = 25;

bool stablePressed = false;
bool lastReading = false;
unsigned long lastChangeAt = 0;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Serial.begin(115200);

  // Give the serial connection a moment to initialize.
  delay(250);
  Serial.println("READY,BUTTON_TEST");
  Serial.println("BUTTON,0");
}

void loop() {
  // INPUT_PULLUP reads LOW while the button is pressed.
  const bool reading = digitalRead(BUTTON_PIN) == LOW;

  if (reading != lastReading) {
    lastReading = reading;
    lastChangeAt = millis();
  }

  if (millis() - lastChangeAt >= DEBOUNCE_MS && reading != stablePressed) {
    stablePressed = reading;
    Serial.print("BUTTON,");
    Serial.println(stablePressed ? 1 : 0);
  }
}
