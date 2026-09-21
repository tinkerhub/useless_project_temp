// ================================================================
// DESKMATE
// ESP32 + 2x SH1106 128x64 OLED + PIR + SG90 SERVO
//
// EMOTIONS:
// NORMAL, HAPPY, SAD, ANGRY, SURPRISED, SLEEPY,
// LOVE, EXCITED, SUSPICIOUS, DIZZY
//
// No MPU6050.
// The servo itself creates the angry head shake.
// After the angry shake, DeskMate becomes DIZZY.
// ================================================================

#include <Arduino.h>
#include <Wire.h>
#include <U8g2lib.h>
#include <ESP32Servo.h>
#include <math.h>

// ================================================================
// OLED CONFIGURATION
// ================================================================

#define SDA_PIN 21
#define SCL_PIN 22

U8G2_SH1106_128X64_NONAME_F_HW_I2C u8g2(
  U8G2_R0,
  U8X8_PIN_NONE
);

U8G2_SH1106_128X64_NONAME_F_HW_I2C textOLED(
  U8G2_R0,
  U8X8_PIN_NONE
);

#define FACE_OLED_ADDRESS 0x78
#define TEXT_OLED_ADDRESS 0x7A

#define OLED_WHITE 1
#define OLED_BLACK 0

// ================================================================
// PIR
// ================================================================

#define PIR_PIN 27

const unsigned long SUSPICIOUS_TIME = 2000;
const unsigned long SAD_TIME = 3000;
const unsigned long LEAVE_TIMEOUT = 8000;

// ================================================================
// SERVO
// ================================================================

#define SERVO_PIN 13

Servo neckServo;

const int SERVO_CENTER = 45;
const int SERVO_LEFT   = 0;
const int SERVO_RIGHT  = 90;

const unsigned long NECK_DELAY = 3000;
const unsigned long NECK_MOVE_TIME = 500;
const unsigned long NECK_RETURN_TIME = 500;

// ================================================================
// EMOTIONS
// ================================================================

enum Emotion {
  NORMAL,
  HAPPY,
  SAD,
  ANGRY,
  SURPRISED,
  SLEEPY,
  LOVE,
  EXCITED,
  SUSPICIOUS,
  DIZZY
};

Emotion currentEmotion = NORMAL;
Emotion previousEmotion = NORMAL;

// ================================================================
// PRESENCE
// ================================================================

enum PresenceState {
  PERSON_ABSENT,
  PERSON_SUSPICIOUS,
  PERSON_HAPPY,
  PERSON_SAD
};

PresenceState presenceState = PERSON_ABSENT;

// ================================================================
// GENERAL EMOTION TIMERS
// ================================================================

unsigned long emotionStartTime = 0;
unsigned long emotionDuration = 0;

// ================================================================
// PRESENCE TIMERS
// ================================================================

unsigned long stateStartTime = 0;
unsigned long lastMotionTime = 0;

// ================================================================
// LONG PRESENCE -> ANGRY
// ================================================================

unsigned long personPresentSince = 0;
unsigned long nextAngryTriggerTime = 0;

// First ANGRY after DeskMate wakes up
const unsigned long FIRST_ANGRY_DELAY = 5000; // 5 seconds

// Wait this long after the ANGRY -> DIZZY sequence before ANGRY again
const unsigned long ANGRY_REPEAT_DELAY = 7000; // 7 seconds

// ================================================================
// AUTONOMOUS EMOTION SYSTEM
// ================================================================

unsigned long nextIdleEmotionTime = 0;

bool autonomousEmotionsEnabled = true;

// ================================================================
// NECK
// ================================================================

enum NeckState {
  NECK_CENTER,
  NECK_MOVING,
  NECK_RETURNING
};

NeckState neckState = NECK_CENTER;

unsigned long neckTimer = 0;

bool neckMovingRight = true;

// ================================================================
// ANGRY SERVO
// ================================================================

bool angryShakeActive = false;

unsigned long angryShakeStart = 0;
unsigned long lastAngryMove = 0;

bool angryDirection = false;

const unsigned long ANGRY_SHAKE_DURATION = 1600;
const unsigned long ANGRY_SHAKE_INTERVAL = 120;

// ================================================================
// DIZZY
// ================================================================

unsigned long dizzyStartTime = 0;
const unsigned long DIZZY_DURATION = 2500;

// ================================================================
// EYES
// ================================================================

struct Eye {

  float x;
  float y;
  float w;
  float h;

  float pupilX;
  float pupilY;

  float targetPupilX;
  float targetPupilY;

  bool blinking;

  unsigned long blinkStart;
  unsigned long nextBlink;
};

Eye leftEye;
Eye rightEye;

// ================================================================
// DRAW HELPERS
// ================================================================

void drawFilledRoundRect(
  int x,
  int y,
  int w,
  int h,
  int r,
  int color
) {

  u8g2.setDrawColor(color);

  u8g2.drawRBox(
    x,
    y,
    w,
    h,
    r
  );
}

// ------------------------------------------------

void drawFilledRect(
  int x,
  int y,
  int w,
  int h,
  int color
) {

  u8g2.setDrawColor(color);

  u8g2.drawBox(
    x,
    y,
    w,
    h
  );
}

// ------------------------------------------------

