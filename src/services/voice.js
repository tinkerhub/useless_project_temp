// Minimal Voice/TTS system using Web Speech API

const MOOD_VOICE_CONFIG = {
  excited: { pitch: 1.2, rate: 1.2, volume: 1 },
  sad: { pitch: 0.8, rate: 0.8, volume: 0.7 },
  angry: { pitch: 0.9, rate: 1.3, volume: 1 },
  dramatic: { pitch: 0.7, rate: 0.7, volume: 1 },
  sleepy: { pitch: 0.6, rate: 0.6, volume: 0.5 },
  shy: { pitch: 1.1, rate: 0.9, volume: 0.6 },
  confused: { pitch: 1.0, rate: 0.9, volume: 0.8 },
  toddler: { pitch: 1.4, rate: 1.1, volume: 1 },
  overprotective: { pitch: 0.9, rate: 0.9, volume: 0.9 },
  bargainer: { pitch: 1.0, rate: 1.1, volume: 1 },
};

let currentUtterance = null;

export function speak(text, mood = 'excited') {
  if (!window.speechSynthesis) {
    console.warn('SpeechSynthesis API not supported in this browser.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Create new utterance
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Apply mood config
  const config = MOOD_VOICE_CONFIG[mood] || MOOD_VOICE_CONFIG.excited;
  utterance.pitch = config.pitch;
  utterance.rate = config.rate;
  utterance.volume = config.volume;

  // Try to find a good English voice (preferably female/childlike for Pompom)
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    // Prefer Google UK English Female, or any English Female voice
    let selectedVoice = voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Female'));
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en-'));
    }
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  }

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeech() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// Pre-load voices to avoid delay on first speak
if (window.speechSynthesis) {
  window.speechSynthesis.getVoices();
}
