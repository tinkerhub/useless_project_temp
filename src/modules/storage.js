/**
 * RumorRadar - Session Storage, Preset Scenarios & Dossier Exporter
 */

export const SAMPLE_CATEGORIES = ['All', 'Workplace', 'Tech & AI', 'Pop Culture', 'Financial', 'Verified'];

export const SAMPLE_SCENARIOS = [
  {
    id: 'office_layoff',
    category: 'Workplace',
    title: '🏢 Layoff Secret',
    preview: 'Did you hear that Marcus from Sales told everyone...',
    text: 'Did you hear that Marcus from Sales told everyone the CEO is secretly laying off 40% of the engineering team next Friday behind closed doors?'
  },
  {
    id: 'corporate_fraud',
    category: 'Financial',
    title: '💼 CFO Embezzlement',
    preview: 'Rumor has it the CFO is being forced to resign...',
    text: 'Rumor has it the CFO is being forced to resign because internal auditors caught him embezzling funds and cooking the quarterly reports.'
  },
  {
    id: 'ai_leak',
    category: 'Tech & AI',
    title: '🤖 Secret Model Leak',
    preview: 'Someone on Blind claimed an insider leaked...',
    text: 'Someone on Blind claimed an insider told them the lead AI researcher rage-quit last night after secretly downloading the unreleased model weights to an external SSD.'
  },
  {
    id: 'celebrity_tea',
    category: 'Pop Culture',
    title: '🫖 Celebrity Secret Affair',
    preview: 'Don’t tell anyone but a friend of mine saw...',
    text: 'Don’t tell anyone, but a friend of mine saw the star couple arguing, and apparently he was caught red-handed having a secret affair with her best friend!'
  },
  {
    id: 'covert_promotion',
    category: 'Workplace',
    title: '🤫 Secret Nepotism Deal',
    preview: 'Between you and me, word on the street is...',
    text: 'Between you and me, word on the street is that Elena only got promoted to VP because her uncle sits on the board of directors, and everyone knows she faked her resume metrics.'
  },
  {
    id: 'startup_buyout',
    category: 'Financial',
    title: '📈 Hostile Takeover',
    preview: 'A reliable source whispered that...',
    text: 'A reliable source whispered that a rival conglomerate is quietly staging a hostile takeover and plans to axe the entire executive board next quarter.'
  },
  {
    id: 'factual_update',
    category: 'Verified',
    title: '📋 Sprint Sync (Control)',
    preview: 'The quarterly roadmap meeting is scheduled for 10am...',
    text: 'The quarterly roadmap sync is scheduled for Thursday at 10:00 AM in Conference Room 3, and the official agenda is published on Confluence.'
  },
  {
    id: 'official_press_release',
    category: 'Verified',
    title: '📰 Official Press Release (Control)',
    preview: 'According to today\'s SEC 10-K filing...',
    text: 'According to today’s official SEC Form 8-K filing, Acme Corp closed its Series B financing round with $25M in direct capital led by Sequoia Capital.'
  }
];

const STORAGE_KEY = 'rumor_radar_messages_v2';
const SETTINGS_KEY = 'rumor_radar_settings_v2';

export function loadStoredMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('rumor_radar_messages_v1');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveStoredMessages(messages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (e) {}
}

export function loadSettings() {
  const defaultSettings = {
    persona: 'auditor',
    sensitivity: 'balanced',
    soundEnabled: true,
    voiceEnabled: true,
    radarMode: 'sweep',
    geminiApiKey: ''
  };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch (e) {
    return defaultSettings;
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {}
}

/**
 * Generates an intelligence audit dossier formatted in Markdown or JSON
 */
export function exportDossier(messages, format = 'markdown') {
  if (format === 'json') {
    return JSON.stringify(messages, null, 2);
  }

  // Markdown Dossier format
  let md = `# 🛰️ RUMOR RADAR - GOSSIP INTELLIGENCE AUDIT DOSSIER\n`;
  md += `Generated on: ${new Date().toLocaleString()}\n`;
  md += `Total Transmissions Analyzed: ${messages.length}\n\n`;
  md += `---\n\n`;

  messages.forEach((msg, idx) => {
    if (msg.sender === 'user') {
      md += `### Transmission #${idx + 1} [INPUT CLAIM]\n`;
      md += `**Timestamp:** ${new Date(msg.timestamp).toLocaleTimeString()}\n`;
      md += `**Content:** "${msg.text}"\n\n`;

      if (msg.analysis) {
        const a = msg.analysis;
        md += `- **Gossip Probability:** ${a.gossipScore}%\n`;
        md += `- **Spiciness Level:** ${a.spicinessLabel}\n`;
        md += `- **Virality Index:** ${a.viralityScore || 0}%\n`;
        md += `- **Defamation / Legal Hazard:** ${a.riskLevel}\n`;
        md += `- **Target Entities:** ${a.targets.length > 0 ? a.targets.join(', ') : 'None extracted'}\n`;
        md += `- **Detected Markers:** ${a.markers.map(m => `[${m.label}: "${m.snippet}"]`).join(', ') || 'None'}\n`;
        md += `- **Verdict:** ${a.verdict}\n\n`;
      }
    } else {
      md += `> **Radar Response (${msg.personaName || 'AI'}):**\n> ${msg.text.replace(/\n/g, '\n> ')}\n\n`;
      md += `---\n\n`;
    }
  });

  return md;
}
