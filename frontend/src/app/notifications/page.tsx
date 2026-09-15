'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import FloatingBottomNav from '@/components/FloatingBottomNav';

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
    if (user) loadNotifs();
  }, [user, loading]);

  const loadNotifs = async () => {
    setFetching(true);
    try {
      const data = await api.getNotifications();
      setNotifs(data);
      await api.markAllRead();
    } catch {}
    setFetching(false);
  };

  const handleClick = (n: any) => {
    if (n.post_id) router.push(`/post/${n.post_id}`);
    else if (n.actor?.username) router.push(`/profile/${n.actor.username}`);
  };

  const typeIcon: Record<string, string> = {
    like: '❤️',
    comment: '💬',
    follow: '👤',
    new_post: '📝'
  };

  const timeAgo = (ts: string) => {
    if (!ts) return '';
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (loading) return null;

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '80px', maxWidth: '600px', margin: '0 auto', padding: '80px 16px 90px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Notifications</h1>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            (clicking leads nowhere useful)
          </span>
        </div>

        {fetching ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass" style={{ padding: '16px', marginBottom: '8px', display: 'flex', gap: '12px' }}>
              <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: '13px', width: '80%', marginBottom: '6px' }} />
                <div className="skeleton" style={{ height: '11px', width: '40%' }} />
              </div>
            </div>
          ))
        ) : notifs.length === 0 ? (
          <div className="glass" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔔</div>
            <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>No notifications</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              When something happens, you'll know.<br/>
              But you still won't see what it was.
            </p>
          </div>
        ) : (
          notifs.map((n: any) => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              className="glass"
              style={{
                padding: '16px 20px', marginBottom: '8px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '14px',
                transition: 'transform 0.15s ease',
                borderLeft: !n.read ? '3px solid var(--accent)' : '3px solid transparent'
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateX(4px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = '')}
            >
              <div className="avatar avatar-sm">{n.actor?.username?.[0]?.toUpperCase() || '?'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: '2px' }}>
                  <span style={{ marginRight: '6px' }}>{typeIcon[n.type] || '🔔'}</span>
                  {n.message}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeAgo(n.timestamp)}</div>
              </div>
              {n.post_id && (
                <div style={{
                  width: '36px', height: '36px', borderRadius: '6px',
                  background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', flexShrink: 0
                }}>
                  🔒
                </div>
              )}
            </div>
          ))
        )}

        {notifs.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>
            That's all. None of them will show you the post.
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation Bar */}
      <FloatingBottomNav />
    </>
  );
}
