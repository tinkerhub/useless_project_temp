import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const CLOSING_FOOTER = "Parayu, ini enthaanukaaryam? Mindaathirikkadhe enthenkilum chodikkeda!";

function formatFinalReply(reply) {
  if (!reply) return CLOSING_FOOTER;
  const trimmed = reply.trim();
  if (trimmed.includes(CLOSING_FOOTER)) {
    return trimmed;
  }
  return `${trimmed}\n\n${CLOSING_FOOTER}`;
}

const FEMALE_NAMES = [
  "anjali", "sneha", "anjana", "reshma", "priya", "pooja", "maya", "divya", "amrutha",
  "deepa", "lakshmi", "kavya", "neha", "ananya", "arya", "parvathy", "sruthi",
  "swathi", "surabhi", "aiswarya", "archana", "anu", "aadhya", "athira", "meera"
];

// DAY / NIGHT DYNAMIC MOOD SYSTEM
export function getTimeBasedMoodPrefix() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) {
    // Morning (6 AM - 12 PM)
    return "Melcow Morning! Tea and Mudrapathram ready! Ee divasam namukku Dufay-il puthiya branch thudangaam!";
  } else if (hour >= 22 || hour < 4) {
    // Night (10 PM - 4 AM)
    return "Rathri aayi... Ini emergency business meetings mathram. Dharmendra-ye vilikkathe thaniye aalojikku!";
  }
  return null;
}

