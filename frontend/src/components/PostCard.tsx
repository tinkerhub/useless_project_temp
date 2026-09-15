'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { RIDICULOUS_REASONS } from '@/lib/reasons';

export default function PostCard({ post, onLikeToggle }: { post: any; onLikeToggle?: () => void }) {
  const { user } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [liking, setLiking] = useState(false);
  const [reason] = useState(() => RIDICULOUS_REASONS[Math.floor(Math.random() * RIDICULOUS_REASONS.length)]);

  const timeAgo = (ts: string) => {
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liking) return;
    setLiking(true);
    try {
      const token = localStorage.getItem('as_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/likes/${post.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setLiked(data.liked);
      setLikeCount(data.likes);
      onLikeToggle?.();
    } catch {}
    setLiking(false);
  };

  return (
    <div
      className="glass"
      style={{ padding: '20px', marginBottom: '12px', cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(124,92,252,0.15)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
      onClick={() => router.push(`/post/${post.id}`)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <Link
          href={`/profile/${post.author.username}`}
          onClick={e => e.stopPropagation()}
          style={{ textDecoration: 'none' }}
        >
          <div className="avatar" style={{ cursor: 'pointer' }}>
            {post.author.username[0].toUpperCase()}
          </div>
        </Link>
        <div>
          <Link
            href={`/profile/${post.author.username}`}
            onClick={e => e.stopPropagation()}
            style={{
              fontWeight: 600,
              fontSize: '0.95rem',
              color: 'var(--text)',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'color 0.45s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text)')}
          >
            {post.author.username}
          </Link>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {timeAgo(post.timestamp)}
          </div>
        </div>
      </div>

      {/* Unavailable Content Box - larger & less round border with ridiculous reasons */}
      <div style={{
        padding: '36px 24px',
        textAlign: 'center',
        background: 'var(--surface-2)',
        borderRadius: '6px',
        border: '1px dashed rgba(124,92,252,0.3)',
        marginBottom: '18px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '4px' }}>{reason.icon}</div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px', maxWidth: '460px' }}>
          {reason.title}
        </h3>
        {reason.subtitle && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6, maxWidth: '420px', margin: '0 auto 12px' }}>
            {reason.subtitle}
          </p>
        )}
        <button
          className="btn-ghost"
          style={{ fontSize: '0.82rem', padding: '6px 16px', borderRadius: '4px' }}
          onClick={e => {
            e.stopPropagation();
            router.push('/premium');
          }}
        >
          ⭐ Upgrade to Premium — still won't work
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <button
          onClick={handleLike}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            color: liked ? 'var(--danger)' : 'var(--text-muted)',
            fontSize: '0.88rem', fontWeight: liked ? 600 : 400,
            transition: 'all 0.2s ease',
            transform: liking ? 'scale(1.2)' : 'scale(1)'
          }}
        >
          {liked ? '❤️' : '🤍'} {likeCount}
        </button>

        <button
          onClick={e => { e.stopPropagation(); router.push(`/post/${post.id}`); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.88rem' }}
        >
          💬 {post.comments}
        </button>

        <button
          onClick={e => { e.stopPropagation(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.88rem' }}
        >
          🔗 Share
        </button>
      </div>
    </div>
  );
}
