/**
 * fallback.js — Cached Manglish fallback passport data.
 *
 * If the AI API fails during a live demo, these pre-written
 * passport identities are used instead. Covers common objects.
 *
 * All humor is in Malayalam/Manglish style matching pass.png fields.
 */

const FALLBACK_PASSPORTS = {
  banana: {
    name: 'Pazham Kumar',
    objectType: 'Fruit',
    origin: 'Rashidikkas vazhathopp, Thrissur',
    dateOfBirth: 'Last Monday, 6 AM',
    nationality: 'Vasthy (OBJECT)',
    passportNumber: 'OBJ-47382',
    personality: 'Chill aanu... paksha browning anxiety undu',
    mood: 'Slightly over-ripe tension',
    strength: 'Potassium superpower — aareyum healthy aakkum',
    weakness: 'Alpam delay aayal — karutha aakum, theernnu',
    fear: 'Blender. Mixie. Smoothie enthusiasts.',
    ambition: 'Art gallery-il display piece aavanam',
    backstory: 'Wayanad-il oru thottathil pirannu. Truck-il ninnu veenu thanichu aayi.',
    inability: 'Onninum grip illa — kayyil ninnu veezham',
    specialAbility: 'PEEL DEPLOY — pedichidum, veezthidum',
    lifeGoal: 'Ardelum jeevitham kuttichor aakkanam',
  },

  pen: {
    name: 'Ink Masterji',
    objectType: 'Stationery',
    origin: 'Last bench, Govt. School Kottayam',
    dateOfBirth: 'Factory Day, Batch #442',
    nationality: 'Vasthy (OBJECT)',
    passportNumber: 'OBJ-88214',
    personality: 'Judgemental aanu. Ella signature-um kandu',
    mood: 'Ink level: existential crisis',
    strength: 'Permanent mark idaan pattum — evidence aanu',
    weakness: 'Alpam pressure koodiyal ink theerum',
    fear: 'Cap nashtapeduka. Oru thavana poyal pinne illa.',
    ambition: 'Exam answer sheet-il peru undaakkanam',
    backstory: '10-nte pack-il ninnu vannatha. Baaki 9 pereyum kaanunnilla.',
    inability: 'Erase cheyyaan ariyilla — every mistake permanent',
    specialAbility: 'SIGNATURE FORGE — aarelum sign fake cheyyum',
    lifeGoal: 'History maarunna oru treaty sign cheyyanam',
  },

  shoe: {
    name: 'Cheriyan Left Foot',
    objectType: 'Footwear',
    origin: 'Kozhikode Bazaar, 2nd floor rack',
    dateOfBirth: 'Stitching Day, April',
    nationality: 'Vasthy (OBJECT)',
    passportNumber: 'OBJ-55901',
    personality: 'Loyal aanu... pakshe oru thank you kittiyittilla',
    mood: 'Tired. Always tired.',
    strength: 'Grip — ethra slippery floor-um handle cheyyum',
    weakness: 'Manal aayal naarumo ennanu doubt',
    fear: 'Rain. Washing machine. Avarude dog.',
    ambition: 'Orikkal engilum TV-il kaananam',
    backstory: 'Oru pair aayirunnu. Right shoe festival-il nashtamayi.',
    inability: 'Thanichu oru kaaryavum illa — always pair venam',
    specialAbility: 'TURBO SPRINT — escape cheyyum, fast',
    lifeGoal: 'Mud-il veezhathe oru divasam survive cheyyanam',
  },

  phone: {
    name: 'Glass Slab Rahul',
    objectType: 'Electronics',
    origin: 'Flipkart Sale, Midnight Order',
    dateOfBirth: 'Big Billion Day 2023',
    nationality: 'Vasthy (OBJECT)',
    passportNumber: 'OBJ-12309',
    personality: 'Needy aanu. 5 minute edukkathe nokkiyal panic',
    mood: 'Battery 18% — always',
    strength: 'Internet ariyum. Ella chodyathinum answer undu.',
    weakness: 'Vellam. Concrete floor. Toddlers.',
    fear: 'Oru divasam screen crack aakum... appol theernnu',
    ambition: '100% battery oru full day hold cheyyanam',
    backstory: 'Teenager-nu vaangichatha. Parent WhatsApp machine aakki.',
    inability: 'Basic phone call polum properly cheyyilla',
    specialAbility: 'DOOM SCROLL — 3 hours waste aakkum',
    lifeGoal: 'Owner enne onnu screen guard idathe use cheyyanam',
  },

  bottle: {
    name: 'Hydro Soman',
    objectType: 'Container',
    origin: 'Trivandrum, birthday gift pile',
    dateOfBirth: 'Someone\'s forgotten birthday',
    nationality: 'Vasthy (OBJECT)',
    passportNumber: 'OBJ-67450',
    personality: 'Self-righteous aanu about single-use plastics',
    mood: 'Half empty. Always half empty.',
    strength: 'Enth liquid-um hold cheyyum — coffee polum',
    weakness: 'Oru bus seat-il vechu irangiyaal — theernnu',
    fear: 'Aarum thirichu edukkaathirikkuka',
    ambition: 'Owner-nte oru mattey bottle venam enna thought maattanam',
    backstory: 'Birthday gift aayirunnu. Aarum excited aayirunilla.',
    inability: 'Thannathey nikkaan pattilla — always eengidum',
    specialAbility: 'HYDRO BLAST — pressure spray cheyyum',
    lifeGoal: 'Enne illathe pattilla enn owner-nu thonnanam',
  },
};

/**
 * Generic fallback for unrecognized objects.
 */
function genericFallback(objectName = 'Unknown Object') {
  const id = Math.floor(10000 + Math.random() * 90000);
  return {
    name: objectName || 'Saadhaarana Saadhnam',
    objectType: 'Unidentified',
    origin: 'Etho drawer-il ninnu... ariyilla',
    dateOfBirth: 'Ariyilla. Kure munpe.',
    nationality: 'Vasthy (OBJECT)',
    passportNumber: `OBJ-${id}`,
    personality: 'Chill aanu. Aarkkum upadravam illa... mostly.',
    mood: 'Confused but surviving',
    strength: 'Survive cheyyum — somehow',
    weakness: 'Aarelum "ithu venda" ennu paranjaal theernnu',
    fear: 'Being thrown away without ceremony',
    ambition: 'Oru purpose kandethanam ippo thanne',
    backstory: 'Etho drawer-il kittiyatha. Aarkkum orma illa eppol vannenu.',
    inability: 'Onnum thanne cheyyaan ariyilla',
    specialAbility: 'EXIST HARDER — ignore cheyyaan pattilla',
    lifeGoal: 'Ardelum enne kandittu "ithu kollam" ennu parayanam',
  };
}

/**
 * Get a fallback passport for a given object name.
 * @param {string} objectName - Name of the object
 * @returns {Object} Fallback passport data
 */
export function getFallbackDNA(objectName = '') {
  const key = objectName.toLowerCase().trim();

  for (const [name, data] of Object.entries(FALLBACK_PASSPORTS)) {
    if (key.includes(name)) {
      return { ...data };
    }
  }

  return genericFallback(objectName || 'Unknown Object');
}