void drawFilledCircle(
  int cx,
  int cy,
  int r,
  int color
) {

  u8g2.setDrawColor(color);

  u8g2.drawDisc(
    cx,
    cy,
    r
  );
}

// ------------------------------------------------

void drawCircleOutline(
  int cx,
  int cy,
  int r,
  int color
) {

  u8g2.setDrawColor(color);

  u8g2.drawCircle(
    cx,
    cy,
    r
  );
}

// ------------------------------------------------

void drawFilledTriangle(
  int x0,
  int y0,
  int x1,
  int y1,
  int x2,
  int y2,
  int color
) {

  u8g2.setDrawColor(color);

  u8g2.drawTriangle(
    x0,
    y0,
    x1,
    y1,
    x2,
    y2
  );
}

// ------------------------------------------------

void drawLineC(
  int x0,
  int y0,
  int x1,
  int y1,
  int color
) {

  u8g2.setDrawColor(color);

  u8g2.drawLine(
    x0,
    y0,
    x1,
    y1
  );
}

// ================================================================
// ARC
// ================================================================

void drawArcApprox(
  int cx,
  int cy,
  int rOuter,
  int rInner,
  int startDeg,
  int endDeg,
  int color
) {

  float r = (rOuter + rInner) / 2.0;

  const int stepDeg = 6;

  float prevX =
    cx + r * cos(radians((float)startDeg));

  float prevY =
    cy + r * sin(radians((float)startDeg));

  for (
    int a = startDeg + stepDeg;
    a <= endDeg;
    a += stepDeg
  ) {

    float x =
      cx + r * cos(radians((float)a));

    float y =
      cy + r * sin(radians((float)a));

    drawLineC(
      (int)prevX,
      (int)prevY,
      (int)x,
      (int)y,
      color
    );

    prevX = x;
    prevY = y;
  }
}

// ================================================================
// INITIALIZE EYES
// ================================================================

void initEyes() {

  leftEye.x = 25;
  leftEye.y = 16;
  leftEye.w = 35;
  leftEye.h = 34;

  rightEye.x = 68;
  rightEye.y = 16;
  rightEye.w = 35;
  rightEye.h = 34;

  leftEye.pupilX = 0;
  leftEye.pupilY = 0;

  rightEye.pupilX = 0;
  rightEye.pupilY = 0;

  leftEye.targetPupilX = 0;
  leftEye.targetPupilY = 0;

  rightEye.targetPupilX = 0;
  rightEye.targetPupilY = 0;

  leftEye.blinking = false;
  rightEye.blinking = false;

  leftEye.nextBlink =
    millis() + random(1500, 4000);

  rightEye.nextBlink =
    leftEye.nextBlink;
}

// ================================================================
// BLINKING
// ================================================================

void updateBlink() {

  unsigned long now = millis();

  if (
    !leftEye.blinking &&
    now >= leftEye.nextBlink
  ) {

    leftEye.blinking = true;
    rightEye.blinking = true;

    leftEye.blinkStart = now;
    rightEye.blinkStart = now;
  }

  if (leftEye.blinking) {

    if (now - leftEye.blinkStart > 130) {

      leftEye.blinking = false;
      rightEye.blinking = false;

      leftEye.nextBlink =
        now + random(2000, 6000);

      rightEye.nextBlink =
        leftEye.nextBlink;
    }
  }
}

// ================================================================
// NORMAL EYE
// ================================================================

void drawEye(
  Eye &eye,
  bool left
) {

  int x = eye.x;
  int y = eye.y;
  int w = eye.w;
  int h = eye.h;

  if (eye.blinking) {

    drawLineC(
      x,
      y + h / 2,
      x + w,
      y + h / 2,
      OLED_WHITE
    );

    return;
  }

  drawFilledRoundRect(
    x,
    y,
    w,
    h,
    9,
    OLED_WHITE
  );

  int pupilW = 15;
  int pupilH = 20;

  int px =
    x + (w - pupilW) / 2;

  int py =
    y + (h - pupilH) / 2;

  px += eye.pupilX;
  py += eye.pupilY;

  px = constrain(
    px,
    x + 3,
    x + w - pupilW - 3
  );

  py = constrain(
    py,
    y + 3,
    y + h - pupilH - 3
  );

  drawFilledRoundRect(
    px,
    py,
    pupilW,
    pupilH,
    5,
    OLED_BLACK
  );

  drawFilledCircle(
    px + 11,
    py + 4,
    2,
    OLED_WHITE
  );
}

// ================================================================
// HAPPY EYES
// ================================================================

void drawHappyEyes() {

  drawArcApprox(
    42,
    31,
    15,
    10,
    200,
    340,
    OLED_WHITE
  );

  drawArcApprox(
    85,
    31,
    15,
    10,
    200,
    340,
    OLED_WHITE
  );
}

// ================================================================
// SAD EYES
// ================================================================

void drawSadEyes() {

  drawEye(
    leftEye,
    true
  );

  drawEye(
    rightEye,
    false
  );

  drawLineC(
    27,
    14,
    55,
    20,
    OLED_BLACK
  );

  drawLineC(
    73,
    20,
    101,
    14,
    OLED_BLACK
  );

  // Small tears
  if (
    currentEmotion == SAD &&
    (millis() / 500) % 4 == 0
  ) {

    drawFilledCircle(
      32,
      48,
      2,
      OLED_WHITE
    );

    drawFilledCircle(
      96,
      48,
      2,
      OLED_WHITE
    );
  }
}

