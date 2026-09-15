'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function FloatingBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/feed', label: 'Feed' },
    { href: '/explore', label: 'Explore' },
    { href: '/notifications', label: 'Alerts' },
    { href: '/premium', label: 'Premium' },
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 90,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none'
    }}>
      <div
        className="glass"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          borderRadius: '40px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          pointerEvents: 'auto',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)'
        }}
      >
        {navItems.map(item => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 18px',
                borderRadius: '30px',
                textDecoration: 'none',
                color: active ? 'var(--text)' : 'var(--text-muted)',
                background: active ? 'var(--surface-2)' : 'transparent',
                fontWeight: active ? 600 : 500,
                fontSize: '0.88rem',
                letterSpacing: '-0.01em',
                border: active ? '1px solid rgba(124, 92, 252, 0.35)' : '1px solid transparent',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative'
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.color = 'var(--text)';
                  e.currentTarget.style.background = 'var(--surface-2)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
