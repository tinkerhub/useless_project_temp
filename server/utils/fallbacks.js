const FALLBACK_MESSAGES = [
  "...brain.exe stopped responding. Give me a sec.",
  "Uh oh. My thoughts just fell down the stairs.",
  "I had an answer. It was here literally one second ago...",
  "System sleepy. Brain loading... probably.",
  "Okay, my tiny brain needs a moment.",
  "Oops, my thoughts did a backflip. Try asking again?"
];

export function getLocalFallbackResponse(errorType = 'provider_error', currentMoodState = null) {
  const randomIndex = Math.floor(Math.random() * FALLBACK_MESSAGES.length);
  const responseText = FALLBACK_MESSAGES[randomIndex];

  const mood = currentMoodState?.mood || 'sleepy';
  const intensity = Math.min(100, (currentMoodState?.intensity || 50) + 10);

  return {
    success: false,
    errorType,
    mood: {
      mood: 'sleepy',
      intensity: 100,
    },
    moodReason: "API error / rate limit reached.",
    response: responseText,
    catchType: "trailing",
    avatar: {
      mood: 'sleepy',
      intensity: 100,
      state: 'conked-out',
      event: 'error',
    },
  };
}
