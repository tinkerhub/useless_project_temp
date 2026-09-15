'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      router.push('/feed');
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="glass" style={{ padding: '40px', width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🫥</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Nothing has changed. The posts are still hidden.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.88rem', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '4px', padding: '14px', fontSize: '1rem' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link href="/auth/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Sign up</Link>
        </p>
      </div>
    </main>
  );
}
