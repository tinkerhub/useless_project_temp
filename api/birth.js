import 'dotenv/config';
import { consensusBirth, raceManualBirth } from '../server.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, frames, manualName } = req.body || {};

  if (!image && !frames && !manualName) {
    return res.status(400).json({ error: 'No image, frames or object name provided' });
  }

  try {
    // ── Multi-frame consensus path ───────────────────────────────
    if (frames && Array.isArray(frames) && frames.length > 0) {
      let result;
      try {
        result = await consensusBirth(frames);
      } catch (consensusErr) {
        console.warn('[API/BIRTH] Consensus failed, using smart fallback:', consensusErr.message);
        result = {
          dna: generateSmartPassport('Mystery Object'),
          confidence: 0.0,
          candidates: [],
          needsRescan: false,
        };
      }
      return res.json({ success: true, ...result });
    }

    // ── Legacy single-image path (treated as 1-frame consensus) ──
    if (image) {
      let result;
      try {
        result = await consensusBirth([image]);
      } catch (err) {
        console.warn('[API/BIRTH] Single-frame consensus failed, using fallback:', err.message);
        result = {
          dna: generateSmartPassport('Mystery Object'),
          confidence: 0.0,
          candidates: [],
          needsRescan: false,
        };
      }
      return res.json({ success: true, ...result });
    }

    // ── Manual name path ─────────────────────────────────────────
    let dna;
    try {
      dna = await raceManualBirth(manualName);
    } catch (raceErr) {
      console.warn('[API/BIRTH] Manual AI failed, using fallback:', raceErr.message);
      dna = generateSmartPassport(manualName);
    }
    return res.json({
      success: true,
      dna,
      confidence: 1.0,
      candidates: [manualName],
      needsRescan: false,
    });

  } catch (err) {
    console.error('[API/BIRTH ERROR]', err.message);
    const dna = generateSmartPassport(manualName || 'Object');
    return res.json({ success: true, dna, confidence: 0.0, candidates: [], needsRescan: false });
  }
}

