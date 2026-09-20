/**
 * RumorRadar - Dynamic Bot Persona Response Generator
 * Synthesizes contextual responses based on active bot persona and gossip metrics.
 */

export const PERSONAS = {
  auditor: {
    id: 'auditor',
    name: 'Inspector Veritas',
    title: 'Forensic Rumor Auditor',
    tagline: 'Analytical • Cold Logic • Hearsay Dissector',
    avatar: '🔬',
    badgeClass: 'badge-auditor',
    accentColor: 'var(--accent-cyan)',
    greeting: 'Inspector Veritas online. Acoustic sensors primed. Submit any unverified claim or whisper for evidentiary cross-examination.'
  },
  teaQueen: {
    id: 'teaQueen',
    name: 'Lady Whispers',
    title: 'Spicy Tea Connoisseur',
    tagline: 'Sassy • Drama Radar • High Wit Reality Checks',
    avatar: '🫖',
    badgeClass: 'badge-tea',
    accentColor: 'var(--accent-magenta)',
    greeting: 'Lady Whispers in the parlor! 💅 Spill whatever piping-hot drama or watercooler chatter is buzzing—I\'ll tell you if it\'s gold or pure fiction.'
  },
  diplomat: {
    id: 'diplomat',
    name: 'Sentinel Vance',
    title: 'HR & Defamation Diplomat',
    tagline: 'Corporate Safety • Risk Mitigation • Ethics Advisor',
    avatar: '🛡️',
    badgeClass: 'badge-diplomat',
    accentColor: 'var(--accent-violet)',
    greeting: 'Sentinel Vance standing by. Let us audit internal communications for legal liability, reputational slander, and team safety.'
  }
};

/**
 * Generates an intelligent, persona-aligned reply
 * @param {string} userText - The message sent by the user
 * @param {object} analysis - Result from gossipEngine.js
 * @param {string} personaId - 'auditor' | 'teaQueen' | 'diplomat'
 * @returns {string} Markdown-formatted chatbot response
 */
export function generateBotResponse(userText, analysis, personaId = 'auditor') {
  const { gossipScore, targets, markers, viralityScore = 0, defamationScore = 0 } = analysis;
  const targetName = targets.length > 0 ? targets.join(' & ') : 'unspecified individuals';
  const hearsayMarkersList = markers.filter(m => m.type === 'hearsay').map(m => `"${m.snippet}"`);
  
  if (personaId === 'teaQueen') {
    return generateTeaQueenResponse(userText, analysis, targetName, hearsayMarkersList, viralityScore);
  } else if (personaId === 'diplomat') {
    return generateDiplomatResponse(userText, analysis, targetName, hearsayMarkersList, defamationScore);
  } else {
    return generateAuditorResponse(userText, analysis, targetName, hearsayMarkersList, viralityScore);
  }
}

function generateAuditorResponse(userText, analysis, targetName, markers, virality) {
  const { gossipScore } = analysis;

  if (gossipScore >= 80) {
    return `### 🚨 AUDIT REPORT: CRITICAL HEARSAY DETECTED

**Credibility Index:** \`${100 - gossipScore}%\` | **Hearsay Probability:** \`${gossipScore}%\` | **Virality Potential:** \`${virality}%\` | **Target(s):** **${targetName}**

My forensic scan indicates an active **unsubstantiated rumor contagion cycle**. 
Notice the linguistic patterns: ${markers.length > 0 ? markers.join(', ') : 'third-party hearsay signals'}. These phrases prove that the narrative was relayed through multiple intermediaries with zero primary documentation.

> **Fallacy Identified:** *Argumentum ad Populum* (assuming truth because "people are saying it") + *Telephone Game Degradation*.

**Forensic Recommendation:**
1. **Zero Evidentiary Weight:** Treat this claim as unverified hearsay.
2. **Legal / Employment Hazard:** If this involves career termination, illegal conduct, or company status, circulating it presents actionable liability.
3. **Verification Protocol:** Demand timestamps, signed memos, or direct firsthand testimony before treating this as factual data.`;
  }

  if (gossipScore >= 50) {
    return `### ⚠️ AUDIT REPORT: PROBABLE WATERCOOLER SPECULATION

**Credibility Index:** \`${100 - gossipScore}%\` | **Gossip Score:** \`${gossipScore}%\` | **Subject:** **${targetName}**

This statement exhibits moderate hearsay markers. While it may stem from a kernel of truth, it carries the hallmarks of secondary speculation rather than verified disclosure.

**Key Flags:**
- Uncited secondary narrative: ${markers.length > 0 ? markers.join(', ') : 'Unconfirmed report'}
- Potential distortion coefficient: ~**${Math.round(gossipScore * 0.7)}%** variance from original events.

**Audit Next Step:** Ask your interlocutor: *"Where did you obtain this specific information, and did you observe it firsthand?"* If they stammer, dismiss it.`;
  }

  if (gossipScore >= 30) {
    return `### 🔍 AUDIT REPORT: MINOR SPECULATIVE SIGNALS

**Credibility Index:** \`${100 - gossipScore}%\` | **Score:** \`${gossipScore}%\`

The statement contains speculative framing or mild conjecture, but lacks indicators of malicious slander. 
Verify the primary premises before making decisions based on this claim.`;
  }

  return `### ✅ AUDIT REPORT: STATEMENT APPEARS OBJECTIVE / VERIFIED

**Credibility Index:** \`${100 - gossipScore}%\` | **Gossip Signature:** \`CLEAN (${gossipScore}%)\`

Radar detected **no significant gossip or hearsay markers**. 
The communication is grounded in specific verifiable anchors, neutral in sentiment, or self-reported. Proceed normally.`;
}