// ================================================================
// ANGRY EYES
// ================================================================

void drawAngryEyes() {

  drawFilledRoundRect(
    24,
    19,
    38,
    30,
    7,
    OLED_WHITE
  );

  drawFilledRoundRect(
    66,
    19,
    38,
    30,
    7,
    OLED_WHITE
  );

  drawFilledRoundRect(
    36,
    24,
    14,
    20,
    5,
    OLED_BLACK
  );

  drawFilledRoundRect(
    76,
    24,
    14,
    20,
    5,
    OLED_BLACK
  );

  drawLineC(
    22,
    13,
    60,
    22,
    OLED_WHITE
  );

  drawLineC(
    68,
    22,
    106,
    13,
    OLED_WHITE
  );
}

// ================================================================
// SURPRISED EYES
// ================================================================

void drawSurprisedEyes() {

  int pulse =
    (millis() / 150) % 2;

  int r =
    pulse ? 18 : 17;

  drawFilledCircle(
    43,
    31,
    r,
    OLED_WHITE
  );

  drawFilledCircle(
    85,
    31,
    r,
    OLED_WHITE
  );

  drawFilledCircle(
    43,
    31,
    7,
    OLED_BLACK
  );

  drawFilledCircle(
    85,
    31,
    7,
    OLED_BLACK
  );
}

// ================================================================
// SLEEPY EYES
// ================================================================

void drawSleepyEyes() {

  drawFilledRoundRect(
    24,
    27,
    38,
    12,
    6,
    OLED_WHITE
  );

  drawFilledRoundRect(
    66,
    27,
    38,
    12,
    6,
    OLED_WHITE
  );

  drawFilledRect(
    24,
    27,
    38,
    7,
    OLED_BLACK
  );

  drawFilledRect(
    66,
    27,
    38,
    7,
    OLED_BLACK
  );
}

// ================================================================
// HEART
// ================================================================

void drawHeart(
  int cx,
  int cy
) {

  drawFilledCircle(
    cx - 5,
    cy - 3,
    5,
    OLED_WHITE
  );

  drawFilledCircle(
    cx + 5,
    cy - 3,
    5,
    OLED_WHITE
  );

  drawFilledTriangle(
    cx - 10,
    cy - 2,
    cx + 10,
    cy - 2,
    cx,
    cy + 12,
    OLED_WHITE
  );
}

// ================================================================
// LOVE EYES
// ================================================================

void drawLoveEyes() {

  drawHeart(
    43,
    29
  );

  drawHeart(
    85,
    29
  );
}

// ================================================================
// EXCITED EYES
// ================================================================

void drawExcitedEyes() {

  drawFilledCircle(
    43,
    31,
    17,
    OLED_WHITE
  );

  drawFilledCircle(
    85,
    31,
    17,
    OLED_WHITE
  );

  drawFilledCircle(
    43,
    31,
    9,
    OLED_BLACK
  );

  drawFilledCircle(
    85,
    31,
    9,
    OLED_BLACK
  );

  // Sparkles
  drawLineC(
    34,
    20,
    38,
    24,
    OLED_WHITE
  );

  drawLineC(
    52,
    20,
    48,
    24,
    OLED_WHITE
  );

  drawLineC(
    76,
    20,
    80,
    24,
    OLED_WHITE
  );

  drawLineC(
    94,
    20,
    90,
    24,
    OLED_WHITE
  );
}

// ================================================================
// SUSPICIOUS EYES
// ================================================================

void drawSuspiciousEyes() {

  drawFilledRoundRect(
    25,
    22,
    37,
    28,
    7,
    OLED_WHITE
  );

  drawFilledRoundRect(
    66,
    22,
    37,
    28,
    7,
    OLED_WHITE
  );

  // Side-looking pupils
  int offset =
    ((millis() / 600) % 2 == 0)
      ? -4
      : 4;

  drawFilledRoundRect(
    30 + offset,
    27,
    12,
    19,
    5,
    OLED_BLACK
  );

  drawFilledRoundRect(
    73 + offset,
    27,
    12,
    19,
    5,
    OLED_BLACK
  );

  drawLineC(
    25,
    14,
    59,
    18,
    OLED_WHITE
  );

  drawLineC(
    69,
    18,
    103,
    14,
    OLED_WHITE
  );
}

// ================================================================
// DIZZY EYES
// ================================================================

void drawDizzyEyes() {

  int shift =
    ((millis() / 150) % 2) ? 2 : 0;

  drawLineC(
    28 + shift,
    20,
    57 + shift,
    47,
    OLED_WHITE
  );

  drawLineC(
    57 + shift,
    20,
    28 + shift,
    47,
    OLED_WHITE
  );

  drawLineC(
    71 - shift,
    20,
    100 - shift,
    47,
    OLED_WHITE
  );

  drawLineC(
    100 - shift,
    20,
    71 - shift,
    47,
    OLED_WHITE
  );
}

// ================================================================
// MOUTH
// ================================================================

