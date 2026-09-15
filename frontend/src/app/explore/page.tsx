 'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';

import FloatingBottomNav from '@/components/FloatingBottomNav';

const FAKE_TRENDING = [
  { topic: 'Something', interactions: '14.2K' },
  { topic: 'Something else', interactions: '8.7K' },
  { topic: 'A thing that happened', interactions: '5.1K' },
  { topic: 'Whatever this is', interactions: '3.4K' },
  { topic: 'You know what', interactions: '2.8K' },
];

export default function ExplorePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
    if (user) loadExplore();
  }, [user, loading]);

  const loadExplore = async () => {
    setFetching(true);
    try {
      const data = await api.getExplore();
      setPosts(data);
    } catch {}
    setFetching(false);
  };

  if (loading) return null;

  return (
    <>
      <Navbar />
      <main style={{
        paddingTop: '84px',
        maxWidth: '680px',
        margin: '0 auto',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingBottom: '90px'
      }}>

        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '24px' }}>Explore</h1>

        {/* Trending */}
        <div className="glass" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <span style={{ fontSize: '1.2rem' }}>🔥</span>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Trending</h2>
          </div>

          {FAKE_TRENDING.map((t, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0',
              borderBottom: i < FAKE_TRENDING.length - 1 ? '1px solid var(--border)' : 'none'
            }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>{t.topic}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {t.interactions} interactions
                </div>
              </div>
              <div style={{
                background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.2)',
                borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', color: 'var(--text-muted)'
              }}>
                Unavailable
              </div>
            </div>
          ))}

          <div style={{
            marginTop: '16px', padding: '12px', background: 'var(--surface-2)',
            borderRadius: '10px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)',
            fontStyle: 'italic'
          }}>
            You cannot see any of these.
          </div>
        </div>

        {/* Suggested users */}
        <div className="glass" style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>👤 You might know</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '20px 0', fontStyle: 'italic' }}>
            Some people. You cannot see who they are or what they've posted.
          </p>
        </div>

        {/* Recent posts grid (all locked) */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Recent</h2>

        {fetching ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ aspectRatio: '1', borderRadius: '10px' }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>Nothing here yet. But even if there was, you couldn't see it.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {posts.map((p: any) => (
              <div
                key={p.id}
                onClick={() => router.push(`/post/${p.id}`)}
                style={{
                  aspectRatio: '1', borderRadius: '10px', cursor: 'pointer',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '4px', transition: 'transform 0.15s ease',
                  position: 'relative', overflow: 'hidden'
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={e => (e.currentTarget.style.transform = '')}
              >
                <span style={{ fontSize: '1.5rem' }}>🔒</span>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  ❤️ {p.likes} 💬 {p.comments}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation Bar */}
      <FloatingBottomNav />
    </>
  );
}
