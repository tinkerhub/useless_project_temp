/**
 * Contacts & Accounts Module — Client profiles for multi-user simulation
 */

export const CLIENT_ACCOUNTS = [
  {
    id: 'alice',
    name: 'Alice Johnson',
    initials: 'AJ',
    avatarColor: '#e91e63',
    phone: '+1 555-0101',
    about: 'Always in the know 👀',
    status: 'online',
    isGroup: false
  },
  {
    id: 'bob',
    name: 'Bob Smith',
    initials: 'BS',
    avatarColor: '#2196f3',
    phone: '+1 555-0102',
    about: 'Working from home 💻',
    status: 'online',
    isGroup: false
  },
  {
    id: 'carol',
    name: 'Carol Williams',
    initials: 'CW',
    avatarColor: '#9c27b0',
    phone: '+1 555-0103',
    about: 'Living my best life ✨',
    status: 'online',
    isGroup: false
  },
  {
    id: 'david',
    name: 'David Brown',
    initials: 'DB',
    avatarColor: '#ff5722',
    phone: '+1 555-0104',
    about: '📍 At the gym',
    status: 'online',
    isGroup: false
  },
  {
    id: 'emma',
    name: 'Emma Davis',
    initials: 'ED',
    avatarColor: '#00bcd4',
    phone: '+1 555-0105',
    about: 'Coffee & code ☕',
    status: 'online',
    isGroup: false
  }
];

export const GROUPS = [
  {
    id: 'group_workteam',
    name: 'Work Team 💼',
    initials: 'WT',
    avatarColor: '#607d8b',
    about: 'Official work communications',
    isGroup: true,
    members: ['alice', 'bob', 'carol', 'david', 'emma']
  },
  {
    id: 'group_college',
    name: 'College Crew 🎓',
    initials: 'CC',
    avatarColor: '#ff9800',
    about: 'Batch of 2022 reuniting!',
    isGroup: true,
    members: ['alice', 'bob', 'carol']
  }
];

export function getEntity(id) {
  const account = CLIENT_ACCOUNTS.find(c => c.id === id);
  if (account) return account;
  const group = GROUPS.find(g => g.id === id);
  if (group) return group;
  return null;
}

export function generateAvatar(entity) {
  if (!entity) return { initials: '?', color: '#888' };
  return {
    initials: entity.initials || entity.name.charAt(0),
    color: entity.avatarColor || '#888'
  };
}