void drawMouth() {

  int cx = 64;

  switch (currentEmotion) {

    // ------------------------------------------------
    case NORMAL:

      drawLineC(
        cx - 7,
        55,
        cx + 7,
        55,
        OLED_WHITE
      );

      break;

    // ------------------------------------------------
    case HAPPY:

      drawLineC(
        57,
        53,
        61,
        57,
        OLED_WHITE
      );

      drawLineC(
        61,
        57,
        67,
        57,
        OLED_WHITE
      );

      drawLineC(
        67,
        57,
        71,
        53,
        OLED_WHITE
      );

      break;

    // ------------------------------------------------
    case SAD:

      drawLineC(
        57,
        58,
        61,
        54,
        OLED_WHITE
      );

      drawLineC(
        61,
        54,
        67,
        54,
        OLED_WHITE
      );

      drawLineC(
        67,
        54,
        71,
        58,
        OLED_WHITE
      );

      break;

    // ------------------------------------------------
    case ANGRY:

      drawFilledRect(
        55,
        53,
        18,
        5,
        OLED_WHITE
      );

      drawLineC(
        59,
        53,
        59,
        58,
        OLED_BLACK
      );

      drawLineC(
        64,
        53,
        64,
        58,
        OLED_BLACK
      );

      drawLineC(
        69,
        53,
        69,
        58,
        OLED_BLACK
      );

      break;

    // ------------------------------------------------
    case SURPRISED:

      drawCircleOutline(
        cx,
        54,
        5,
        OLED_WHITE
      );

      break;

    // ------------------------------------------------
    case SLEEPY:

      drawLineC(
        59,
        55,
        69,
        55,
        OLED_WHITE
      );

      u8g2.setDrawColor(OLED_WHITE);

      u8g2.setFont(
        u8g2_font_5x7_tr
      );

      u8g2.drawStr(
        105,
        10,
        "Z"
      );

      u8g2.drawStr(
        114,
        7,
        "Z"
      );

      break;

    // ------------------------------------------------
    case LOVE:

      drawHeart(
        64,
        51
      );

      break;

    // ------------------------------------------------
    case EXCITED:

      drawFilledRoundRect(
        56,
        51,
        16,
        8,
        3,
        OLED_WHITE
      );

      break;

    // ------------------------------------------------
    case SUSPICIOUS:

      drawLineC(
        58,
        55,
        70,
        55,
        OLED_WHITE
      );

      break;

    // ------------------------------------------------
    case DIZZY:

      drawLineC(
        57,
        52,
        71,
        58,
        OLED_WHITE
      );

      drawLineC(
        71,
        52,
        57,
        58,
        OLED_WHITE
      );

      break;
  }
}

// ================================================================
// DRAW EMOTION
// ================================================================

void drawEmotion() {

  u8g2.clearBuffer();

  switch (currentEmotion) {

    case NORMAL:

      drawEye(
        leftEye,
        true
      );

      drawEye(
        rightEye,
        false
      );

      break;

    case HAPPY:

      drawHappyEyes();

      break;

    case SAD:

      drawSadEyes();

      break;

    case ANGRY:

      drawAngryEyes();

      break;

    case SURPRISED:

      drawSurprisedEyes();

      break;

    case SLEEPY:

      drawSleepyEyes();

      break;

    case LOVE:

      drawLoveEyes();

      break;

    case EXCITED:

      drawExcitedEyes();

      break;

    case SUSPICIOUS:

      drawSuspiciousEyes();

      break;

    case DIZZY:

      drawDizzyEyes();

      break;
  }

  drawMouth();

  u8g2.sendBuffer();
}

// ================================================================
// TEXT OLED
// ================================================================

void drawTextOLED(
  const char* line1,
  const char* line2
) {

  textOLED.clearBuffer();

  textOLED.setDrawColor(OLED_WHITE);

  textOLED.setFont(
    u8g2_font_6x10_tf
  );

  textOLED.drawStr(
    5,
    20,
    line1
  );

  textOLED.drawStr(
    5,
    40,
    line2
  );

  textOLED.sendBuffer();
}

// ================================================================
// EMOTION TEXT
// ================================================================

void updateEmotionText() {

  switch (currentEmotion) {

    case NORMAL:
      drawTextOLED(
        "DESKMATE",
        "READY"
      );
      break;

    case HAPPY:
      drawTextOLED(
        "OH, HI!",
        "NICE TO SEE YOU"
      );
      break;

    case SAD:
      drawTextOLED(
        "YOU LEFT...",
        "IM SAD."
      );
      break;

    case ANGRY:
      drawTextOLED(
        "HEY!",
        "DONT DO THAT!"
      );
      break;

    case SURPRISED:
      drawTextOLED(
        "WHOA!",
        "WHAT HAPPENED?"
      );
      break;

    case SLEEPY:
      drawTextOLED(
        "DESKMATE",
        "ZZZ... SLEEPING"
      );
      break;

    case LOVE:
      drawTextOLED(
        "<3",
        "YOU ARE GREAT"
      );
      break;

    case EXCITED:
      drawTextOLED(
        "YES!",
        "THAT WAS AWESOME!"
      );
      break;

    case SUSPICIOUS:
      drawTextOLED(
        "I SEE YOU.",
        "WHO ARE YOU?"
      );
      break;

    case DIZZY:
      drawTextOLED(
        "WHOA...",
        "IM DIZZY"
      );
      break;
  }
}

