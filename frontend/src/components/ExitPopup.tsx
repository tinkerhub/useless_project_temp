'use client';
import { useEffect, useRef, useState } from 'react';

export default function ExitPopup() {
  const [show, setShow] = useState(false);
  const [stayed, setStayed] = useState(false);
  const triggered = useRef(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 10 && !triggered.current) {
        triggered.current = true;
        setShow(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, []);

  if (!show) return null;

  if (stayed) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.3s ease'
      }}>
        <div className="glass" style={{ padding: '40px', maxWidth: '420px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🤔</div>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '12px', color: 'var(--text)' }}>
            You chose to stay.
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
            Someone posted something while you were away.<br/>
            You still don't know what it was.
          </p>
          <button className="btn-ghost" onClick={() => setShow(false)} style={{ width: '100%' }}>
            Continue wondering
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div className="glass" style={{ padding: '40px', maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🫥</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text)' }}>
          Are you sure you want to leave?
        </h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '28px' }}>
          Someone posted something while you were away.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <a href="about:blank" className="btn-ghost">Leave</a>
          <button
            className="btn-primary"
            onClick={() => { setStayed(true); }}
          >
            Stay and wonder what it was
          </button>
        </div>
      </div>
    </div>
  );
}
