'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import PostCard from '@/components/PostCard';
import ExitPopup from '@/components/ExitPopup';

import FloatingBottomNav from '@/components/FloatingBottomNav';

export default function FeedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [postMsg, setPostMsg] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
    if (user) loadFeed();
  }, [user, loading]);

  const loadFeed = async () => {
    setFetching(true);
    try {
      const data = await api.getFeed();
      setPosts(data);
    } catch {}
    setFetching(false);
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    setPosting(true);
    try {
      await api.createPost({ content: postContent });
      setPostContent('');
      setPostMsg("Post created. It has been hidden from everyone.");
      setTimeout(() => setPostMsg(''), 4000);
      loadFeed();
    } catch {}
    setPosting(false);
  };

  if (loading) return null;

  return (
    <>
      <Navbar />
      <ExitPopup />
      <main style={{
        paddingTop: '84px',
        maxWidth: '640px',
        margin: '0 auto',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingBottom: '90px'
      }}>
        {/* Create post */}
        <div className="glass" style={{ padding: '20px', marginBottom: '20px' }}>
          <form onSubmit={handlePost}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div className="avatar">{user?.username[0].toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <textarea
                  className="input"
                  placeholder="What's on your mind? (It will be hidden immediately.)"
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  rows={3}
                  style={{ resize: 'none', marginBottom: '10px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn-primary" type="submit" disabled={posting || !postContent.trim()}>
                    {posting ? 'Hiding...' : 'Post (into the void)'}
                  </button>
                </div>
              </div>
            </div>
            {postMsg && (
              <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(124,92,252,0.1)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--accent)', border: '1px solid rgba(124,92,252,0.2)' }}>
                {postMsg}
              </div>
            )}
          </form>
        </div>

        {/* Feed */}
        {fetching ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass" style={{ padding: '20px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: '14px', width: '120px', marginBottom: '6px' }} />
                  <div className="skeleton" style={{ height: '11px', width: '60px' }} />
                </div>
              </div>
              <div className="skeleton" style={{ height: '60px', borderRadius: '10px', marginBottom: '12px' }} />
              <div className="skeleton" style={{ height: '11px', width: '100px' }} />
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="glass" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🫥</div>
            <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>Nothing to see here.</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Follow people to see their posts.<br/>
              (You still won't be able to read them.)
            </p>
          </div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} onLikeToggle={loadFeed} />)
        )}
      </main>

      {/* Floating Bottom Navigation Bar (Instagram-style) */}
      <FloatingBottomNav />
    </>
  );
}
