import React, { useRef, useEffect } from 'react';
import ThinkingState from './ThinkingState.jsx';

export default function ChatWindow({ messages, isProcessing, currentMood }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        maxHeight: '460px',
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {messages.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            margin: 'auto',
            color: 'rgba(0, 0, 0, 0.45)',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '16px',
          }}
        >
          Say hi to Pompom! Ask anything or see how Pompom responds...
        </div>
      )}

      {messages.map((msg, idx) => {
        const isUser = msg.role === 'user';
        const msgMood = msg.mood || currentMood?.mood || 'excited';

        let animName = 'bubble-fade-slow';
        if (msgMood === 'excited') animName = 'bubble-pop-in';
        if (msgMood === 'angry') animName = 'bubble-shake-in';

        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isUser ? 'flex-end' : 'flex-start',
              width: '100%',
            }}
          >
            <div
              style={{
                maxWidth: '82%',
                padding: '12px 18px',
                borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                background: isUser ? '#1A1A2E' : 'rgba(255, 255, 255, 0.92)',
                color: isUser ? '#FFFFFF' : '#1A1A2E',
                fontSize: '15px',
                lineHeight: '1.45',
                fontFamily: 'Outfit, sans-serif',
                boxShadow: isUser
                  ? '0 4px 14px rgba(0, 0, 0, 0.15)'
                  : '0 4px 18px rgba(0, 0, 0, 0.08)',
                animation: isUser ? 'none' : `${animName} 0.4s ease-out forwards`,
                position: 'relative',
                wordBreak: 'break-word',
              }}
            >
              {msg.content}
            </div>
          </div>
        );
      })}

      {isProcessing && <ThinkingState />}

      <div ref={bottomRef} />
    </div>
  );
}