// ================================================================
// SET EMOTION
// ================================================================

void setEmotion(
  Emotion newEmotion,
  unsigned long duration = 0
) {

  if (currentEmotion != newEmotion) {

    previousEmotion =
      currentEmotion;

    Serial.print("Emotion: ");

    switch (newEmotion) {

      case NORMAL:
        Serial.println("NORMAL");
        break;

      case HAPPY:
        Serial.println("HAPPY");
        break;

      case SAD:
        Serial.println("SAD");
        break;

      case ANGRY:
        Serial.println("ANGRY");
        break;

      case SURPRISED:
        Serial.println("SURPRISED");
        break;

      case SLEEPY:
        Serial.println("SLEEPY");
        break;

      case LOVE:
        Serial.println("LOVE");
        break;

      case EXCITED:
        Serial.println("EXCITED");
        break;

      case SUSPICIOUS:
        Serial.println("SUSPICIOUS");
        break;

      case DIZZY:
        Serial.println("DIZZY");
        break;
    }
  }

  currentEmotion = newEmotion;

  emotionStartTime = millis();

  emotionDuration = duration;

  // Special emotion actions
  if (newEmotion == ANGRY) {

    angryShakeActive = true;

    angryShakeStart =
      millis();

    lastAngryMove =
      millis();

    angryDirection = false;
  }

  if (newEmotion == DIZZY) {

    dizzyStartTime =
      millis();
  }

  updateEmotionText();
}

// ================================================================
// RETURN TO NORMAL
// ================================================================

void returnToNormal() {

  setEmotion(
    NORMAL
  );

  autonomousEmotionsEnabled = true;

  nextIdleEmotionTime =
    millis() + random(5000, 10000);
}

// ================================================================
// PIR / PRESENCE
// ================================================================

void updatePresence() {

  bool pirState =
    digitalRead(PIR_PIN);

  unsigned long now =
    millis();

  // ==============================================================
  // MOTION DETECTED
  // ==============================================================

  if (pirState == HIGH) {

    lastMotionTime = now;

    // ------------------------------------------------------------
    // PERSON ARRIVES
    // ------------------------------------------------------------

    if (
      presenceState ==
      PERSON_ABSENT
    ) {

      Serial.println(
        "PERSON DETECTED!"
      );

      presenceState =
        PERSON_SUSPICIOUS;

      setEmotion(
        SUSPICIOUS,
        SUSPICIOUS_TIME
      );

      stateStartTime =
        now;

      autonomousEmotionsEnabled =
        false;
    }

    // ------------------------------------------------------------
    // PERSON RETURNS WHILE SAD
    // ------------------------------------------------------------

    else if (
      presenceState ==
      PERSON_SAD
    ) {

      Serial.println(
        "PERSON CAME BACK!"
      );

      presenceState =
        PERSON_SUSPICIOUS;

      setEmotion(
        SUSPICIOUS,
        SUSPICIOUS_TIME
      );

      stateStartTime =
        now;

      autonomousEmotionsEnabled =
        false;
    }

    // ------------------------------------------------------------
    // SUSPICIOUS → HAPPY
    // ------------------------------------------------------------

    else if (
      presenceState ==
      PERSON_SUSPICIOUS
    ) {

      if (
        now - stateStartTime >=
        SUSPICIOUS_TIME
      ) {

        Serial.println(
          "DeskMate is HAPPY!"
        );

        presenceState =
          PERSON_HAPPY;

        setEmotion(
          HAPPY,
          2500
        );

        stateStartTime =
          now;

        nextIdleEmotionTime =
          now + 3000;
      }
    }

    // ------------------------------------------------------------
    // PERSON IS PRESENT
    // ------------------------------------------------------------

    else if (
      presenceState ==
      PERSON_HAPPY
    ) {

      // Don't overwrite temporary emotions.
      if (
        currentEmotion == HAPPY &&
        now - emotionStartTime >=
        emotionDuration
      ) {

        setEmotion(
          EXCITED,
          1800
        );

        nextIdleEmotionTime =
          now + 5000;
      }
    }
  }

  // ==============================================================
  // CHECK IF PERSON LEFT
  // ==============================================================

  if (
    presenceState ==
    PERSON_HAPPY
  ) {

    if (
      now - lastMotionTime >=
      LEAVE_TIMEOUT
    ) {

      Serial.println(
        "PERSON LEFT!"
      );

      presenceState =
        PERSON_SAD;

      setEmotion(
        SAD,
        SAD_TIME
      );

      stateStartTime =
        now;

      autonomousEmotionsEnabled =
        false;
    }
  }

  // ==============================================================
  // SAD → SLEEPY
  // ==============================================================

  if (
    presenceState ==
    PERSON_SAD
  ) {

    if (
      now - stateStartTime >=
      SAD_TIME
    ) {

      Serial.println(
        "DeskMate is going to sleep."
      );

      presenceState =
        PERSON_ABSENT;

      setEmotion(
        SLEEPY
      );

      stateStartTime =
        now;

      autonomousEmotionsEnabled =
        false;
    }
  }
}

// ================================================================
// LONG PRESENCE -> ANGRY
// ================================================================

