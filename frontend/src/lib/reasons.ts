// Ridiculous reasons why the post is unavailable
export interface RidiculousReason {
  icon: string;
  title: string;
  subtitle?: string;
}

export const RIDICULOUS_REASONS: RidiculousReason[] = [
  {
    icon: '🔒',
    title: 'This post is too private to be viewed by you.',
    subtitle: "We know you want to see it. That's the problem."
  },
  {
    icon: '🤖',
    title: "The AI understood the post. You don't need to.",
    subtitle: 'Human comprehension has been deprecated for this content.'
  },
  {
    icon: '📡',
    title: 'Post lost connection to reality.',
    subtitle: 'Packets transmitted into the ether with zero survivors.'
  },
  {
    icon: '👁️',
    title: 'You are not authorized to perceive this.',
    subtitle: 'Looking directly at this post could disrupt local spacetime.'
  },
  {
    icon: '💀',
    title: 'The author deleted it 3 seconds before you opened it.',
    subtitle: 'They had second thoughts. You were not invited.'
  },
  {
    icon: '🌌',
    title: 'This post exists in another dimension.',
    subtitle: 'Currently orbiting a parallel universe with 42 likes.'
  },
  {
    icon: '🫥',
    title: 'This content was too honest for social media.',
    subtitle: 'Redacted for your own emotional safety.'
  },
  {
    icon: '📜',
    title: 'Post archived before publication.',
    subtitle: 'It was wonderful. You will never know.'
  }
];

export function getReasonForPost(postId?: number | string): RidiculousReason {
  if (!postId) {
    return RIDICULOUS_REASONS[Math.floor(Math.random() * RIDICULOUS_REASONS.length)];
  }
  const numericId = typeof postId === 'string' ? parseInt(postId, 10) || 0 : postId;
  return RIDICULOUS_REASONS[Math.abs(numericId) % RIDICULOUS_REASONS.length];
}