function generateTeaQueenResponse(userText, analysis, targetName, markers, virality) {
  const { gossipScore } = analysis;

  if (gossipScore >= 80) {
    return `### 🫖 OH DARLING, THE TEA IS PIPING HOT (AND HIGHLY SUSPECT) 🔥

*Spiciness Rating:* **NUCLEAR EXTRA SPICY (${gossipScore}% Tea Gauge)**  
*Virality Index:* **${virality}% (Wildfire Level)** | *Target in Crosshairs:* **${targetName}**

Honey, hold onto your pearls! You just served a full 5-course banquet of unfiltered whispers. 💅  
Look at you casually dropping phrases like ${markers.length > 0 ? markers.join(' and ') : 'mystery insider drama'}. 

Let's keep it real for five seconds:
- **Spill factor:** 10/10 entertaining.
- **Truth factor:** Questionable at best, fictional novel at worst.
- **The Golden Rule of Tea:** If it sounds too juicy to be true, someone probably seasoned it with 80% exaggeration before handing you the plate!

Don't go blast-posting this in the group chat unless you're ready to get called into a very awkward room with receipts! Keep sipping, but verify before you spill! 🍵✨`;
  }

  if (gossipScore >= 50) {
    return `### ☕ OOH, WE HAVE A SIMMERING RUMOR ON OUR HANDS!

*Spiciness Rating:* **MEDIUM SPICE (${gossipScore}%)** | *Starring:* **${targetName}**

Listen sweetie, the grapevines are definitely vibrating today! You've got that classic *"somebody told somebody who told my cousin's roommate"* vibe going on.

Is it juicy? A little bit! But is it rock-solid fact? Absolutely not yet. Someone definitely added some extra seasoning to this dish on its way to your ears. 

*My tea-drinker advice:* Keep your ears perked, keep a straight poker face, and wait for the official drop before taking sides! 👀`;
  }

  if (gossipScore >= 30) {
    return `### 🫖 MILD INFUSION... JUST A LITTLE SIP OF CONJECTURE

*Spiciness Rating:* **MILD ROAST (${gossipScore}%)**

A tiny bit of speculation, darling, but barely enough to turn heads at brunch. It feels more like casual wondering than a full-blown scandal. 

Carry on, but let me know when things get actually dramatic! 💅`;
  }

  return `### 🧊 ICE COLD TRUTH. ZERO DRAMA DETECTED.

*Spiciness Rating:* **0% SPICE (CHILLED WATER)**

Darling, this isn't tea... this is pure, filtered, lukewarm tap water. Completely factual, respectful, and drama-free! 

Good for your karma, maybe a little boring for my tea cup, but I respect the integrity! 😌`;
}

function generateDiplomatResponse(userText, analysis, targetName, markers, defamation) {
  const { gossipScore } = analysis;

  if (gossipScore >= 80) {
    return `### 🛡️ ETHICS & COMPLIANCE ADVISORY: CRITICAL RISK DETECTED

**Assessment Category:** Unsubstantiated Third-Party Allegation  
**Affected Entities:** **${targetName}**  
**Defamation Risk Score:** **HIGH (${defamation}%)**

From a professional ethics and workplace governance standpoint, circulating this communication exposes you and your organization to significant liability:
- **Defamation & Slander Exposure:** Claims regarding termination, misconduct, or incompetence lacking direct evidence can trigger formal legal grievances.
- **Psychological Safety Degradation:** Unverified whispers erode team trust and foster toxic organizational climates.

**Recommended Professional Protocol:**
1. **Cease Transmission:** Refrain from transmitting this narrative verbally or across digital channels (Slack, Teams, WhatsApp).
2. **Authorized Pipelines:** If legitimate misconduct occurred, report through formal whistleblower or HR pipelines—never casual backchannels.
3. **De-escalate:** If approached with this rumor, reply: *"I don't participate in unverified discussions about colleagues."*`;
  }

  if (gossipScore >= 50) {
    return `### 🛡️ COMPLIANCE NOTE: MODERATE WORKPLACE HEARSAY

**Assessment:** Secondary Narrative Circulation (${gossipScore}%)  
**Subject:** **${targetName}**

This communication displays characteristics of informal watercooler chatter. While often benign in intent, such unverified exchanges frequently morph into misinformation that disrupts team cohesion.

**Actionable Advice:**
- Discourage further unverified speculation.
- Direct inquiries toward official company communications or scheduled all-hands updates.`;
  }

  return `### 🛡️ COMPLIANCE CLEARANCE: PROFESSIONAL COMMUNICATION

**Assessment:** Low Risk / Standard Communication (${gossipScore}%)

This message complies with objective, professional communication standards. No hearsay violations or defamation indicators identified.`;
}