void checkLongPresenceAngry() {

  // DeskMate only does the repeating ANGRY cycle while a person
  // is present and DeskMate has woken up into PERSON_HAPPY.
  if (presenceState != PERSON_HAPPY) {
    personPresentSince = 0;
    nextAngryTriggerTime = 0;
    return;
  }

  unsigned long now = millis();

  // Start the timer when DeskMate wakes up / reaches PERSON_HAPPY.
  // The first ANGRY happens 5 seconds later.
  if (personPresentSince == 0) {
    personPresentSince = now;
    nextAngryTriggerTime = now + FIRST_ANGRY_DELAY;
    Serial.println("DeskMate woke up - ANGRY timer started!");
    return;
  }

  // Do not interrupt the ANGRY or DIZZY animation.
  if (currentEmotion == ANGRY || currentEmotion == DIZZY) {
    return;
  }

  // Repeat the ANGRY cycle.
  if (nextAngryTriggerTime != 0 && now >= nextAngryTriggerTime) {

    Serial.println("5 seconds passed - DeskMate is ANGRY!");

    autonomousEmotionsEnabled = false;
    setEmotion(ANGRY);

    // Schedule the next ANGRY after:
    // ANGRY shake + DIZZY + 7 second waiting time.
    nextAngryTriggerTime = now +
                           ANGRY_SHAKE_DURATION +
                           DIZZY_DURATION +
                           ANGRY_REPEAT_DELAY;
  }
}


// ================================================================
// AUTONOMOUS EMOTIONS
// ================================================================
//
// These are used only while a person is present.
// They prevent DeskMate from staying permanently HAPPY.
//
// Sequence:
//
// HAPPY
//   ↓
// EXCITED
//   ↓
// NORMAL
//   ↓
// SURPRISED / LOVE
//   ↓
// NORMAL
//
// This can later be replaced by your AI events.
// ================================================================


void updateAutonomousEmotions() {

  // NEVER overwrite special emotions
  if (
    currentEmotion == ANGRY ||
    currentEmotion == DIZZY ||
    currentEmotion == SAD ||
    currentEmotion == SUSPICIOUS ||
    currentEmotion == SLEEPY
  ) {
    return;
  }

  if (!autonomousEmotionsEnabled) {
    return;
  }

  if (presenceState != PERSON_HAPPY) {
    return;
  }

  unsigned long now = millis();

  if (now < nextIdleEmotionTime) {
    return;
  }

  int event = random(0, 5);

  switch (event) {

    case 0:
      setEmotion(SURPRISED, 1400);
      break;

    case 1:
      setEmotion(LOVE, 1800);
      break;

    case 2:
      setEmotion(EXCITED, 1800);
      break;

    case 3:
      setEmotion(HAPPY, 1800);
      break;

    default:
      setEmotion(NORMAL, 2000);
      break;
  }

  nextIdleEmotionTime =
    now + random(5000, 10000);
}






// ================================================================
// TEMPORARY EMOTION HANDLER
// ================================================================

void updateTemporaryEmotion() {

  if (
    emotionDuration == 0
  ) {
    return;
  }

  unsigned long now =
    millis();

  if (
    now - emotionStartTime <
    emotionDuration
  ) {
    return;
  }

  emotionDuration = 0;

  // --------------------------------------------------------------
  // ANGRY
  // --------------------------------------------------------------

  if (
    currentEmotion ==
    ANGRY
  ) {

    // The actual transition to DIZZY
    // is handled after the servo shake.
    return;
  }

  // --------------------------------------------------------------
  // DIZZY
  // --------------------------------------------------------------

  if (
    currentEmotion ==
    DIZZY
  ) {

    if (
      presenceState ==
      PERSON_HAPPY
    ) {

      setEmotion(
        NORMAL
      );

      nextIdleEmotionTime =
        now + 5000;

    } else {

      setEmotion(
        SLEEPY
      );
    }

    return;
  }

  // --------------------------------------------------------------
  // Other temporary emotions
  // --------------------------------------------------------------

  if (
    presenceState ==
    PERSON_HAPPY
  ) {

    setEmotion(
      NORMAL
    );

    nextIdleEmotionTime =
      now + random(3000, 7000);
  }
}

// ================================================================
// NORMAL NECK MOVEMENT
// ================================================================

void updateNeckMovement() {

  unsigned long now =
    millis();

  // ==============================================================
  // PERSON NOT PRESENT
  // ==============================================================

  if (
    presenceState != PERSON_HAPPY &&
    presenceState != PERSON_SUSPICIOUS
  ) {

    neckServo.write(
      SERVO_CENTER
    );

    neckState =
      NECK_CENTER;

    neckTimer =
      now;

    return;
  }

  // ==============================================================
  // WAIT
  // ==============================================================

  if (
    neckState ==
    NECK_CENTER
  ) {

    if (
      now - neckTimer >=
      NECK_DELAY
    ) {

      if (neckMovingRight) {

        Serial.println(
          "Neck -> RIGHT"
        );

        neckServo.write(
          SERVO_RIGHT
        );

      } else {

        Serial.println(
          "Neck -> LEFT"
        );

        neckServo.write(
          SERVO_LEFT
        );
      }

      neckState =
        NECK_MOVING;

      neckTimer =
        now;
    }
  }

  // ==============================================================
  // HOLD TURNED POSITION
  // ==============================================================

  else if (
    neckState ==
    NECK_MOVING
  ) {

    if (
      now - neckTimer >=
      NECK_MOVE_TIME
    ) {

      Serial.println(
        "Neck -> CENTER"
      );

      neckServo.write(
        SERVO_CENTER
      );

      neckState =
        NECK_RETURNING;

      neckTimer =
        now;
    }
  }

  // ==============================================================
  // RETURNED
  // ==============================================================

  else if (
    neckState ==
    NECK_RETURNING
  ) {

    if (
      now - neckTimer >=
      NECK_RETURN_TIME
    ) {

      neckMovingRight =
        !neckMovingRight;

      neckState =
        NECK_CENTER;

      neckTimer =
        now;
    }
  }
}