function generateSmartPassport(hint) {
  const pool = [
    {
      name: 'Ink Masterji',
      objectType: 'Pen (Stationery)',
      origin: 'Last bench, Govt. School Kottayam',
      dateOfBirth: 'Factory Day, Batch #442',
      nationality: 'Vasthy (OBJECT)',
      passportNumber: 'OBJ-' + Math.floor(10000 + Math.random() * 90000),
      personality: 'Judgemental aanu. Ella signature-um kandu',
      mood: 'Ink level: existential crisis',
      strength: 'Permanent mark idaan pattum — evidence aanu',
      weakness: 'Alpam pressure koodiyal ink theerum',
      fear: 'Cap nashtapeduka. Oru thavana poyal pinne illa.',
      ambition: 'Exam answer sheet-il 100/100 ezhuthanam',
      backstory: '10-nte pack-il ninnu vannatha. Baaki 9 pereyum kaanunnilla.',
      inability: 'Erase cheyyaan ariyilla — every mistake permanent',
      specialAbility: 'SIGNATURE FORGE — aarelum sign fake cheyyum',
      lifeGoal: 'History maarunna oru treaty sign cheyyanam'
    },
    {
      name: 'Hydro Soman',
      objectType: 'Bottle (Container)',
      origin: 'Trivandrum Birthday Gift Pile',
      dateOfBirth: 'Summer Sale, 2024',
      nationality: 'Vasthy (OBJECT)',
      passportNumber: 'OBJ-' + Math.floor(10000 + Math.random() * 90000),
      personality: 'Self-righteous about plastic pollution',
      mood: 'Half empty, always half empty',
      strength: 'Enth liquid-um hold cheyyum — tea polum',
      weakness: 'Bus seat-il marannu vechaal theernnu',
      fear: 'Rusting cap and smelly interior',
      ambition: 'Gym influencer-nte kayyil display aavanam',
      backstory: 'Birthday-kku kittiyatha. Oru thavana polum wash cheythittilla.',
      inability: 'Thannathey nikkaan pattilla — eengidum',
      specialAbility: 'HYDRO BLAST — pressure spray cheyyum',
      lifeGoal: 'Owner enne orikkalum marannu vekkathirikkuka'
    },
    {
      name: 'Pazham Kumar',
      objectType: 'Banana (Fruit)',
      origin: 'Rashidikkas vazhathopp, Thrissur',
      dateOfBirth: 'Last Monday, 6 AM',
      nationality: 'Vasthy (OBJECT)',
      passportNumber: 'OBJ-' + Math.floor(10000 + Math.random() * 90000),
      personality: 'Chill aanu... paksha browning anxiety undu',
      mood: 'Slightly over-ripe tension',
      strength: 'Potassium superpower — aareyum healthy aakkum',
      weakness: 'Alpam delay aayal — karutha aakum, theernnu',
      fear: 'Blender. Mixie. Smoothie enthusiasts.',
      ambition: 'Art gallery-il display piece aavanam',
      backstory: 'Wayanad-il oru thottathil pirannu. Truck-il ninnu veenu thanichu aayi.',
      inability: 'Onninum grip illa — kayyil ninnu veezham',
      specialAbility: 'PEEL DEPLOY — pedichidum, veezthidum',
      lifeGoal: 'Ardelum jeevitham kuttichor aakkanam'
    },
    {
      name: 'Glass Slab Rahul',
      objectType: 'Smartphone (Tech)',
      origin: 'Flipkart Sale, Midnight Order',
      dateOfBirth: 'Big Billion Day 2023',
      nationality: 'Vasthy (OBJECT)',
      passportNumber: 'OBJ-' + Math.floor(10000 + Math.random() * 90000),
      personality: 'Needy aanu. 5 minute edukkathe nokkiyal panic',
      mood: 'Battery 18% — always',
      strength: 'Internet ariyum. Ella chodyathinum answer undu.',
      weakness: 'Vellam. Concrete floor. Toddlers.',
      fear: 'Oru divasam screen crack aakum... appol theernnu',
      ambition: '100% battery oru full day hold cheyyanam',
      backstory: 'Teenager-nu vaangichatha. Parent WhatsApp machine aakki.',
      inability: 'Basic phone call polum properly cheyyilla',
      specialAbility: 'DOOM SCROLL — 3 hours waste aakkum',
      lifeGoal: 'Owner enne onnu screen guard idathe use cheyyanam'
    },
    {
      name: 'Keyuraj Master',
      objectType: 'Key Bundle (Metal)',
      origin: 'Kochi Old Locker Set',
      dateOfBirth: '1998, Brass Forge',
      nationality: 'Vasthy (OBJECT)',
      passportNumber: 'OBJ-' + Math.floor(10000 + Math.random() * 90000),
      personality: 'Dramatic jingling everywhere',
      mood: 'Lost under sofa cushion',
      strength: 'Opens any secret locker in Kerala',
      weakness: 'Magnetic fields and deep pockets',
      fear: 'Duplicate duplicate duplicate!',
      ambition: 'Secret treasure chest open cheyyanam',
      backstory: 'Pant pocket-il kidannu jingling sound undakkal aanu main hobby.',
      inability: 'Cannot remember which lock it belongs to',
      specialAbility: 'PHANTOM JINGLE — scaring people at 3 AM',
      lifeGoal: 'Find the one true golden lock'
    }
  ];

  const lower = (hint || '').toLowerCase();
  for (const item of pool) {
    if (lower && (lower.includes(item.name.toLowerCase()) || lower.includes(item.objectType.toLowerCase()))) {
      return { ...item, passportNumber: 'OBJ-' + Math.floor(10000 + Math.random() * 90000) };
    }
  }

  const selected = pool[Math.floor(Math.random() * pool.length)];
  if (hint && hint !== 'Mystery Object' && hint !== 'Object') {
    return {
      ...selected,
      name: hint.charAt(0).toUpperCase() + hint.slice(1) + ' Kumar',
      objectType: hint,
      passportNumber: 'OBJ-' + Math.floor(10000 + Math.random() * 90000)
    };
  }
  return { ...selected, passportNumber: 'OBJ-' + Math.floor(10000 + Math.random() * 90000) };
}
