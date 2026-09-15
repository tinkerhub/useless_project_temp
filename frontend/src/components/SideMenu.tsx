'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function SideMenu() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { href: '/feed', icon: '🏠', label: 'Feed', desc: 'Hidden posts' },
    { href: '/explore', icon: '🔥', label: 'Explore', desc: 'Unavailable trends' },
    { href: '/notifications', icon: '🔔', label: 'Alerts', desc: 'Useless pings' },
    { href: '/premium', icon: '⭐', label: 'Premium', desc: 'Pay to see nothing' },
  ];

  return (
    <aside style={{
      width: '260px',
      flexShrink: 0,
      position: 'sticky',
      top: '84px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      alignSelf: 'flex-start'
    }}>
      {/* Navigation Card */}
      <div className="glass" style={{ padding: '16px' }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '4px 12px 10px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '8px'
        }}>
          Navigation
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {navItems.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  background: active ? 'var(--surface-2)' : 'transparent',
                  border: active ? '1px solid rgba(124,92,252,0.3)' : '1px solid transparent',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.color = 'var(--text)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: active ? 600 : 500, fontSize: '0.9rem' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', opacity: 0.8 }}>
                    {item.desc}
                  </div>
                </div>
                {active && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }} />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Profile Summary Card */}
      {user && (
        <div className="glass-sm" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div className="avatar avatar-sm">{user.username[0].toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                @{user.username}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {user.is_premium ? '⭐ Premium Member' : 'Standard Ghost'}
              </div>
            </div>
          </div>
          <Link
            href={`/profile/${user.username}`}
            className="btn-ghost"
            style={{
              display: 'block',
              textAlign: 'center',
              textDecoration: 'none',
              fontSize: '0.8rem',
              padding: '6px 12px',
              width: '100%'
            }}
          >
            View Your Profile
          </Link>
        </div>
      )}

      {/* Satirical note */}
      <div style={{
        padding: '12px 14px',
        borderRadius: '10px',
        border: '1px dashed var(--border)',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
        lineHeight: 1.5
      }}>
        🔒 <strong>Anti-Social Guarantee</strong><br/>
        Zero clicks will ever lead you to actual content.
      </div>
    </aside>
  );
}