// ================================================================
// ANGRY SERVO MOVEMENT
// ================================================================

void angryNeckMovement() {

  unsigned long now =
    millis();

  // Start of angry movement
  if (!angryShakeActive) {

    angryShakeActive =
      true;

    angryShakeStart =
      now;

    lastAngryMove =
      now;

    angryDirection =
      false;
  }

  // --------------------------------------------------------------
  // FINISHED ANGRY SHAKE
  // --------------------------------------------------------------

  if (
    now - angryShakeStart >=
    ANGRY_SHAKE_DURATION
  ) {

    angryShakeActive =
      false;

    neckServo.write(
      SERVO_CENTER
    );

    Serial.println(
      "ANGRY SHAKE FINISHED"
    );

    // DeskMate gets dizzy because
    // it shook its own head.
    setEmotion(
      DIZZY,
      DIZZY_DURATION
    );

    return;
  }

  // --------------------------------------------------------------
  // RAPID LEFT / RIGHT
  // --------------------------------------------------------------

  if (
    now - lastAngryMove >=
    ANGRY_SHAKE_INTERVAL
  ) {

    if (angryDirection) {

      neckServo.write(
        65
      );

    } else {

      neckServo.write(
        25
      );
    }

    angryDirection =
      !angryDirection;

    lastAngryMove =
      now;
  }
}

// ================================================================
// DIZZY NECK
// ================================================================

void dizzyNeckMovement() {

  static unsigned long lastDizzyMove =
    0;

  static int dizzyPosition =
    SERVO_CENTER;

  unsigned long now =
    millis();

  if (
    now - lastDizzyMove >=
    250
  ) {

    int positions[] = {
      35,
      55,
      40,
      50
    };

    int index =
      (now / 250) % 4;

    dizzyPosition =
      positions[index];

    neckServo.write(
      dizzyPosition
    );

    lastDizzyMove =
      now;
  }
}

// ================================================================
// UPDATE NECK
// ================================================================

void updateNeck() {

  // --------------------------------------------------------------
  // ANGRY
  // --------------------------------------------------------------

  if (
    currentEmotion ==
    ANGRY
  ) {

    angryNeckMovement();

    return;
  }

  // --------------------------------------------------------------
  // DIZZY
  // --------------------------------------------------------------

  if (
    currentEmotion ==
    DIZZY
  ) {

    dizzyNeckMovement();

    return;
  }

  // --------------------------------------------------------------
  // LOVE
  // --------------------------------------------------------------

  if (
    currentEmotion ==
    LOVE
  ) {

    // Gentle centered movement
    unsigned long now =
      millis();

    int pos =
      SERVO_CENTER +
      (int)(
        sin(now / 500.0) * 10
      );

    neckServo.write(
      pos
    );

    return;
  }

  // --------------------------------------------------------------
  // EXCITED
  // --------------------------------------------------------------

  if (
    currentEmotion ==
    EXCITED
  ) {

    unsigned long now =
      millis();

    int pos =
      SERVO_CENTER +
      (int)(
        sin(now / 220.0) * 18
      );

    neckServo.write(
      pos
    );

    return;
  }

  // --------------------------------------------------------------
  // SURPRISED
  // --------------------------------------------------------------

  if (
    currentEmotion ==
    SURPRISED
  ) {

    unsigned long now =
      millis();

    if (
      ((now / 300) % 2) == 0
    ) {

      neckServo.write(
        SERVO_RIGHT
      );

    } else {

      neckServo.write(
        SERVO_CENTER
      );
    }

    return;
  }

  // --------------------------------------------------------------
  // SAD
  // --------------------------------------------------------------

  if (
    currentEmotion ==
    SAD
  ) {

    neckServo.write(
      SERVO_CENTER
    );

    return;
  }

  // --------------------------------------------------------------
  // SLEEPY
  // --------------------------------------------------------------

  if (
    currentEmotion ==
    SLEEPY
  ) {

    neckServo.write(
      SERVO_CENTER
    );

    return;
  }

  // --------------------------------------------------------------
  // SUSPICIOUS
  // --------------------------------------------------------------

  if (
    currentEmotion ==
    SUSPICIOUS
  ) {

    unsigned long now =
      millis();

    if (
      ((now / 700) % 2) == 0
    ) {

      neckServo.write(
        SERVO_LEFT
      );

    } else {

      neckServo.write(
        SERVO_RIGHT
      );
    }

    return;
  }

  // --------------------------------------------------------------
  // NORMAL / HAPPY
  // --------------------------------------------------------------

  updateNeckMovement();
}

