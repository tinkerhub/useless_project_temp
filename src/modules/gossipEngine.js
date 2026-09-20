/**
 * RumorRadar - Gossip & Hearsay NLP Detection Engine
 * Multi-layer heuristic analyzer for unverified claims, watercooler whispers,
 * virality forecasting, rumor mutation simulation, counter-narrative generation,
 * and Two-Person Dialogue / Chat Contagion Forensics.
 */

// Heuristic dictionaries & regex patterns (Massively Expanded)
const HEARSAY_PATTERNS = [
  // Hooks & Openers
  { regex: /\b(did you hear|have you heard|heard that|heard from|heard about|you didn'?t hear this from me)\b/gi, weight: 22, label: 'Hearsay Hook' },
  { regex: /\b(rumor has it|rumours? (say|have it|are)|word on the street|whispers (are|say)|grapevine)\b/gi, weight: 25, label: 'Rumor Invocation' },
  // Sourcing & Epistemic Distance
  { regex: /\b(someone told me|somebody said|a friend told me|my coworker said|people are saying|they say that|everybody knows that|friend of a friend)\b/gi, weight: 24, label: 'Unattributed Sourcing' },
  { regex: /\b(apparently|supposedly|allegedly|reportedly|purportedly|seemingly|lowkey heard)\b/gi, weight: 18, label: 'Epistemic Distance' },
  { regex: /\b(a little birdie told me|insider info|secret sources?|sources tell me|reliable source|anonymous source)\b/gi, weight: 22, label: 'Shadow Sourcing' },
  // Secrecy & Covert Ops
  { regex: /\b(don'?t tell anyone|keep this (between us|secret|quiet)|off the record|promise not to tell|strictly between you and me|keep it on the down low|hush hush)\b/gi, weight: 26, label: 'Confidentiality Leak' },
  { regex: /\b(behind (his|her|their|everyone'?s?) back|secretly|in private|behind closed doors|in the shadows)\b/gi, weight: 16, label: 'Covert Behavior Speculation' },
  // Modern Slang & Speculation
  { regex: /\b(spill(ing)? the tea|juicy drama|the real tea|drama alert|dish the dirt|throwing shade|dropping receipts|spilling beans)\b/gi, weight: 25, label: 'Explicit Gossip Slang' },
  { regex: /\b(i wouldn'?t be surprised if|mark my words|just wait and see|something fishy|doesn'?t add up|sus)\b/gi, weight: 14, label: 'Speculative Premonition' }
];

const SENSATIONALISM_PATTERNS = [
  // Extreme Adjectives
  { regex: /\b(scandal(ous)?|shocking|insane|wild|crazy|unbelievable|mind-blowing|outrageous|unhinged)\b/gi, weight: 12, label: 'Sensational Adjective' },
  // Drama Escalators
  { regex: /\b(messy|absolute chaos|trainwreck|disaster|dumpster fire|shitshow|catastrophe)\b/gi, weight: 15, label: 'Drama Escalator' },
  // Accusations & Exposés
  { regex: /\b(caught (red-handed|in 4k|cheating|stealing|lying)|busted|exposed|ruined|canceled|dragged|called out)\b/gi, weight: 18, label: 'Sensational Accusation' },
  // Character Assassination
  { regex: /\b(backstabb(ed|ing|er)|snake|toxic|scheming|narcissist|fake|two-faced|hypocrite|gaslighting|red flag|sociopath)\b/gi, weight: 16, label: 'Character Assailment' }
];

const DEFAMATION_RISK_PATTERNS = [
  // Workplace / Employment
  { regex: /\b(fired|getting sacked|terminated|getting axed|laid off secretly|forced to resign|rage quit|on a pip|demoted|stealing clients)\b/gi, weight: 18, label: 'Employment Gossip' },
  // Romance / Relationships
  { regex: /\b(affair|cheating on|hooking up with|sleeping with|secret lover|mistress|divorce|broke up|side chick|secretly dating|sugar daddy)\b/gi, weight: 22, label: 'Relationship/Infidelity Gossip' },
  // Legal & Severe Misconduct
  { regex: /\b(embezzl(ed|ing)|stealing money|fraud|corrupt|bribe|illegal|cover-up|lawsuit|tax evasion|arrested|went to jail)\b/gi, weight: 26, label: 'Legal/Misconduct Accusation' },
  // Financial & Status
  { regex: /\b(broke|bankrupt|massive debt|trust fund|losing money|can'?t afford|drowning in debt)\b/gi, weight: 15, label: 'Financial Status Gossip' },
  // Social & Appearance
  { regex: /\b(plastic surgery|botox|ozempic|eating disorder|ghosted|excluded|uninvited|fake friends|social climber)\b/gi, weight: 14, label: 'Social/Appearance Gossip' },
  // Professional Competence
  { regex: /\b(incompetent|has no idea what they are doing|total fraud|fake resume|nepo baby|sleaze)\b/gi, weight: 16, label: 'Professional Slander' }
];

const GROUNDING_PATTERNS = [
  // Hard Evidence
  { regex: /\b(https?:\/\/[^\s]+)\b/gi, weight: -20, label: 'Verified Web Link' },
  { regex: /\b(official announcement|press release|published in|direct quote|i saw with my own eyes|i personally witnessed)\b/gi, weight: -18, label: 'Direct Eyewitness/Citation' },
  { regex: /\b(signed contract|internal memo|public record|financial statement|documentation|police report)\b/gi, weight: -15, label: 'Documentary Evidence' },
  // Pushback
  { regex: /\b(who told you that|where did you see that|do you have proof|did you see it yourself|are you sure|that'?s just a rumor|stop spreading rumors)\b/gi, weight: -16, label: 'Critical Hearsay Challenge' }
];

/**
 * Extracts potential target entities (names, titles, organizations) from text
 */
function extractTargets(text) {
  const targets = new Set();
  
  const roleRegex = /\b(the (?:ceo|cto|cfo|manager|boss|director|vp|intern|hr|team lead|founder))\b/gi;
  let match;
  while ((match = roleRegex.exec(text)) !== null) {
    targets.add(match[1].toLowerCase());
  }

  const properNounRegex = /\b([A-Z][a-z]{2,15}(?:\s+[A-Z][a-z]{2,15})?)(?:\s+(?:from|in|at)\s+([A-Za-z]+))?\b/g;
  while ((match = properNounRegex.exec(text)) !== null) {
    const candidate = match[0].trim();
    const ignoredWords = ['Did', 'Have', 'Someone', 'People', 'Word', 'Rumor', 'Apparently', 'Don', 'Between', 'Just', 'Wait', 'Well', 'They', 'Look', 'What', 'How', 'When', 'Where', 'Why', 'There', 'This', 'That', 'Alice', 'Bob', 'Marcus', 'Sarah'];
    if (!ignoredWords.includes(candidate)) {
      targets.add(candidate);
    }
  }

  return Array.from(targets);
}

/**
 * Main analysis function for an individual statement
 */
export function analyzeGossip(text, sensitivity = 'balanced') {
  if (!text || text.trim().length === 0) {
    return {
      gossipScore: 0,
      spiciness: 'mild',
      spicinessLabel: '🌱 Chilled Fact',
      riskLevel: 'None',
      isGossip: false,
      viralityScore: 0,
      defamationScore: 0,
      markers: [],
      targets: [],
      verdict: 'Empty or trivial input',
      verificationSteps: ['Enter a claim or whisper to scan for gossip.'],
      metrics: { hearsayScore: 0, sensationalismScore: 0, riskScore: 0, groundingScore: 0, viralityScore: 0, defamationScore: 0 }
    };
  }

  const markers = [];
  let hearsayScore = 0;
  let sensationalismScore = 0;
  let riskScore = 0;
  let groundingScore = 0;

  // 1. Scan Hearsay Patterns
  for (const item of HEARSAY_PATTERNS) {
    item.regex.lastIndex = 0;
    const matches = text.match(item.regex);
    if (matches) {
      hearsayScore += item.weight * Math.min(matches.length, 2);
      markers.push({ type: 'hearsay', label: item.label, snippet: matches[0], weight: item.weight });
    }
  }

  // 2. Scan Sensationalism Patterns
  for (const item of SENSATIONALISM_PATTERNS) {
    item.regex.lastIndex = 0;
    const matches = text.match(item.regex);
    if (matches) {
      sensationalismScore += item.weight * Math.min(matches.length, 2);
      markers.push({ type: 'sensationalism', label: item.label, snippet: matches[0], weight: item.weight });
    }
  }

  // 3. Scan Defamation / Risk Patterns
  for (const item of DEFAMATION_RISK_PATTERNS) {
    item.regex.lastIndex = 0;
    const matches = text.match(item.regex);
    if (matches) {
      riskScore += item.weight * Math.min(matches.length, 2);
      markers.push({ type: 'risk', label: item.label, snippet: matches[0], weight: item.weight });
    }
  }

  // 4. Scan Grounding / Proof Patterns
  for (const item of GROUNDING_PATTERNS) {
    item.regex.lastIndex = 0;
    const matches = text.match(item.regex);
    if (matches) {
      groundingScore += Math.abs(item.weight) * Math.min(matches.length, 2);
      markers.push({ type: 'grounding', label: item.label, snippet: matches[0], weight: item.weight });
    }
  }

  // 5. Target Entity Extraction
  const targets = extractTargets(text);
  if (targets.length > 0) {
    hearsayScore += Math.min(targets.length * 10, 20);
  }

  // Sensitivity Multiplier
  let multiplier = 1.0;
  if (sensitivity === 'lenient') multiplier = 0.8;
  if (sensitivity === 'paranoid') multiplier = 1.35;

  const rawScore = (hearsayScore * 1.1 + sensationalismScore * 0.9 + riskScore * 1.0 - groundingScore * 1.2) * multiplier;
  const gossipScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  const viralityRaw = (hearsayScore * 0.7 + sensationalismScore * 1.2 + (targets.length > 0 ? 25 : 0)) * 0.9;
  const viralityScore = Math.max(5, Math.min(99, Math.round(viralityRaw)));

  const defamationRaw = (riskScore * 1.4 + (targets.length > 0 ? 20 : 0)) * (gossipScore > 40 ? 1 : 0.4);
  const defamationScore = Math.max(0, Math.min(100, Math.round(defamationRaw)));

  let spiciness = 'mild';
  let spicinessLabel = '🌱 Low Heat / Objective';
  if (gossipScore >= 80) {
    spiciness = 'nuclear';
    spicinessLabel = '🔥 Nuclear Drama / Wild Hearsay';
  } else if (gossipScore >= 55) {
    spiciness = 'spicy';
    spicinessLabel = '🌶️🌶️ Hot Tea / Strong Gossip';
  } else if (gossipScore >= 30) {
    spiciness = 'medium';
    spicinessLabel = '🌶️ Simmering Speculation';
  }

  let riskLevel = 'Low';
  if (defamationScore >= 60 || riskScore >= 35 || (gossipScore >= 75 && targets.length > 0)) {
    riskLevel = 'Critical Defamation Risk';
  } else if (defamationScore >= 30 || riskScore >= 20 || targets.length > 0) {
    riskLevel = 'Moderate Reputational Hazard';
  } else if (gossipScore >= 40) {
    riskLevel = 'Low to Moderate';
  }

  const isGossip = gossipScore >= 35;
  const { verdict, verificationSteps } = generateVerdictAndAdvice(gossipScore, targets, markers, riskLevel);

  return {
    gossipScore,
    isGossip,
    spiciness,
    spicinessLabel,
    riskLevel,
    viralityScore,
    defamationScore,
    markers,
    targets,
    verdict,
    verificationSteps,
    metrics: {
      hearsayScore: Math.min(100, Math.round(hearsayScore)),
      sensationalismScore: Math.min(100, Math.round(sensationalismScore)),
      riskScore: Math.min(100, Math.round(riskScore)),
      groundingScore: Math.min(100, Math.round(groundingScore)),
      viralityScore,
      defamationScore
    }
  };
}

function generateVerdictAndAdvice(score, targets, markers, riskLevel) {
  let verdict = '';
  const verificationSteps = [];
  const targetStr = targets.length > 0 ? targets.join(', ') : 'unnamed parties';

  if (score >= 80) {
    verdict = `🚨 HIGH ALERT: Highly viral, unverified gossip targeting ${targetStr}. Contains severe hearsay markers and high speculation.`;
    verificationSteps.push('Do NOT forward or amplify this claim in public channels.');
    verificationSteps.push('Demand primary source evidence (written statements, official notices, or firsthand testimony).');
    verificationSteps.push('Assess potential slander/defamation liabilities for circulating this rumor.');
  } else if (score >= 55) {
    verdict = `⚠️ NOTICE: Probable watercooler gossip. Secondhand information with sensational undertones.`;
    verificationSteps.push('Treat this as unconfirmed watercooler chatter until corroborating records emerge.');
    verificationSteps.push(`Ask the speaker: "Did you witness this firsthand, or did someone pass it on to you?"`);
  } else if (score >= 30) {
    verdict = `🔍 SPECULATIVE: Contains vague assertions or slight hearsay markers, but lacks severe malice.`;
    verificationSteps.push('Look for documentation or follow-up announcements to verify.');
  } else {
    verdict = `✅ VERIFIED / FACTUAL: Low hearsay signature. Information appears grounded, objective, or self-reported.`;
    verificationSteps.push('Claim appears anchored in direct statement, neutral observation, or primary sources.');
  }

  return { verdict, verificationSteps };
}

/**
 * Simulates how a claim mutates across the Telephone Game
 */
export function generateMutationStages(text, analysis) {
  const target = analysis.targets[0] || 'the team';
  
  return [
    {
      stage: 1,
      name: '🌱 The Catalyst Event',
      teller: 'Direct Participant / Primary Witness',
      distortion: '0%',
      hearsayLevel: 'Low (Factual Basis)',
      content: `A neutral operational conversation or routine update occurred involving ${target}. Details were pending official documentation.`
    },
    {
      stage: 2,
      name: '☕ Watercooler Infiltration',
      teller: 'Colleague Overhearing Half-Context',
      distortion: '35%',
      hearsayLevel: 'Moderate (Speculative Framing)',
      content: `Someone overheard snippets by the coffee machine and mentioned to a colleague: "I think something big might be happening with ${target} soon."`
    },
    {
      stage: 3,
      name: '🔥 The Telephone Game Amplification',
      teller: 'Secondhand Social / Slack DM',
      distortion: '75%',
      hearsayLevel: 'High (Sensational Mutation)',
      content: `"${text}" (The narrative added emotional adjectives, secret sourcing, and urgent alarmism).`
    },
    {
      stage: 4,
      name: '🌪️ Full Contagion / Crisis Myth',
      teller: 'Group Chat Echo Chamber',
      distortion: '98%',
      hearsayLevel: 'Extreme (Mythic Proportions)',
      content: `Everyone in the group chat is now convinced ${target} has already triggered an unprecedented disaster, executive firings are locked in, and authorities have arrived!`
    }
  ];
}

/**
 * Generates an official PR Counter-Narrative & Refutation Statement
 */
export function generateCounterNarrative(analysis, originalText) {
  const target = analysis.targets[0] || 'affected departments';
  const score = analysis.gossipScore;
  const isHighRisk = score >= 60;

  return `### 📋 OFFICIAL CLARIFICATION & COUNTER-STATEMENT
**Subject:** Refutation of Unverified Hearsay Regarding ${target}  
**Classification:** ${isHighRisk ? 'HIGH-PRIORITY CRISIS CORRECTION' : 'ROUTINE INFORMATIONAL ALIGNMENT'}  
**Status:** FACT-CHECKED & AUTHORIZED

---

**1. Executive Summary:**
In response to circulating informal whispers claiming: *"${originalText.replace(/[*_#]/g, '')}"*, an evidentiary audit was conducted. This communication is ungrounded in authorized directives or validated records.

**2. Key Factual Clarifications:**
- **Primary Source Evidence:** No written notices, executive authorizations, or formal filings exist to substantiate this claim.
- **Linguistic Distortion:** The circulating narrative exhibits a **${score}% hearsay signature**, indicating secondhand distortion and speculation rather than direct observation.
- **Current Operational Reality:** Operations concerning **${target}** continue under standard protocol.

**3. Direct Quote for Inquiries:**
> *"We are aware of unverified rumors circulating regarding ${target}. These statements are inaccurate, unattributed, and do not reflect our verified plans or policies. We urge team members to rely exclusively on official announcements."*`;
}

/* ==========================================================================
   TWO-PERSON DIALOGUE / CHAT GOSSIP DETECTION ENGINE
   ========================================================================== */

export const SAMPLE_TWO_PERSON_CHATS = [
  {
    id: 'office_layoff_dialogue',
    title: '🏢 Marcus & Sarah: The Secret Layoff Leak',
    description: 'A classic watercooler gossip exchange where Marcus initiates a rumor and Sarah escalates the panic.',
    transcript: `Marcus: Hey Sarah, keep this strictly between you and me, but did you hear what someone told me about the CEO?
Sarah: No! What happened? Is everything okay?
Marcus: Word on the street is the CEO is secretly planning to lay off 40% of the engineering team next Friday behind closed doors.
Sarah: Oh my god, that is insane! I knew something fishy was going on. My manager looked so stressed this morning.
Marcus: Don't tell anyone yet, but a little birdie told me HR has already prepared the severance packages.
Sarah: I am definitely warning the team. This place is turning into an absolute disaster.`
  },
  {
    id: 'tech_ip_leak_dialogue',
    title: '🤖 Devin & Alex: Unreleased Model Weights Whisper',
    description: 'Devin spreads an unverified rumor about an engineer rage-quitting with code; Alex pushes back with skepticism.',
    transcript: `Devin: Did you hear the tea about David from the AI research team?
Alex: No, what about David?
Devin: Apparently he got caught red-handed rage-quitting last night and secretly downloading all the unreleased model weights to an external drive.
Alex: Wait, who told you that? Did you see an official security memo or did you just hear it on Blind?
Devin: Well, someone in the Slack group said they saw his Slack account get deactivated immediately.
Alex: Accounts get suspended for routine credential rotations all the time. Let's not spread wild hearsay until we hear from security.`
  },
  {
    id: 'corporate_fraud_dialogue',
    title: '💼 Jessica & Chloe: CFO Embezzlement Accusation',
    description: 'Severe financial misconduct allegation with high defamation liability.',
    transcript: `Jessica: Don't repeat this, but rumors are saying the CFO is being forced to resign this afternoon.
Chloe: Are you serious? Why?
Jessica: Internal auditors allegedly caught him embezzling funds and cooking the quarterly reports. A friend in finance told me it's a massive cover-up.
Chloe: Wow, total fraud! He always seemed scheming and fake. If this leaks to Twitter, our stock is going to get completely ruined.`
  }
];

/**
 * Parses raw text into structured turns between two speakers
 * Supports:
 * - "Speaker: Message"
 * - "[10:14] Speaker: Message"
 * - "Speaker - Message"
 */
export function parseDialogue(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];

  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const turns = [];

  const pattern1 = /^(?:\[?[0-9]{1,2}:[0-9]{2}(?::[0-9]{2})?(?:\s*[AP]M)?\]?\s*)?([^:\-\n]+)[:\-]\s*(.*)$/i;

  lines.forEach((line, idx) => {
    const match = line.match(pattern1);
    if (match) {
      const speaker = match[1].trim();
      const content = match[2].trim();
      if (speaker && content) {
        turns.push({
          lineIndex: idx + 1,
          speaker,
          text: content,
          timestamp: `Turn ${idx + 1}`
        });
      }
    } else {
      // Continuation of previous speaker or anonymous line
      if (turns.length > 0) {
        turns[turns.length - 1].text += ' ' + line;
      } else {
        turns.push({
          lineIndex: idx + 1,
          speaker: 'Speaker 1',
          text: line,
          timestamp: `Turn ${idx + 1}`
        });
      }
    }
  });

  return turns;
}

/**
 * Comprehensive forensic audit of a dialogue between two parties
 * @param {string} rawText - Chat transcript
 * @param {string} sensitivity - 'lenient' | 'balanced' | 'paranoid'
 * @returns {object} Full dialogue audit scorecard
 */
export function analyzeDialogue(rawText, sensitivity = 'balanced') {
  const turns = parseDialogue(rawText);

  if (turns.length === 0) {
    return {
      isValid: false,
      error: 'Could not detect distinct speaker lines. Please format as "Alice: Message" or "[10:15] Bob: Message".'
    };
  }

  // Identify distinct speakers (top 2 primary speakers)
  const speakerCounts = new Map();
  turns.forEach(t => {
    speakerCounts.set(t.speaker, (speakerCounts.get(t.speaker) || 0) + 1);
  });

  const uniqueSpeakers = Array.from(speakerCounts.keys());
  const speakerA = uniqueSpeakers[0] || 'Person A';
  const speakerB = uniqueSpeakers[1] || 'Person B';

  // Analyze each turn individually
  const auditedTurns = [];
  let firstGossipTurn = null;
  let totalDialogueScore = 0;
  let maxTurnScore = 0;
  let highRiskTurnCount = 0;

  const speakerStats = {
    [speakerA]: { turns: 0, totalGossipScore: 0, hearsayCount: 0, sensationalCount: 0, groundingCount: 0, role: '' },
    [speakerB]: { turns: 0, totalGossipScore: 0, hearsayCount: 0, sensationalCount: 0, groundingCount: 0, role: '' }
  };

  turns.forEach((turn, idx) => {
    const analysis = analyzeGossip(turn.text, sensitivity);
    totalDialogueScore += analysis.gossipScore;
    maxTurnScore = Math.max(maxTurnScore, analysis.gossipScore);
    if (analysis.gossipScore >= 60) highRiskTurnCount++;

    if (!firstGossipTurn && analysis.gossipScore >= 40) {
      firstGossipTurn = {
        index: idx,
        speaker: turn.speaker,
        text: turn.text,
        score: analysis.gossipScore
      };
    }

    // Accumulate speaker stats
    const stats = speakerStats[turn.speaker] || speakerStats[speakerA];
    stats.turns++;
    stats.totalGossipScore += analysis.gossipScore;

    analysis.markers.forEach(m => {
      if (m.type === 'hearsay') stats.hearsayCount++;
      if (m.type === 'sensationalism') stats.sensationalCount++;
      if (m.type === 'grounding') stats.groundingCount++;
    });

    auditedTurns.push({
      ...turn,
      isSpeakerA: turn.speaker.toLowerCase() === speakerA.toLowerCase(),
      analysis
    });
  });

  // Calculate averages
  const avgDialogueScore = Math.round(totalDialogueScore / turns.length);
  const avgA = speakerStats[speakerA].turns > 0 ? Math.round(speakerStats[speakerA].totalGossipScore / speakerStats[speakerA].turns) : 0;
  const avgB = speakerStats[speakerB].turns > 0 ? Math.round(speakerStats[speakerB].totalGossipScore / speakerStats[speakerB].turns) : 0;

  // Determine Instigator, Amplifier, and Skeptic Roles
  const instigatorName = firstGossipTurn ? firstGossipTurn.speaker : (avgA >= avgB ? speakerA : speakerB);
  const secondSpeaker = instigatorName.toLowerCase() === speakerA.toLowerCase() ? speakerB : speakerA;

  // Assign roles
  speakerStats[instigatorName].role = '🚨 Gossip Instigator / Source';

  if (speakerStats[secondSpeaker].groundingCount >= 1 && avgB < 40) {
    speakerStats[secondSpeaker].role = '🛡️ Fact-Checker / Skeptic';
  } else if (speakerStats[secondSpeaker].sensationalCount >= 2 || avgB >= 50) {
    speakerStats[secondSpeaker].role = '🗣️ Rumor Amplifier / Escalator';
  } else if (speakerStats[secondSpeaker].hearsayCount >= 1) {
    speakerStats[secondSpeaker].role = '👂 Active Intermediary';
  } else {
    speakerStats[secondSpeaker].role = '👀 Passive Participant';
  }

  // Contagion Trajectory Curve
  let contagionTrajectory = 'Steady Speculation';
  const firstHalfTurns = auditedTurns.slice(0, Math.ceil(auditedTurns.length / 2));
  const secondHalfTurns = auditedTurns.slice(Math.ceil(auditedTurns.length / 2));

  const firstHalfAvg = firstHalfTurns.reduce((acc, t) => acc + t.analysis.gossipScore, 0) / firstHalfTurns.length;
  const secondHalfAvg = secondHalfTurns.length > 0 
    ? secondHalfTurns.reduce((acc, t) => acc + t.analysis.gossipScore, 0) / secondHalfTurns.length 
    : firstHalfAvg;

  if (secondHalfAvg - firstHalfAvg > 15) {
    contagionTrajectory = '📈 Rapidly Escalating Contagion (Rumor Mutated & Intensified)';
  } else if (firstHalfAvg - secondHalfAvg > 15) {
    contagionTrajectory = '📉 Successfully De-escalated (Skepticism Defused Hearsay)';
  } else if (avgDialogueScore >= 60) {
    contagionTrajectory = '🔥 Sustained High Drama Echo-Chamber';
  }

  // Aggregate Extracted Entities across dialogue
  const allTargets = new Set();
  auditedTurns.forEach(t => {
    if (t.analysis.targets) t.analysis.targets.forEach(tar => allTargets.add(tar));
  });

  // Dialogue Spiciness
  let dialogueSpiciness = 'mild';
  let spicinessLabel = '🌱 Low Heat / Objective Dialogue';
  if (avgDialogueScore >= 75 || maxTurnScore >= 85) {
    dialogueSpiciness = 'nuclear';
    spicinessLabel = '🔥 Nuclear Rumor Contagion / Severe Defamation Risk';
  } else if (avgDialogueScore >= 50 || maxTurnScore >= 70) {
    dialogueSpiciness = 'spicy';
    spicinessLabel = '🌶️🌶️ Hot Watercooler Gossip Exchange';
  } else if (avgDialogueScore >= 30) {
    dialogueSpiciness = 'medium';
    spicinessLabel = '🌶️ Simmering Workplace Speculation';
  }

  return {
    isValid: true,
    speakerA,
    speakerB,
    instigatorName,
    secondSpeaker,
    speakerStats,
    turnsCount: turns.length,
    avgDialogueScore,
    maxTurnScore,
    highRiskTurnCount,
    dialogueSpiciness,
    spicinessLabel,
    contagionTrajectory,
    targets: Array.from(allTargets),
    firstGossipTurn,
    auditedTurns,
    complianceVerdict: generateDialogueVerdict(avgDialogueScore, instigatorName, secondSpeaker, speakerStats, Array.from(allTargets))
  };
}

function generateDialogueVerdict(avgScore, instigator, secondSpeaker, speakerStats, targets) {
  const targetStr = targets.length > 0 ? targets.join(', ') : 'third parties';
  const secondRole = speakerStats[secondSpeaker]?.role || 'second participant';

  if (avgScore >= 65) {
    return {
      severity: 'CRITICAL COMPLIANCE BREACH',
      color: '#ef4444',
      summary: `This dialogue constitutes an active, high-liability rumor contagion cycle targeting ${targetStr}.`,
      culpability: `${instigator} is the primary source/instigator who leaked unverified claims. ${secondSpeaker} acted as an ${secondRole.replace(/^[^\w]+/, '')}, validating or amplifying ungrounded assertions.`,
      recommendation: 'Both parties share organizational and potential legal liability. Cease verbal/digital transmission immediately. HR/Management intervention advised.'
    };
  } else if (avgScore >= 40) {
    return {
      severity: 'MODERATE WORKPLACE HEARSAY',
      color: '#f97316',
      summary: `Informal watercooler exchange exhibiting secondary hearsay markers and mutual conjecture regarding ${targetStr}.`,
      culpability: `${instigator} initiated the topic based on shadow sources. ${secondSpeaker} reacted with interest, resulting in speculative amplification without verified primary evidence.`,
      recommendation: 'Advise participants to verify facts through official internal channels rather than escalating unconfirmed narratives.'
    };
  } else {
    return {
      severity: 'OBJECTIVE / LOW RISK COMMUNICATION',
      color: '#10b981',
      summary: `Dialogue exhibits low hearsay risk. Statements are either grounded, self-reported, or critically examined.`,
      culpability: 'No malicious rumor instigation identified. Communication complies with standard professional interaction.',
      recommendation: 'No compliance action required.'
    };
  }
}

/**
 * Generates an exportable Markdown report of the Two-Person Dialogue Audit
 */
export function exportDialogueAuditReport(auditResult) {
  if (!auditResult || !auditResult.isValid) return '';

  let md = `# 👥 TWO-PERSON CHAT GOSSIP & CONTAGION AUDIT REPORT\n`;
  md += `Generated: ${new Date().toLocaleString()}\n`;
  md += `Overall Dialogue Gossip Index: **${auditResult.avgDialogueScore}%** [${auditResult.spicinessLabel}]\n`;
  md += `Contagion Trajectory: **${auditResult.contagionTrajectory}**\n\n`;
  md += `---\n\n`;

  md += `### 🎯 PARTICIPANT LIABILITY & ROLE ATTRIBUTION\n\n`;
  md += `- **Primary Instigator:** **${auditResult.instigatorName}** (${auditResult.speakerStats[auditResult.instigatorName].role}) — Avg Gossip Score: \`${auditResult.speakerStats[auditResult.instigatorName].totalGossipScore / auditResult.speakerStats[auditResult.instigatorName].turns | 0}%\`\n`;
  md += `- **Secondary Participant:** **${auditResult.secondSpeaker}** (${auditResult.speakerStats[auditResult.secondSpeaker].role}) — Avg Gossip Score: \`${auditResult.speakerStats[auditResult.secondSpeaker].totalGossipScore / auditResult.speakerStats[auditResult.secondSpeaker].turns | 0}%\`\n`;
  md += `- **Entities Targeted:** ${auditResult.targets.join(', ') || 'None'}\n\n`;

  md += `### ⚖️ COMPLIANCE & LEGAL VERDICT\n`;
  md += `> **${auditResult.complianceVerdict.severity}**  \n`;
  md += `> ${auditResult.complianceVerdict.summary}  \n`;
  md += `> **Culpability:** ${auditResult.complianceVerdict.culpability}  \n`;
  md += `> **Directive:** ${auditResult.complianceVerdict.recommendation}\n\n`;

  md += `---\n\n### 💬 TURN-BY-TURN FORENSIC TRANSCRIPT\n\n`;
  auditResult.auditedTurns.forEach((turn, i) => {
    const a = turn.analysis;
    md += `**Turn #${i + 1} • [${turn.speaker}]** (${a.gossipScore}% Hearsay)\n`;
    md += `> "${turn.text}"\n`;
    if (a.markers && a.markers.length > 0) {
      md += `> *Flags: ${a.markers.map(m => `[${m.label}: "${m.snippet}"]`).join(', ')}*\n`;
    }
    md += `\n`;
  });

  return md;
}
