#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ===============================
// OLED SETTINGS
// ===============================

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

Adafruit_SSD1306 display(
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  &Wire,
  -1
);


// ===============================
// PIN SETTINGS
// ===============================

const int PIR_PIN = 13;

const int LED_PIN = 2;

const int BUZZER_PIN = 25;

const int BUTTON_PIN = 26;


// ===============================
// TIME SETTINGS
// ===============================

// Time before judging the user 😂
// 60,000 milliseconds = 1 minute

const unsigned long INACTIVITY_LIMIT = 60000;


// ===============================
// VARIABLES
// ===============================

unsigned long lastMovementTime = 0;

bool procrastinating = false;


// ===============================
// SETUP
// ===============================

void setup()
{
  Serial.begin(115200);

  pinMode(PIR_PIN, INPUT);

  pinMode(LED_PIN, OUTPUT);

  pinMode(BUZZER_PIN, OUTPUT);

  pinMode(
    BUTTON_PIN,
    INPUT_PULLUP
  );


  // Start OLED

  if (
    !display.begin(
      SSD1306_SWITCHCAPVCC,
      0x3C
    )
  )
  {
    Serial.println(
      "OLED not found!"
    );

    while (true);
  }


  display.clearDisplay();

  display.setTextSize(1);

  display.setTextColor(
    SSD1306_WHITE
  );

  display.setCursor(0, 0);

  display.println(
    "PROCRASTIBOT"
  );

  display.println();

  display.println(
    "Watching your"
  );

  display.println(
    "productivity..."
  );

  display.display();


  lastMovementTime = millis();
}


// ===============================
// SHOW MESSAGE
// ===============================

void showMessage()
{
  display.clearDisplay();

  display.setTextSize(1);

  display.setTextColor(
    SSD1306_WHITE
  );

  display.setCursor(0, 0);

  display.println(
    "WARNING!"
  );

  display.println();

  display.println(
    "Congratulations!"
  );

  display.println(
    "You successfully"
  );

  display.println(
    "avoided work."
  );

  display.println();

  display.println(
    "Try again tomorrow."
  );

  display.display();
}


// ===============================
// NORMAL SCREEN
// ===============================

void showNormalScreen()
{
  display.clearDisplay();

  display.setCursor(0, 0);

  display.println(
    "Status:"
  );

  display.println();

  display.println(
    "Pretending to"
  );

  display.println(
    "be productive..."
  );

  display.display();
}


// ===============================
// MAIN LOOP
// ===============================

void loop()
{
  int movement =
    digitalRead(
      PIR_PIN
    );


  // =============================
  // MOVEMENT DETECTED
  // =============================

  if (movement == HIGH)
  {
    lastMovementTime =
      millis();


    procrastinating =
      false;


    digitalWrite(
      LED_PIN,
      LOW
    );


    digitalWrite(
      BUZZER_PIN,
      LOW
    );


    showNormalScreen();


    Serial.println(
      "Movement detected."
    );
  }


  // =============================
  // CHECK INACTIVITY
  // =============================

  if (

    millis()
    -
    lastMovementTime

    >
    INACTIVITY_LIMIT

  )
  {

    if (
      !procrastinating
    )
    {

      procrastinating =
        true;


      Serial.println(
        "PROCRASTINATION DETECTED!"
      );


      // Turn LED ON

      digitalWrite(
        LED_PIN,
        HIGH
      );


      // Buzz dramatically

      tone(
        BUZZER_PIN,
        1000,
        1000
      );


      // Show sarcastic message

      showMessage();

    }

  }


  // =============================
  // USELESS BUTTON 😂
  // =============================

  if (

    digitalRead(
      BUTTON_PIN
    )

    ==
    LOW

  )
  {

    Serial.println(
      "Button pressed."
    );

    Serial.println(
      "Absolutely nothing happened."
    );


    // Intentionally does nothing 😂

    delay(500);

  }

}