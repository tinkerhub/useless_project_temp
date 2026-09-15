'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await api.searchUsers(searchQuery);
        setSearchResults(results);
        setShowDropdown(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('as_theme') as 'dark' | 'light' | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.className = saved;
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('as_theme', next);
    document.documentElement.className = next;
    document.documentElement.setAttribute('data-theme', next);
  };

  if (!user) return null;

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'var(--surface)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      height: '64px',
      display: 'flex', alignItems: 'center',
      padding: '0 24px',
      justifyContent: 'space-between',
      gap: '16px'
    }}>
      {/* Logo */}
      <Link href="/feed" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{ fontSize: '1.3rem' }}>🤐</span>
        <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
          <span className="gradient-text">Anti</span>
          <span style={{ color: 'var(--text-muted)' }}>Social</span>
        </span>
      </Link>

      {/* Top Search Bar for Accounts */}
      <div ref={searchRef} style={{ position: 'relative', flex: '1', maxWidth: '420px', margin: '0 12px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{
            position: 'absolute', left: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', pointerEvents: 'none'
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className="input"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => {
              if (searchQuery.trim()) setShowDropdown(true);
            }}
            placeholder="Search accounts... (@handle or name)"
            style={{
              paddingLeft: '38px',
              paddingRight: searchQuery ? '34px' : '14px',
              height: '40px',
              fontSize: '0.88rem',
              borderRadius: '20px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowDropdown(false);
              }}
              style={{
                position: 'absolute', right: '12px', background: 'none', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && searchQuery.trim().length > 0 && (
          <div className="glass" style={{
            position: 'absolute', top: '48px', left: 0, right: 0,
            maxHeight: '340px', overflowY: 'auto', zIndex: 220,
            padding: '8px', boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            border: '1px solid var(--border)', borderRadius: '12px'
          }}>
            {isSearching ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Searching accounts...
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No accounts found. (Even if they existed, their posts would be hidden.)
              </div>
            ) : (
              searchResults.map(result => (
                <div
                  key={result.id}
                  onClick={() => {
                    setShowDropdown(false);
                    setSearchQuery('');
                    router.push(`/profile/${result.username}`);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div className="avatar avatar-sm">{result.username[0].toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>
                        @{result.username}
                      </span>
                      {result.is_premium && <span className="premium-badge">PRO</span>}
                    </div>
                    {result.bio && (
                      <div style={{
                        fontSize: '0.78rem', color: 'var(--text-muted)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {result.bio}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent)', opacity: 0.8 }}>View 🔒</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* User menu & Actions */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <div className="avatar avatar-sm" style={{ width: '34px', height: '34px', fontSize: '0.85rem' }}>
            {user.username[0].toUpperCase()}
          </div>
          {user.is_premium && <span className="premium-badge">PRO</span>}
        </button>

        {menuOpen && (
          <div className="glass-sm" style={{
            position: 'absolute', right: 0, top: '44px',
            minWidth: '200px', padding: '8px', zIndex: 200,
            boxShadow: '0 12px 32px rgba(0,0,0,0.3)'
          }}>
            <Link href={`/profile/${user.username}`}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', color: 'var(--text)', textDecoration: 'none', borderRadius: '8px', fontSize: '0.9rem' }}
              onClick={() => setMenuOpen(false)}>
              <span>👤</span> Profile
            </Link>

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={{
                width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer',
                borderRadius: '8px', fontSize: '0.9rem'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
                <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: '4px' }}>
                Switch
              </span>
            </button>

            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />

            <button
              onClick={() => { logout(); router.push('/'); setMenuOpen(false); }}
              style={{
                width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer',
                borderRadius: '8px', fontSize: '0.9rem'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,77,109,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span>🚪</span> Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
