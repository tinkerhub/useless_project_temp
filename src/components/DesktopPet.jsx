import React, { useState, useEffect } from 'react';
import PompomAvatar from './PompomAvatar.jsx';

export default function DesktopPet() {
  const [moodState, setMoodState] = useState({ mood: 'excited', intensity: 50 });

  useEffect(() => {
    // Initial fetch just in case SSE connects too late to get current state
    fetch('https://useless-project-temp-gamma-one.vercel.app/api/initial-mood')
      .then(r => r.json())
      .then(d => {
        if (d?.mood) setMoodState(d.mood);
      })
      .catch(console.error);

    // Listen for server-sent events for live mood updates
    const eventSource = new EventSource('/api/mood-sync');
    eventSource.onmessage = (event) => {
      try {
        const newMoodState = JSON.parse(event.data);
        if (newMoodState && newMoodState.mood) {
          setMoodState(newMoodState.mood);
        }
      } catch (err) {
        console.error('Failed to parse SSE mood data', err);
      }
    };

    return () => eventSource.close();
  }, []);

  const handleDoubleClick = () => {
    if (window.electron && window.electron.openMainApp) {
      window.electron.openMainApp();
    }
  };

  return (
    <div
      onDoubleClick={handleDoubleClick}
      style={{
        width: '250px',
        height: '250px',
        WebkitAppRegion: 'drag', // Allow dragging the borderless window
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      <div style={{ width: '200px', height: '200px', pointerEvents: 'none' }}>
        <PompomAvatar mood={moodState.mood} intensity={moodState.intensity} />
      </div>
    </div>
  );
}
