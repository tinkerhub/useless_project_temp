'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import FloatingBottomNav from '@/components/FloatingBottomNav';

type PremiumState = 'idle' | 'paying' | 'paid';

export default function PremiumPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<PremiumState>('idle');
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
    if (user) loadInfo();
  }, [user, loading]);

  const loadInfo = async () => {
    try {
      const data = await api.getPremiumInfo();
      setInfo(data);
    } catch {}
  };

  const handleSubscribe = async () => {
    setState('paying');
    // Simulate payment processing moment for comedic effect
    await new Promise(r => setTimeout(r, 2200));
    try {
      await api.subscribe();
      await refreshUser();
      setState('paid');
    } catch {
      setState('idle');
    }
  };

  if (loading) return null;

  // Already premium — show the "you paid and it's still null" screen
  if (user?.is_premium && state !== 'paid') {
    return (
      <>
        <Navbar />
        <main style={{ paddingTop: '80px', maxWidth: '520px', margin: '0 auto', padding: '80px 16px 40px' }}>
          <div className="glass" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⭐</div>
            <span className="premium-badge" style={{ display: 'inline-block', marginBottom: '16px', fontSize: '0.85rem', padding: '4px 14px' }}>
              ANTI-SOCIAL PREMIUM™
            </span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px' }}>You're a Premium member.</h1>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '24px' }}>
              You can now see who posted.<br/>
              You can see when they posted.<br/>
              You can see the like count.<br/>
              You can see that there are comments.
            </p>
            <div style={{
              padding: '16px', background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.2)',
              borderRadius: '10px', marginBottom: '28px', color: 'var(--danger)', fontWeight: 600
            }}>
              You still cannot see the post.
            </div>
            <button className="btn-ghost" onClick={() => router.push('/feed')}>
              Go back to not seeing posts →
            </button>
          </div>
        </main>
      </>
    );
  }

  // Payment success screen
  if (state === 'paid') {
    return (
      <>
        <Navbar />
        <main style={{ paddingTop: '80px', maxWidth: '520px', margin: '0 auto', padding: '80px 16px 40px' }}>
          <div className="glass" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '8px' }}>Payment successful.</h1>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 400, color: 'var(--text-muted)', marginBottom: '24px' }}>Congratulations.</h2>
            <div style={{
              padding: '20px', background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.2)',
              borderRadius: '12px', marginBottom: '28px'
            }}>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--danger)' }}>
                You still can't see the post.
              </p>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '28px', lineHeight: 1.6 }}>
              ₹99 has been charged.<br/>
              Your access to not seeing posts has been upgraded.
            </div>
            <button className="btn-primary" onClick={() => router.push('/feed')}>
              Return to the void
            </button>
          </div>
        </main>
      </>
    );
  }

  // Payment processing
  if (state === 'paying') {
    return (
      <>
        <Navbar />
        <main style={{ paddingTop: '80px', maxWidth: '520px', margin: '0 auto', padding: '80px 16px 40px' }}>
          <div className="glass" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '20px', animation: 'spin 1s linear infinite' }}>💳</div>
            <h2 style={{ fontWeight: 600, marginBottom: '8px' }}>Processing payment...</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Taking your ₹99.<br/>
              Preparing to not show you the post.
            </p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </main>
      </>
    );
  }

  // Default premium page
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '80px', maxWidth: '520px', margin: '0 auto', padding: '80px 16px 40px' }}>
        <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
          {/* Badge */}
          <span className="premium-badge" style={{ display: 'inline-block', marginBottom: '20px', fontSize: '0.85rem', padding: '4px 16px' }}>
            ANTI-SOCIAL PREMIUM™
          </span>

          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '8px' }}>₹99<span style={{ fontWeight: 400, fontSize: '1rem', color: 'var(--text-muted)' }}>/month</span></h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.9rem' }}>
            The premium social media experience. Redefining what premium means.
          </p>

          {/* Features */}
          <div style={{ textAlign: 'left', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: '✓', text: 'See who posted', color: 'var(--green)' },
              { icon: '✓', text: 'See when they posted', color: 'var(--green)' },
              { icon: '✓', text: 'See how many people liked it', color: 'var(--green)' },
              { icon: '✓', text: 'See that there are comments', color: 'var(--green)' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem' }}>
                <span style={{ color: f.color, fontWeight: 700, fontSize: '1rem' }}>{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}

            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--danger)', fontWeight: 700 }}>✗</span>
              <span style={{ color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text)' }}>Still can't see the post</strong>
              </span>
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={handleSubscribe}
            style={{ width: '100%', padding: '16px', fontSize: '1rem', marginBottom: '12px' }}
          >
            Subscribe → ₹99/month
          </button>

          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.6, opacity: 0.6 }}>
            By subscribing, you acknowledge that content will remain inaccessible in perpetuity.
            No refunds for emotional distress. Curiosity is not covered under any warranty.
          </p>
        </div>
      </main>

      {/* Floating Bottom Navigation Bar */}
      <FloatingBottomNav />
    </>
  );
}
