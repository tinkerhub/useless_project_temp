'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import FloatingBottomNav from '@/components/FloatingBottomNav';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
    if (user) loadProfile();
  }, [user, loading, params.username]);

  const loadProfile = async () => {
    setFetching(true);
    try {
      const data = await api.getProfile(params.username as string);
      setProfile(data);
      setFollowing(data.is_following);
    } catch {}
    setFetching(false);
  };

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      if (following) {
        await api.unfollow(profile.id);
        setFollowing(false);
        setProfile((p: any) => ({ ...p, followers: p.followers - 1 }));
      } else {
        await api.follow(profile.id);
        setFollowing(true);
        setProfile((p: any) => ({ ...p, followers: p.followers + 1 }));
      }
    } catch {}
    setFollowLoading(false);
  };

  if (loading || fetching) return null;
  if (!profile) return <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>User not found.</div>;

  const isOwnProfile = user?.username === profile.username;

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '80px', maxWidth: '640px', margin: '0 auto', padding: '80px 16px 90px' }}>

        {/* Profile header */}
        <div className="glass" style={{ padding: '28px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '20px' }}>
            <div className="avatar avatar-lg">{profile.username[0].toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{profile.username}</h1>
                {profile.is_premium && <span className="premium-badge">PRO</span>}
              </div>
              {profile.bio && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>{profile.bio}</p>
              )}
              <div style={{ display: 'flex', gap: '20px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                <span><strong style={{ color: 'var(--text)' }}>{profile.post_count}</strong> posts</span>
                <span><strong style={{ color: 'var(--text)' }}>{profile.followers}</strong> followers</span>
                <span><strong style={{ color: 'var(--text)' }}>{profile.following}</strong> following</span>
              </div>
            </div>
            {!isOwnProfile && (
              <button
                className={following ? 'btn-ghost' : 'btn-primary'}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {following ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>

          {following && !isOwnProfile && (
            <div style={{ padding: '10px 14px', background: 'rgba(124,92,252,0.1)', borderRadius: '8px', fontSize: '0.84rem', color: 'var(--accent)', border: '1px solid rgba(124,92,252,0.2)' }}>
              You are now following {profile.username}. You still cannot see their posts.
            </div>
          )}
        </div>

        {/* Posts grid */}
        <h2 style={{ fontWeight: 700, marginBottom: '14px', fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Posts — {profile.post_count}
        </h2>

        {profile.posts.length === 0 ? (
          <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>
              {isOwnProfile ? "You haven't posted anything yet. (You'd never see it anyway.)" : `${profile.username} hasn't posted anything. (Or has they? We'll never know.)`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {profile.posts.map((p: any) => (
              <div
                key={p.id}
                onClick={() => router.push(`/post/${p.id}`)}
                style={{
                  aspectRatio: '1', borderRadius: '10px', cursor: 'pointer',
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '6px', transition: 'transform 0.15s ease'
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                onMouseLeave={e => (e.currentTarget.style.transform = '')}
              >
                <span style={{ fontSize: '1.6rem' }}>🔒</span>
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