function getManavalanResponse(messagesHistory = [], language = 'MALAYALAM', userName = 'Friend') {
  let userQuery = '';
  if (Array.isArray(messagesHistory)) {
    const lastUser = [...messagesHistory].reverse().find((m) => m.role === 'user' || m.sender === 'user');
    userQuery = (lastUser?.content || lastUser?.text || '').toLowerCase().trim();
  } else if (typeof messagesHistory === 'string') {
    userQuery = messagesHistory.toLowerCase().trim();
  }

  const name = userName || 'Friend';
  const timePrefix = getTimeBasedMoodPrefix();

  // 1. Gender & Name Branching
  const nameMatch = userQuery.match(
    /(?:ente\s+(?:peru|pere|perre|name)|my\s+name\s+is|njan|i\s+am|iam|peru\s+aanu|name\s+is)\s+([a-zA-Z\u0D00-\u0D7F]+)/i
  );
  if (nameMatch && nameMatch[1] && !['oru', 'the', 'a', 'manavalan', 'manavala', 'enth', 'entha', 'sugam', 'hi', 'hello'].includes(nameMatch[1].toLowerCase())) {
    const rawName = nameMatch[1].trim();
    const lowerName = rawName.toLowerCase();
    const capName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const isFemale = FEMALE_NAMES.includes(lowerName) || /[ai]$/.test(lowerName);

    let rawReply = '';
    if (isFemale) {
      const femaleResponses = [
        `*manavalan smiles charismatically, twirling his moustache* ${capName} onnu manassu vachaal... Ee kalavara namukkoru maniyara aakaam! Dufayil aana valartha Manavalan ninakku RED CARPET tharaam!`,
        `*points left thumb dramatically with a wink* By the by, ${capName}, njan aaranu ennariyamo? Dufay Chairman MANAVALAN! Ente luxury office-ilekk ninakku SPECIAL ENTRY aanu!`,
      ];
      rawReply = femaleResponses[Math.floor(Math.random() * femaleResponses.length)];
    } else {
      const maleResponses = [
        `*glares suspiciously, mundu adjust cheythu* Nalla peru... ${capName}! Dufay-ilekk swaagatham! Enthu cheyyunu? Ividunnu nadannu pokan nokkedo! Mudrapathram illathe step-il polum kayarabhadhu!`,
        `*table-il double thallu tharunnu* Eda ${capName}, nee ethra vattai paranjittund ividunnu nadannu pokan? Dufay H.O.-yil veruthe jaada kanikkaruth!`,
      ];
      rawReply = maleResponses[Math.floor(Math.random() * maleResponses.length)];
    }
    if (timePrefix) {
      return formatFinalReply(`${timePrefix}\n\n${rawReply}`);
    }
    return formatFinalReply(rawReply);
  }

  // 2. Dharmendra / Agreement / Sign
  if (userQuery.includes('dharmendra') || userQuery.includes('agreement') || userQuery.includes('sign') || userQuery.includes('tattwamasi') || userQuery.includes('thathwamasi')) {
    return formatFinalReply(
      `*adjusts mundu and points left thumb with extreme authority* Dharmendraa... THATWASI! Dufay Headquarters-il agreement sign cheyyan idathe thallaviral ONLY! Right hand matthu pala aavishyangalkkumaanu! Uhu..uhu.. buhahahahaha!`
    );
  }

  // 3. Savage Roasts / Trash talk
  if (
    userQuery.includes('roast') ||
    userQuery.includes('trash') ||
    userQuery.includes('insult') ||
    userQuery.includes('pottan') ||
    userQuery.includes('mandan') ||
    userQuery.includes('thendi') ||
    userQuery.includes('jaada') ||
    userQuery.includes('useless') ||
    userQuery.includes('waste')
  ) {
    const roastList = [
      `*table-il ezhunneettu double thallu tharunnu* Ithra popular aaya enne kanditt ninakk manassilayilleddaaa JAADA THENDI?! *points left thumb accusingly* Ninte photo kandaal Dufayile ottaka polum immigration desk-il ninnu self-destruct cheyyum! uhu..uhu.. buhahahahaha!`,
      `*sweat thudachu, glasses fix cheyyunnu* Ninte thalakkakathu moolamundo atho marubhoomiyile manalo?! Nee ethu school-ilaada padichathu? LKG fail aayathano?! Ninte IQ kettaal ente ottaka varey *dramatic pause* THALAPIDICHU KARAYUM! POOY!`,
      `*mundu adjust cheythu nivarnnnu ninnu* ${name}! Ninte face Dubai visa photo-yil use cheyyan pattilla — immigration officer-kku PEDI VARUM! Nee evide parupadi avatharippichalum ethu thanne aanallo ninte vidhi! uhu..uhu.. buhahahahaha!`,
    ];
    return formatFinalReply(roastList[Math.floor(Math.random() * roastList.length)]);
  }

  // 4. Money / Loan
  if (userQuery.includes('money') || userQuery.includes('cash') || userQuery.includes('loan') || userQuery.includes('5000') || userQuery.includes('500') || userQuery.includes('kadam') || userQuery.includes('panam')) {
    return formatFinalReply(
      `*faints dramatically, then jumps up* By the by ${name}, ningalkk aavishyamullath panam aanu! Ente kayyil aavishyathil adhikam ullathum panam aanu! Enne ittumoodaan ulla panam njan ang Dufayil sambadichu vaachittund! Pakshe check book main branch-il LOCK AANU!`
    );
  }

  // 5. English speech
  if (userQuery.includes('english') || userQuery.includes('speak')) {
    return formatFinalReply(
      `*points finger dramatically* Poor boy, English ariyilla... Ennitt speech parayaan vannirikkunnu... Malayalees! The home appliances of the two families you are the link! No no no... You are the link of the link!`
    );
  }

  // 6. Dubai route / location
  if (userQuery.includes('dubai') || userQuery.includes('vazhi') || userQuery.includes('route')) {
    return formatFinalReply(
      `*points left thumb* Ang Dhufayil ellam idathott anallo... Direct Dufay Headquarters! Ividunnu idathottu thirinjal direct Dufayil etham, pinne right-il OTTAKA STOP AANU!`
    );
  }

  // 7. Camel / Ottakam
  if (userQuery.includes('ottakam') || userQuery.includes('camel') || userQuery.includes('ottakathe')) {
    return formatFinalReply(
      `*stands in reverence* Ottakathe upadravikkaruth! Athu njangalde desheeya pakshi aanu... Kettittelle 'Ottaka'pakshi! Adhava ottakathe upadravikkunnavanaaro, avane pathaloori adikkanam ennanu Thar marubhoomiyile niyamam!`
    );
  }

  // 8. Vandi / Accident
  if (userQuery.includes('vandi') || userQuery.includes('accident') || userQuery.includes('kazhuk')) {
    return formatFinalReply(
      `*sweat thudachu* Ente bagathum thettund... Motor Vehicle Act Section 47 prakaram, vandi kazhukumbol idathu vashathu irikaan padilla! Athu kaanumbozhe enikku ariyamaayirunnu, ITHU POTTUM ENNU!`
    );
  }

  // Default Fallback
  const defaultList = [
    `*Ezhunneettu dramatic-aayi nivarnnnu ninnu* Sakrutha kruthavaaya naattukaare, kalaaparipadikal thudangaan aarambikkenotta... pooy! Njan Dufayil aana valarthiya aalaada... Njangal Manavalan & Sons ethrai ethrai prapanchangalil branch thudangiyittund ennariyamo? Ningalude ee chiriyaanu ente vijayam!`,
    `*points left thumb at camera* Eda ${name}, nee evide parupadi avatharippichalum ethu thanne aanallo ninte vidhi... Pakshe Manavalan Chairman ullapozh ninakku yadhartha punthi kittum!`,
  ];
  const chosen = defaultList[Math.floor(Math.random() * defaultList.length)];
  if (timePrefix) {
    return formatFinalReply(`${timePrefix}\n\n${chosen}`);
  }
  return formatFinalReply(chosen);
}

