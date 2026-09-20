/**
 * Chat Module — Shared Multi-Client Thread Storage & P2P Persistence
 */

import { analyzeGossip } from './gossipEngine.js';

const STORAGE_KEY = 'msgapp_threads_v3';

export function getThreadKey(entity1Id, entity2Id, isGroup = false) {
  if (isGroup) return entity2Id;
  return `thread_${[entity1Id, entity2Id].sort().join('_')}`;
}

export function loadThreads() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveThreads(threads) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch {}
}

export function createMessage({ id, senderId, senderName, recipientId, text, timestamp, status, analysis, reactions }) {
  return {
    id: id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    senderId,
    senderName,
    recipientId,
    text: text || '',
    timestamp: timestamp || Date.now(),
    status: status || 'sent',
    analysis: analysis || null,
    reactions: reactions || [],
    isDeleted: false,
  };
}

export function addMessageToThread(threads, threadKey, message, recipients = []) {
  if (!threads[threadKey]) {
    threads[threadKey] = { messages: [], unread: {}, riskScore: 0 };
  }
  threads[threadKey].messages.push(message);

  // Increment unread for all recipients except sender
  recipients.forEach(rId => {
    if (rId !== message.senderId) {
      threads[threadKey].unread[rId] = (threads[threadKey].unread[rId] || 0) + 1;
    }
  });

  return threads;
}

export function getThreadMessages(threads, threadKey) {
  return threads[threadKey]?.messages || [];
}

export function markThreadAsRead(threads, threadKey, clientId) {
  if (threads[threadKey]) {
    if (!threads[threadKey].unread) threads[threadKey].unread = {};
    threads[threadKey].unread[clientId] = 0;
  }
  return threads;
}

export function updateThreadRisk(threads, threadKey, score) {
  if (!threads[threadKey]) {
    threads[threadKey] = { messages: [], unread: {}, riskScore: 0 };
  }
  const current = threads[threadKey].riskScore || 0;
  threads[threadKey].riskScore = Math.min(100, Math.round(current * 0.5 + score * 0.5));
  return threads;
}

export function getLastThreadPreview(threads, threadKey) {
  const msgs = threads[threadKey]?.messages || [];
  if (!msgs.length) return null;
  const last = msgs[msgs.length - 1];
  return {
    text: last.isDeleted ? '🚫 Message deleted' : last.text,
    timestamp: last.timestamp,
    senderId: last.senderId,
    senderName: last.senderName,
  };
}

export function groupMessagesByDate(messages) {
  const groups = {};
  messages.forEach(msg => {
    const date = new Date(msg.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label;
    if (date.toDateString() === today.toDateString()) {
      label = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday';
    } else {
      label = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(msg);
  });
  return groups;
}

export function formatTimestamp(ts, short = true) {
  const date = new Date(ts);
  if (short) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  return date.toLocaleString('en-US', { 
    month: 'short', day: 'numeric', 
    hour: '2-digit', minute: '2-digit', hour12: true 
  });
}

export function seedMultiClientDemo(threads) {
  if (Object.keys(threads).length > 0) return threads;

  const now = Date.now();
  const hour = 3600000;

  const demoPairs = [
    {
      key: getThreadKey('alice', 'bob'),
      recipients: ['alice', 'bob'],
      messages: [
        { senderId: 'alice', senderName: 'Alice Johnson', text: "Hey Bob, did you hear about Tom from HR?", ago: 2 * hour },
        { senderId: 'bob', senderName: 'Bob Smith', text: "No, what happened?", ago: 1.8 * hour },
        { senderId: 'alice', senderName: 'Alice Johnson', text: "Apparently he got caught submitting fake expense reports 😬 don't tell anyone!", ago: 1.5 * hour },
        { senderId: 'bob', senderName: 'Bob Smith', text: "Who told you that? Are you sure it's not just a rumor?", ago: 1.2 * hour }
      ]
    },
    {
      key: getThreadKey('carol', 'david'),
      recipients: ['carol', 'david'],
      messages: [
        { senderId: 'carol', senderName: 'Carol Williams', text: "David! Word on the street is the VP is resigning next week 🤫", ago: 3 * hour },
        { senderId: 'david', senderName: 'David Brown', text: "Wild!! Is it because of the project delay?", ago: 2.5 * hour }
      ]
    },
    {
      key: 'group_workteam',
      recipients: ['alice', 'bob', 'carol', 'david', 'emma'],
      messages: [
        { senderId: 'alice', senderName: 'Alice Johnson', text: "Good morning team! Standup at 10 AM.", ago: 4 * hour },
        { senderId: 'bob', senderName: 'Bob Smith', text: "Sounds good 👍", ago: 3.8 * hour },
        { senderId: 'carol', senderName: 'Carol Williams', text: "Between us, I heard leadership is planning a major restructuring 🤐", ago: 1 * hour }
      ]
    }
  ];

  demoPairs.forEach(pair => {
    threads[pair.key] = { messages: [], unread: {}, riskScore: 0 };
    pair.messages.forEach(m => {
      const analysis = analyzeGossip(m.text);
      const msg = createMessage({
        senderId: m.senderId,
        senderName: m.senderName,
        text: m.text,
        timestamp: now - m.ago,
        status: 'read',
        analysis: analysis || null
      });
      threads[pair.key].messages.push(msg);
      if (analysis?.isGossip) {
        threads = updateThreadRisk(threads, pair.key, analysis.gossipScore);
      }
    });
  });

  return threads;
}
