import React, { useState, useEffect } from 'react';
import LandingScreen from './components/LandingScreen.jsx';
import MoodEnvironment from './components/MoodEnvironment.jsx';
import PompomAvatar from './components/PompomAvatar.jsx';
import MoodIndicator from './components/MoodIndicator.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import ChatInput from './components/ChatInput.jsx';
import { RotateCcw } from 'lucide-react';
import { speak } from './services/voice.js';

const SHORTCUT_MOODS = {
  '1': 'excited', '!': 'excited',
  '2': 'sad', '@': 'sad',
  '3': 'angry', '#': 'angry',
  '4': 'dramatic', '$': 'dramatic',
  '5': 'sleepy', '%': 'sleepy',
  '6': 'shy', '^': 'shy',
  '7': 'confused', '&': 'confused',
  '8': 'toddler', '*': 'toddler',
  '9': 'overprotective', '(': 'overprotective',
  '0': 'bargainer', ')': 'bargainer',
};

export default function App() {
  const [landingVisible, setLandingVisible] = useState(false);
  const [mood, setMood] = useState({ mood: 'excited', intensity: 50 });
  const [moodReason, setMoodReason] = useState('Pompom is ready to chat!');
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [forcedMood, setForcedMood] = useState(null);

  // Fetch initial random mood on startup
  useEffect(() => {
    fetch('https://useless-project-temp-gamma-one.vercel.app/api/initial-mood')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.mood) {
          setMood(data.mood);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch initial mood from API, using default', err);
      });
  }, []);

  // Developer Keyboard Shortcuts (Ctrl + Shift + 1..6, Ctrl + Shift + R)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey) {
        if (SHORTCUT_MOODS[e.key]) {
          e.preventDefault();
          const newMoodName = SHORTCUT_MOODS[e.key];
          setForcedMood(newMoodName);
          setMood((prev) => ({ ...prev, mood: newMoodName }));
          setMoodReason(`[DEV] Forced mood to ${newMoodName.toUpperCase()}`);
          setIsError(false);
          // Automatically navigate to chat so the user can see the change
          if (window.location.hash !== '#chat') {
            window.location.hash = '#chat';
          }
        } else if (e.key === 'R' || e.key === 'r') {
          e.preventDefault();
          handleResetSession();
          if (window.location.hash !== '#chat') {
            window.location.hash = '#chat';
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResetSession = () => {
    setMessages([]);
    setIsError(false);
    setForcedMood(null);
    fetch('https://useless-project-temp-gamma-one.vercel.app/api/initial-mood')
      .then((r) => r.json())
      .then((d) => {
        if (d?.mood) setMood(d.mood);
      })
      .catch(() => {
        setMood({ mood: 'excited', intensity: 50 });
      });
    setMoodReason('Session reset! Pompom is feeling fresh.');
  };

  const handleSendMessage = async (text) => {
    if (!text || isProcessing) return;

    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsProcessing(true);

    try {
      const response = await fetch('https://useless-project-temp-gamma-one.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          mood,
          history: messages,
          forcedMood,
        }),
      });

      const data = await response.json();

      if (data?.mood) {
        setMood(data.mood);
      }

      if (data?.moodReason) {
        setMoodReason(data.moodReason);
      }

      const botMsg = {
        role: 'assistant',
        content: data?.response || "Uh... my brain did a little loop.",
        mood: data?.mood?.mood || mood.mood,
      };

      setMessages((prev) => [...prev, botMsg]);
      speak(botMsg.content, botMsg.mood);
      setIsError(!data?.success);
    } catch (err) {
      console.error('[MoodPet Client] Chat request failed:', err);
      setIsError(true);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "...brain.exe stopped responding. Give me a sec.",
          mood: 'sleepy',
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <MoodEnvironment mood={mood.mood} intensity={mood.intensity} />

      {landingVisible ? (
        <LandingScreen
          onStartChat={() => setLandingVisible(false)}
          initialMood={mood}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '16px',
            maxWidth: '680px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Header */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <h1
              style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '1.6rem',
                fontWeight: '700',
                color: '#1A1A2E',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              MoodPet
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.7)',
                  color: '#333',
                  textTransform: 'uppercase',
                }}
              >
                Pompom
              </span>
            </h1>

            <button
              onClick={handleResetSession}
              title="Reset Chat Session (Ctrl+Shift+R)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '999px',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.8)',
                color: '#1A1A2E',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>

          {/* Avatar & Mood Badge Section */}
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <PompomAvatar
              mood={mood.mood}
              intensity={mood.intensity}
              isThinking={isProcessing}
              isError={isError}
            />
            <MoodIndicator
              mood={mood.mood}
              intensity={mood.intensity}
              moodReason={moodReason}
            />
          </div>

          {/* Main Chat Container */}
          <div
            className="glass-panel"
            style={{
              width: '100%',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '24px',
              overflow: 'hidden',
              marginTop: '12px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
            }}
          >
            <ChatWindow
              messages={messages}
              isProcessing={isProcessing}
              currentMood={mood}
            />
            <ChatInput
              onSendMessage={handleSendMessage}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      )}
    </>
  );
}