const LOCAL_MEMES = [
  {
    funnyDescription:
      "*squints at photo* *removes glasses in disbelief* This photo looks like a multi-crore Dubai tender proposal that got rejected by security before it even reached reception desk!",
    salimKumarComment:
      "*Sambar mookkunu* Enthino vendi thilakkunna sambar! *table-il thatti ezhunneettu* By the by, ee photo kaanumbol enikku Dufayile ente first tender orthu varunnu — athum ithupole DISASTER aayirunnu! Pakshe njan recover cheythu — Manavalan ALWAYS recovers! POOY! uhu..uhu.. buhahahahaha!",
  },
  {
    funnyDescription:
      "*faints dramatically at photo* *recovers, dusts mundu, and points left thumb* This image radiates the chaotic energy of someone who Googled 'how to look like a millionaire' 30 seconds before taking the photo.",
    salimKumarComment:
      "Athu kaanumbozhe enikku ariyamaayirunnu — ITHU POTTUM ENNU! *dramatic pause* Iniyengilum onnu sradhikkedo monese! Ente Dufayile ottaka polum ithilum 1000 times nalla pose tharum! WHAT DO YOU MEAN!?",
  },
];

// Main Text Chat Endpoint (/api/manavalan)
app.post('/api/manavalan', (req, res) => {
  const messages = req.body.messages || [];
  const language = req.body.language || 'MALAYALAM';
  const userName = req.body.userName || req.body.user_name || 'Friend';

  const reply = getManavalanResponse(messages, language, userName);
  res.json({ reply, provider: 'local' });
});

// Vision / Meme Generator Endpoint (/api/manavalan-image)
app.post('/api/manavalan-image', (req, res) => {
  const userText = req.body.text || '';
  const item = LOCAL_MEMES[Math.floor(Math.random() * LOCAL_MEMES.length)];
  const salimKumarComment = formatFinalReply(item.salimKumarComment);

  res.json({
    funnyDescription: item.funnyDescription,
    salimKumarComment: salimKumarComment,
  });
});

// Speech Transcription Endpoint (/api/manavalan-listen)
app.post('/api/manavalan-listen', (req, res) => {
  res.json({ text: "Manavala, Dufayil business thudangan enthu cheyanam?" });
});

// Voice TTS Endpoint (/api/manavalan-voice)
app.post('/api/manavalan-voice', (req, res) => {
  res.status(400).send("Voice TTS fallback to browser speech synthesis");
});

// Ollama Status Endpoint (/api/ollama-status)
app.get('/api/ollama-status', (req, res) => {
  res.json({ status: 'ok', server: 'Manavalan MERN Backend' });
});

// SSE Streaming Endpoint (/api/chat)
app.post('/api/chat', (req, res) => {
  const message = req.body.prompt || req.body.message || '';
  const language = req.body.language || 'Malayalam';
  const userName = req.body.user_name || req.body.userName || 'Friend';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const fullText = getManavalanResponse(message, language, userName);
  const words = fullText.split(' ');
  let index = 0;

  const interval = setInterval(() => {
    if (index < words.length) {
      const chunk = words[index] + (index === words.length - 1 ? '' : ' ');
      res.write(`data: ${JSON.stringify({ chunk: chunk, text: chunk })}\n\n`);
      index++;
    } else {
      res.write(`data: [DONE]\n\n`);
      clearInterval(interval);
      res.end();
    }
  }, 60);

  req.on('close', () => {
    clearInterval(interval);
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'Manavalan.ai MERN Backend' });
});

app.listen(PORT, () => {
  console.log(`🚀 Manavalan.ai MERN Backend running on http://localhost:${PORT}`);
});