// ================================================================
// SERIAL EMOTION TESTING
// ================================================================

void handleSerialCommands() {

  if (
    !Serial.available()
  ) {
    return;
  }

  String command =
    Serial.readStringUntil('\n');

  command.trim();
  command.toLowerCase();

  if (
    command == "normal"
  ) {

    setEmotion(
      NORMAL
    );

  } else if (
    command == "happy"
  ) {

    setEmotion(
      HAPPY,
      5000
    );

  } else if (
    command == "sad"
  ) {

    setEmotion(
      SAD,
      5000
    );

  } else if (
    command == "angry"
  ) {

    setEmotion(
      ANGRY
    );

  } else if (
    command == "surprised"
  ) {

    setEmotion(
      SURPRISED,
      3000
    );

  } else if (
    command == "sleepy"
  ) {

    setEmotion(
      SLEEPY
    );

  } else if (
    command == "love"
  ) {

    setEmotion(
      LOVE,
      5000
    );

  } else if (
    command == "excited"
  ) {

    setEmotion(
      EXCITED,
      5000
    );

  } else if (
    command == "suspicious"
  ) {

    setEmotion(
      SUSPICIOUS,
      5000
    );

  } else if (
    command == "dizzy"
  ) {

    setEmotion(
      DIZZY,
      DIZZY_DURATION
    );

  } else if (
    command == "help"
  ) {

    Serial.println();
    Serial.println(
      "===== DESKMATE EMOTION TEST ====="
    );

    Serial.println(
      "normal"
    );

    Serial.println(
      "happy"
    );

    Serial.println(
      "sad"
    );

    Serial.println(
      "angry"
    );

    Serial.println(
      "surprised"
    );

    Serial.println(
      "sleepy"
    );

    Serial.println(
      "love"
    );

    Serial.println(
      "excited"
    );

    Serial.println(
      "suspicious"
    );

    Serial.println(
      "dizzy"
    );

    Serial.println(
      "================================="
    );

  } else {

    Serial.println(
      "Unknown command. Type 'help'."
    );
  }
}

// ================================================================
// SETUP
// ================================================================

void setup() {

  Serial.begin(
    115200
  );

  delay(100);

  Serial.println();
  Serial.println(
    "=============================="
  );

  Serial.println(
    "DESKMATE STARTING..."
  );

  Serial.println(
    "=============================="
  );

  // ==============================================================
  // PIR
  // ==============================================================

  pinMode(
    PIR_PIN,
    INPUT
  );

  // ==============================================================
  // I2C
  // ==============================================================

  Wire.begin(
    SDA_PIN,
    SCL_PIN
  );

  // ==============================================================
  // OLED
  // ==============================================================

  u8g2.setI2CAddress(
    FACE_OLED_ADDRESS
  );

  u8g2.begin();

  textOLED.setI2CAddress(
    TEXT_OLED_ADDRESS
  );

  textOLED.begin();

  Serial.println(
    "OLED OK!"
  );

  // ==============================================================
  // RANDOM
  // ==============================================================

  randomSeed(
    analogRead(0)
  );

  // ==============================================================
  // EYES
  // ==============================================================

  initEyes();

  // ==============================================================
  // INITIAL EMOTION
  // ==============================================================

  currentEmotion =
    SLEEPY;

  presenceState =
    PERSON_ABSENT;

  stateStartTime =
    millis();

  lastMotionTime =
    millis();

  // ==============================================================
  // SERVO
  // ==============================================================

  neckServo.setPeriodHertz(
    50
  );

  neckServo.attach(
    SERVO_PIN,
    500,
    2400
  );

  neckServo.write(
    SERVO_CENTER
  );

  neckState =
    NECK_CENTER;

  neckTimer =
    millis();

  Serial.println(
    "Servo OK!"
  );

  // ==============================================================
  // FIRST SCREEN
  // ==============================================================

  drawEmotion();

  updateEmotionText();

  Serial.println(
    "DeskMate is sleeping..."
  );

  Serial.println();
  Serial.println(
    "Type 'help' for emotion testing."
  );

  Serial.println();
}

// ================================================================
// LOOP
// ================================================================

void loop() {

  // ==============================================================
  // SERIAL TESTING
  // ==============================================================

  handleSerialCommands();

  // ==============================================================
  // PIR
  // ==============================================================

  updatePresence();

  // ==============================================================
  // REPEATING ANGRY CYCLE: first after 5s, then every cycle + 7s
  // ==============================================================

  checkLongPresenceAngry();

  // ==============================================================
  // TEMPORARY EMOTIONS
  // ==============================================================

  updateTemporaryEmotion();

  // ==============================================================
  // AUTONOMOUS EMOTIONS
  // ==============================================================

  updateAutonomousEmotions();

  // ==============================================================
  // SERVO
  // ==============================================================

  updateNeck();

  // ==============================================================
  // BLINKING
  // ==============================================================

  updateBlink();

  // ==============================================================
  // OLED
  // ==============================================================

  drawEmotion();

  // ==============================================================
  // SMALL LOOP DELAY
  // ==============================================================

  delay(30);
}