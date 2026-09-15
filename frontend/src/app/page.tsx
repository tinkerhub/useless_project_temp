'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/feed');
  }, [user, loading]);

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Background blobs */}
      <div style={{
        position: 'absolute', top: '-200px', left: '-200px',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,92,252,0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-200px', right: '-200px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Hero content */}
      <div style={{ textAlign: 'center', maxWidth: '600px', zIndex: 1 }} className="slide-up">
        <div style={{ fontSize: '5rem', marginBottom: '16px' }}>🫥</div>

        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '16px' }}>
          <span className="gradient-text">Anti</span>
          <span style={{ color: 'var(--text)' }}>Social</span>
        </h1>

        <p style={{ fontSize: '1.3rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.6 }}>
          Connect. Share. Be completely isolated.
        </p>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '40px', opacity: 0.5 }}>
          *Content visibility not guaranteed. Or provided. At all.
        </p>

        {/* Features grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '40px' }}>
          {[
            { icon: '✅', text: 'Real accounts' },
            { icon: '✅', text: 'Real notifications' },
            { icon: '✅', text: 'Real likes & comments' },
            { icon: '🚫', text: 'Visible posts' },
          ].map((f, i) => (
            <div key={i} className="glass-sm" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
              <span>{f.icon}</span>
              <span style={{ color: f.icon === '🚫' ? 'var(--text-muted)' : 'var(--text)' }}>{f.text}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href="/auth/register">
            <button className="btn-primary" style={{ fontSize: '1rem', padding: '14px 32px' }}>
              Get Started (for free)
            </button>
          </Link>
          <Link href="/auth/login">
            <button className="btn-ghost" style={{ fontSize: '1rem', padding: '14px 32px' }}>
              Sign In
            </button>
          </Link>
        </div>

        <p style={{ marginTop: '24px', fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.4 }}>
          Join 0 people who know exactly what their friends are thinking.<br/>
          (They don't.)
        </p>
      </div>
    </main>
  );
}
