import React, { useState } from 'react';
import { Send } from 'lucide-react';

export default function ChatInput({ onSendMessage, isProcessing }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || isProcessing) return;
    onSendMessage(text.trim());
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        padding: '8px',
      }}
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isProcessing ? "Pompom is thinking..." : "Talk to Pompom..."}
        disabled={isProcessing}
        maxLength={5000}
        style={{
          flex: 1,
          padding: '14px 20px',
          borderRadius: '999px',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          background: 'rgba(255, 255, 255, 0.95)',
          outline: 'none',
          fontSize: '15px',
          fontFamily: 'Outfit, sans-serif',
          color: '#1A1A2E',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)',
          transition: 'all 0.2s ease',
        }}
      />
      <button
        type="submit"
        disabled={!text.trim() || isProcessing}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: 'none',
          background: text.trim() && !isProcessing ? '#1A1A2E' : 'rgba(0,0,0,0.15)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: text.trim() && !isProcessing ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <Send size={18} />
      </button>
    </form>
  );
}
