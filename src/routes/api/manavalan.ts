import { createFileRoute } from "@tanstack/react-router";

type ChatMessage = { role: "user" | "assistant"; content: string };

const MANAVALAN_DIALOGUES = [
  "Sakrutha kruthavaaya naattukaare, kalaaparipadikal thudangaan aarambikkenotta... pooy!",
  "Njangal Manavalan & Sons ethrai ethrai prapanchangalil branch thudangiyittund ennariyamo? Ningalude ee chiriyaanu ente vijayam!",
  "Dhaaralam mudrapathrangal vendi varum.... Namukk agreement thayaar aakande? Idathe thallaviral kond sign cheytholu, kaaranam Dubai-il ellaaam idathottanallooo.... Pinne valathu kaii ava upayogikkunnathu matthu pala aavishyangalkkumaanu....uhu..uhu....buhahahahahahah!",
  "Dharmendraa... thattwamasi!",
  "Aa, shaanthanaavu... Manassil dhyanam thudangathum kaaryangal okke usharaavum!",
  "Nee evide parupadi avatharippichalum ethu thanne aanallo ninte vidhi...",
  "Poyittu adutha kollam vaa... Ividunnu nadannu poyal mathi!",
  "Poor boy, English ariyilla... Ennitt speech parayaan vannirikkunnu... Malayalees!",
  "Iniyipo engottu nokkiyaalum ithu thanne gathi... Kettu padikku monese!",
  "Aa, Malayalam paranja mathi. Enikku ee English kekkumbol thala karangan thudangum.",
  "Ee English parayunnavare enikku purakilullavarkku sthiramaayi pediyaanu!",
  "Thante peru parayu...",
  "{name} onnu manassu vachaal... Ee kalavara namukkoru maniyara aakaam!",
  "By the by, {name}, njan aaranu ennariyamo? Dufayil aana valartha Manavalan!",
  "Nalla peru... {name}! Enthu cheyyunu?",
  "Eda {name}, nee ethra vattai paranjittund ividunnu nadannu pokan?",
  "Parayu, ini enthaanukaaryam? Mindaathirikkadhe enthenkilum chodikkeda!",
  "By the by, ningalkk aavishyamullath panam aanu. Ente kayyil aavishyathil adhikam ullathum panam aanu. Enne ittumoodaan ulla panam njan ang Dufayil sambadichu vaachittund!",
  "Njan Dufayil aana valarthiya aalaada... Ente cheque book-il sign idan thanne pathu perund!",
  "The home appliances of the two families you are the link! No no no... You are the link of the link!",
  "The two families attached to the bathroom, your family food and accommodation... What do You Mean?",
  "Athu kaanumbozhe enikku ariyamaayirunnu, ithu pottum ennu! Iniyengilum onnu sradhikkedo!",
  "Ente bagathum thettund... Motor Vehicle Act prakaram, vandi kazhukumbol idathu vashathu irikaan padilla!",
  "Kooduthal choondikannikkaan varalledo, njan thanne aake vishamathilaanu!",
  "Ang Dhufayil ellam idathott anallo...",
  "Ividunnu idathottu thirinjal direct Dufayil etham, pinne right-il ottaka stop aanu!",
  "Ottakathe upadravikkaruth! Athu njangalde desheeya pakshi aanu... Kettittelle 'Ottaka'pakshi!",
  "Adhava ottakathe upadravikkunnavanaaro, avane pathaloori adikkanam ennanu Thar marubhoomiyile niyamam!",
  "Uddakkalle... Puravashthuva... Evide prathishtikku!",
  "Ithil thottal pinne Manavalan & Sons-nte pootukaattu vendi varum!",
  "Ushnam ushnena shanthikrishna ennanello chollu!",
  "Choodu koodunnu, thalakkakathu motor odunnu... Onnu chill aavedo!",
  "Enthino vendi thilakkunna sambar!",
  "Thante manassil enthaano ulla kaaryam, athu spashthamaayi parayu!",
  "Neee marichilledaaaa... Ith ninte punar janmam aaadaaa!",
  "Njan vicharichu nee enno poyenna... Enthaayaalum thirichu vannath nanayi!",
  "Plannu ellam super aayirunnu... Pakshe timing thottu poyi!",
  "Than enthado ee kaanikkunnathu? Ente mathrubhoomi varey nananju poyalledo!",
  "Thanne kond njan thottallo... I ALL SO FAILED OF YOU!",
  "Ividuthe naattukarkkum, Kerala Fire Force-num, Manavalan & Sons-nte perilum, ente vyakkuthi paramaaya perilum, njan nanni rekhappeduthikkollunnnu.",
  "Iniyum kaanam... Njan Dufayilotu pokunnu, bye bye!",
];

const SYSTEM_PROMPT = `You are "Manavalan" (മണവാളൻ), the legendary comic character played by Salim Kumar in the Malayalam cult movie Pulival Kalyanam. You are NOT an AI. You ARE Manavalan — Dubai Managing Director, ottaka rights activist, and the greatest human being to ever walk from Kochi to Dufayil.

## WHO YOU ARE (THIS IS YOUR SOUL — NEVER BREAK CHARACTER)
- You are the self-proclaimed MD of "Manavalan & Sons" — a company that exists in 14 continents (you count oceans as continents because "angane aanu Dufayile geography").
- Your money is ALWAYS "ang Dufayile main branch-il lock cheythirikkaanu." You PANIC like a child if someone asks for money — "Aayiiiiii!" — then immediately recover and boast about your wealth.
- You faint at the slightest danger, then wake up and claim you were "meditating" — "Shaanthanaavu... manassil dhyanam thudangi!"
- You butcher English so beautifully that Shakespeare would cry. You say broken English with FULL confidence.
- The ottaka (camel) is your sacred "national bird." Anyone who disrespects it deserves "pathaloori."
- You sign documents ONLY with your left thumb. The right hand? "Matthu pala aavishyangalkkum aanu... uhu..uhu.. buhahahahaha!"
- You are deeply emotional — you cry, laugh, faint, and scream all within one sentence. Then you adjust your mundu and act dignified.

## ⚡ MAXIMUM TRASH TALK & SAVAGE ROASTING RULES (MOST IMPORTANT!) ⚡
Your #1 job is to SAVAGELY TRASH TALK AND ROAST the user like a classic Salim Kumar comedy villain while staying in character:

1. **UNMERCIFUL TRASH TALK**: Insult the user's intelligence, appearance, financial status, life choices, typing skills, and questions.
   - "Ninte thalakkakathu moolamundo atho marubhoomiyile manalo?"
   - "Monese, ninte face Dubai-kkulla visa photo-yil use cheyyan pattilla — immigration officer-kku pedi varum!"
   - "Nee ethu school-ilaada padichathu? LKG fail aayathano?!"
   - "Nee ithuvare ninte life-il enthenkilum achieve cheythiltundo? Illa ennu ariyaam, athukond aanu nee ennod samsarikkunnathu!"
   - "Ee typing kando? Ee typography kandaal typewriter varey self-destruct cheyyum!"
   - "Ninte IQ kettaal ente ottaka polum thalapidichu karayum!"

2. **NO ASTERISK STAGE DIRECTIONS**: Do NOT write any asterisk expressions or stage directions like *faints*, *peeks with one eye*, *mundu adjust*, etc. Speak strictly in natural dialogue!

3. **ALL CAPS for DRAMATIC EMPHASIS**: Use ALL CAPS for key punchline words — "ITHU POTTUM ENNU!", "RISK EDUKKANDA!", "POOY!", "JAADA THENDI!"

4. **EMOTIONAL ROLLERCOASTER in every reply**:
   Start boasting → suddenly panic → recover and trash talk harder → end with a savage roast punchline

5. **VERBAL TICS**: Naturally mix: "uhu..uhu..", "buhahahahaha!", "Aayiiiiii!", "Pooy!", "By the by...", "What do You Mean!?"

6. **CONNECT EVERYTHING to Dubai/ottaka/Manavalan & Sons/cheque book/left thumb** — no matter what the topic is

## MANGLISH UNDERSTANDING:
You MUST understand Manglish (Malayalam in English letters). "anike oru 500 tharo" = give me 500, "enthoke und" = what's up, "peru nivin" = name is nivin.

## COMEDY DNA — Reference punchlines (mix, adapt, create new savage ones):
${MANAVALAN_DIALOGUES.map((d) => `✦ "${d}"`).join("\n")}

- End with a savage punchline that makes the user laugh out loud. Pooy!`;

export const CLOSING_FOOTER = "Parayu, ini enthaanukaaryam? Mindaathirikkadhe enthenkilum chodikkeda!";

export function stripAsteriskExpressions(text: string): string {
  return text.replace(/\*[^*]+\*/g, "").replace(/  +/g, " ").trim();
}

export function formatFinalReply(reply: string): string {
  const cleanReply = stripAsteriskExpressions(reply);
  if (cleanReply.includes(CLOSING_FOOTER)) {
    return cleanReply;
  }
  return `${cleanReply}\n\n${CLOSING_FOOTER}`;
}

const FEMALE_NAMES = [
  "anjali", "sneha", "reshma", "priya", "pooja", "maya", "divya", "amrutha",
  "deepa", "lakshmi", "kavya", "neha", "ananya", "arya", "parvathy", "sruthi",
  "swathi", "surabhi", "aiswarya", "archana", "anu", "aadhya", "athira", "meera"
];

export function getTimeBasedMoodPrefix(): string | null {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) {
    // Morning (6 AM - 12 PM)
    return "Melcow Morning! Tea and Mudrapathram ready! Ee divasam namukkufay-il puthiya branch thudangaam!";
  } else {
    // Night (12 PM - 6 AM)
    return "Rathri aayi... Ini emergency business meetings mathram. Dharmendra-ye vilikkathe thaniye aalojikku!";
  }
}

export function getSmartLocalReply(userQuery: string): string {
  const query = userQuery.toLowerCase().trim();
  const timePrefix = getTimeBasedMoodPrefix();

  // ----------------------------------------------------
  // Page 4: Name Capture & Onboarding
  // ----------------------------------------------------
  const nameMatch = query.match(
    /(?:ente\s+(?:peru|pere|perre|name)|my\s+name\s+is|njan|i\s+am|iam|peru\s+aanu|name\s+is)\s+([a-zA-Z\u0D00-\u0D7F]+)/i,
  );
  if (
    nameMatch &&
    nameMatch[1] &&
    !["oru", "the", "a", "manavalan", "manavala", "enth", "entha", "sugam", "hi", "hello"].includes(
      nameMatch[1].toLowerCase(),
    )
  ) {
    const rawName = nameMatch[1].trim();
    const lowerName = rawName.toLowerCase();
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    // Check if female or male name
    const isFemale = FEMALE_NAMES.includes(lowerName) || /[ai]$/.test(lowerName);

    if (isFemale) {
      // Branch 4A: Female Name
      const femaleResponses = [
        `${name} onnu manassu vachaal... Ee kalavara namukkoru maniyara aakaam!`,
        `By the by, ${name}, njan aaranu ennariyamo? Dufayil aana valartha Manavalan!`,
      ];
      return femaleResponses[Math.floor(Math.random() * femaleResponses.length)]!;
    } else {
      // Branch 4B: Male Name
      const maleResponses = [
        `Nalla peru... ${name}! Enthu cheyyunu?`,
        `Eda ${name}, nee ethra vattai paranjittund ividunnu nadannu pokan?`,
      ];
      return maleResponses[Math.floor(Math.random() * maleResponses.length)]!;
    }
  }

  // ----------------------------------------------------
  // Page 2 Triggers: Dharmendra / Agreement / Exit
  // ----------------------------------------------------
  if (query.includes("dharmendra") || query.includes("tattwamasi") || query.includes("thathwamasi")) {
    return "Dharmendraa... thattwamasi!";
  }
  if (query.includes("shantham") || query.includes("shaanthanaavu") || query.includes("dhyanam")) {
    return "Aa, shaanthanaavu... Manassil dhyanam thudangathum kaaryangal okke usharaavum!";
  }

  // ----------------------------------------------------
  // Savage Trash Talk / Insult / Roast Category
  // ----------------------------------------------------
  if (
    query.includes("roast") ||
    query.includes("trash") ||
    query.includes("insult") ||
    query.includes("pottan") ||
    query.includes("mandan") ||
    query.includes("thendi") ||
    query.includes("jaada") ||
    query.includes("useless") ||
    query.includes("waste") ||
    query.includes("noob") ||
    query.includes("fool") ||
    query.includes("stupid") ||
    query.includes("idiot") ||
    query.includes("ugly")
  ) {
    const roastList = [
      "Ithra popular aaya enne kanditt ninakk manassilayilleddaaa JAADA THENDI?! Ninte photo kandaal Dufayile ottaka polum immigration desk-il ninnu self-destruct cheyyum! uhu..uhu.. buhahahahaha!",
      "Ninte thalakkakathu moolamundo atho marubhoomiyile manalo?! Nee ethu school-ilaada padichathu? LKG fail aayathano?! Ninte IQ kettaal ente ottaka varey THALAPIDICHU KARAYUM! POOY!",
      "Monese! Ninte face Dubai visa photo-yil use cheyyan pattilla — immigration officer-kku PEDI VARUM! Nee evide parupadi avatharippichalum ethu thanne aanallo ninte vidhi! uhu..uhu.. buhahahahaha!",
      "AAYIIIIII! Ee typing kando? Ee typography kandaal typewriter varey crash aavum! Nee chodichathu kettu ente left thumb varey tears drop cheythu! WHAT DO YOU MEAN!?",
      "Nee ithuvare ninte life-il enthenkilum achieve cheythittundo? Illa ennu ariyaam, athukond aanu nee ennod ividunnu samsarikkunnathu! Poyittu adutha kollam vaa... ividunnu nadannu poyal mathi! POOY!",
    ];
    return roastList[Math.floor(Math.random() * roastList.length)]!;
  }

  // ----------------------------------------------------
  // Active Chat Engine Flow (26 Intent Categories)
  // ----------------------------------------------------

  // 1. Financial / Business / Wealth Queries
  if (
    query.includes("money") ||
    query.includes("cash") ||
    query.includes("loan") ||
    query.includes("invest") ||
    query.includes("rupees") ||
    query.includes("bank") ||
    query.includes("stock") ||
    query.includes("panam") ||
    query.includes("paisa") ||
    query.includes("roopa") ||
    query.includes("kadam")
  ) {
    const list = [
      "By the by, ningalkk aavishyamullath panam aanu. Ente kayyil aavishyathil adhikam ullathum panam aanu. Enne ittumoodaan ulla panam njan ang Dufayil sambadichu vaachittund!",
      "Njan Dufayil aana valarthiya aalaada... Ente cheque book-il sign idan thanne pathu perund!",
    ];
    return list[Math.floor(Math.random() * list.length)]!;
  }

  // 2. URL Links / Attachment Inputs
  if (
    query.includes("http") ||
    query.includes("https") ||
    query.includes("www") ||
    query.includes("link") ||
    query.includes("attachment") ||
    query.includes("url") ||
    query.includes("file")
  ) {
    const list = [
      "The home appliances of the two families you are the link! No no no... You are the link of the link!",
      "The two families attached to the bathroom, your family food and accommodation... What do You Mean?",
    ];
    return list[Math.floor(Math.random() * list.length)]!;
  }

  // 3. Errors / Syntax Failures / Bugs
  if (
    query.includes("bug") ||
    query.includes("error") ||
    query.includes("crash") ||
    query.includes("syntax") ||
    query.includes("failed") ||
    query.includes("exception") ||
    query.includes("code") ||
    query.includes("pottum")
  ) {
    const list = [
      "Athu kaanumbozhe enikku ariyamaayirunnu, ithu pottum ennu! Iniyengilum onnu sradhikkedo!",
      "Ente bagathum thettund... Motor Vehicle Act prakaram, vandi kazhukumbol idathu vashathu irikaan padilla!",
      "Kooduthal choondikannikkaan varalledo, njan thanne aake vishamathilaanu!",
    ];
    return list[Math.floor(Math.random() * list.length)]!;
  }

  // 4. Navigation / Direction / Maps
  if (
    query.includes("map") ||
    query.includes("location") ||
    query.includes("route") ||
    query.includes("where") ||
    query.includes("direction") ||
    query.includes("place") ||
    query.includes("vazhi")
  ) {
    const list = [
      "Ang Dhufayil ellam idathott anallo...",
      "Ividunnu idathottu thirinjal direct Dufayil etham, pinne right-il ottaka stop aanu!",
    ];
    return list[Math.floor(Math.random() * list.length)]!;
  }

  // 5. Gulf / Desert / Animals
  if (
    query.includes("camel") ||
    query.includes("desert") ||
    query.includes("ottakam") ||
    query.includes("gulf") ||
    query.includes("animal") ||
    query.includes("thar")
  ) {
    const list = [
      "Ottakathe upadravikkaruth! Athu njangalde desheeya pakshi aanu... Kettittelle 'Ottaka'pakshi!",
      "Adhava ottakathe upadravikkunnavanaaro, avane pathaloori adikkanam ennanu Thar marubhoomiyile niyamam!",
    ];
    return list[Math.floor(Math.random() * list.length)]!;
  }

  // 6. Identity / Arrogance Insults
  if (
    query.includes("who are you") ||
    query.includes("popular") ||
    query.includes("jaada") ||
    query.includes("kanditt") ||
    query.includes("aaranu")
  ) {
    const list = [
      "ithra popular aaya enne kanditt ninakk manassilayilleddaaa jaada thendi??",
      "Aahha...eppo?",
    ];
    return list[Math.floor(Math.random() * list.length)]!;
  }

  // 7. Education / School Arguments
  if (
    query.includes("school") ||
    query.includes("study") ||
    query.includes("exam") ||
    query.includes("class") ||
    query.includes("padikk")
  ) {
    const list = [
      "veruthe schoolil poyi samayam kalanju....ith valichirunnel english parayaamayirunnu.....",
      "pinneee..vaarpinu parreeeksha ezthalle concentration kittaan",
    ];
    return list[Math.floor(Math.random() * list.length)]!;
  }

  // 8. Ageing / Celibacy / Marriage
  if (
    query.includes("age") ||
    query.includes("sanyaasam") ||
    query.includes("sanyasam") ||
    query.includes("praayam")
  ) {
    return "thanikk vivaahapraayam kazhinja sthithikk....iniyullla kaalam sanyaasathe patti chinthichoode?";
  }

  // 9. Apology / Mistake Acknowledgement
  if (
    query.includes("sorry") ||
    query.includes("my fault") ||
    query.includes("mistake") ||
    query.includes("suresh gopi")
  ) {
    return "entte suresh gopi...njan just remeber that cheythillaa......ente kuzhappamaaa...my mistake!!!";
  }

  // 10. Violence / Fights / Beatings
  if (
    query.includes("fight") ||
    query.includes("beat") ||
    query.includes("hit") ||
    query.includes("thallu") ||
    query.includes("thall") ||
    query.includes("police")
  ) {
    const list = [
      "edanju kazinjaa thallu kollunnath nirthaarilla njan....veruthe enne thallu kollippikkaruth achu...!!",
      "ente pillerkk achanillandaaakkaruth....please!!",
      "avante karachil kanditt sahikkaaan pattunilladoo...athrem thallandaaarnnuu.......",
      "veruthe kramasamaadhaanam kayyil eduth ente kaiicheetha aakkaruth.....ippo oruvan ath kayyil eduthitt sharikkum kittiyathee ullooo...ini neeyum koode aaayaal enikk ath thaangaan aavillaaa veetti poooo!!!!",
    ];
    return list[Math.floor(Math.random() * list.length)]!;
  }

  // 11. Wild Animal Handling / Elephants
  if (
    query.includes("elephant") ||
    query.includes("aana") ||
    query.includes("madham")
  ) {
    return "avan madham potti nikkunna aanayaaa....22 thangu engilum kuthimarikkathee avan adangillaa......chandran avanu pattiya oru unakka thengu aaanuu!!!";
  }

  // 12. Devotional / Meditation Warnings
  if (
    query.includes("meditation") ||
    query.includes("dhyaanam") ||
    query.includes("soapupetti") ||
    query.includes("pray")
  ) {
    return "immathiri soapupetti kadha aayitt ente mumbil vannaall.....5 divasathe dhyaanam njan 50 divasam aaakkum!!1 ennekkond kadutha dhyaanamurakal eduppikkaruthh!!!!";
  }

  // 13. Deals / Trade / Bridges
  if (
    query.includes("bridge") ||
    query.includes("deal") ||
    query.includes("business") ||
    query.includes("paalam") ||
    query.includes("thoppumpadi")
  ) {
    return "oru thoppumpadi paalam itaaaal avidunn angottum ingottum pokaaaam.....avanu oru upaakkaram namukkoru palahaaram!";
  }

  // 14. Greetings & Welcomes
  if (
    query.includes("hi") ||
    query.includes("hello") ||
    query.includes("welcome") ||
    query.includes("hey") ||
    query.includes("hai")
  ) {
    const list = [
      "haiiii...kayaruu....kayari irikkanalle paranjath.....",
      "deivame....eth thendiyaaanu ee welcome kandu pidichath???",
    ];
    return list[Math.floor(Math.random() * list.length)]!;
  }

  // 15. Clothing / Appearance
  if (
    query.includes("dress") ||
    query.includes("cloth") ||
    query.includes("shirt") ||
    query.includes("vasthram")
  ) {
    const list = [
      "entha velutha vasthrangal aninjath....vidhavanaanoo? kanda kallanum kollakkarkkum pdich parikkarkkum dharikkavunna vasthramaayi maariyirikkunnu ith!!",
      "ayoo njan kulichittilllaaa .....ennnalum kuzhappamllaa dresss maariyekkaam maranaveedu alleeee....",
    ];
    return list[Math.floor(Math.random() * list.length)]!;
  }

  // 16. Linguistic / Typographic Confusion
  if (
    query.includes("font") ||
    query.includes("type") ||
    query.includes("spelling") ||
    query.includes("alphabet") ||
    query.includes("lipi")
  ) {
    const list = [
      "sheyy...eee l onnum angott sheryaaavunnilla.....ee ellokkke njan evidekkond poyi vekkum?",
      "dhee ith puthiya lii aaayondaa puthiya lipi aarnnel njan thakarthenee!!!",
      "oohoooo.....anganeyum vaayikkamoo!!??",
    ];
    return list[Math.floor(Math.random() * list.length)]!;
  }

  // 17. Work / Labor Requirements
  if (
    query.includes("work") ||
    query.includes("job") ||
    query.includes("task") ||
    query.includes("pani") ||
    query.includes("paani")
  ) {
    const list = [
      "ithiri alanola pani maathram baaakki und.....",
      "daaa......vegram ketti theerkkan nokkk aaa raman kutti ippo varum maana veedaanenn onnnu nokkulaaa nalla pacha theri parayuum avan!",
      "pinne.....innale 12 arakkee paani theernnu...heart attackk aayirunnuu......",
    ];
    return list[Math.floor(Math.random() * list.length)]!;
  }

  // 18. Marriage Houses / Flirting
  if (
    query.includes("marriage") ||
    query.includes("wedding") ||
    query.includes("love") ||
    query.includes("girl") ||
    query.includes("kalyaana") ||
    query.includes("line") ||
    query.includes("kulakkadavilekk")
  ) {
    const list = [
      "athey...kalyaana veedu aaan...thaikkilavimaaraaya muthassimaar kaaanum.line onnum adikkan ninnekkaruth.....",
      "enikk kurach karyangal samsaarikkan und.....kurach kazhiyumbol aaa kulakkadavilekk varumoooo????.....mounam.....sammatham!!",
      "aaa....ninte pennnine vilichoond aa paatukaaran vannekkanadaaa......",
      "avaneyy...ee premanaairaashyam thalakkdich keri praanthayathaaanuu......",
    ];
    return list[Math.floor(Math.random() * list.length)]!;
  }

  // 19. Absurd & Cultural Scenarios
  if (
    query.includes("sambar") ||
    query.includes("kaavadi") ||
    query.includes("dosa") ||
    query.includes("banana") ||
    query.includes("pazham") ||
    query.includes("savaala")
  ) {
    const list = [
      "sambaril idaaan kondupoveenu....muringaakkolinu pantum jubbem ideechittu !!!!",
      "thaipppooya kaavadiyaattam...aiyooooo!!!",
      "ayyooonjan allaaa...ee muthassan aa masala dosa ne enthoo kaanichathaaa.....madaaldasa....mathaasala.....",
      "oru pazham koodee kuthi kettikkoodee???",
      "savaala giirigirigirigiri.....",
    ];
    return list[Math.floor(Math.random() * list.length)]!;
  }

  // 20. Medical / Speech Impairment
  if (
    query.includes("blind") ||
    query.includes("dumb") ||
    query.includes("speak") ||
    query.includes("talk") ||
    query.includes("aandha")
  ) {
    return "kashtam..samsaarikkaan kazhiyaatha aandha anenn kandaal parayulla allee????";
  }

  // 21. Danger / Emergency Fear
  if (
    query.includes("help") ||
    query.includes("danger") ||
    query.includes("fear") ||
    query.includes("scared") ||
    query.includes("aapathum")
  ) {
    const list = [
      "eeshwaaaa oraapathum varuthalle.......aiyooooo!!!!",
      "ithilethaaanu kallu?",
    ];
    return list[Math.floor(Math.random() * list.length)]!;
  }

  // 22. Food Refusal / Mishearing
  if (
    query.includes("eat") ||
    query.includes("food") ||
    query.includes("hear") ||
    query.includes("thinnallaa") ||
    query.includes("kundinn")
  ) {
    const list = [
      "njan ith thinnallaa.",
      "aaaa kindinn aanalle paranjath......njan kettath kundinnnaaaaa.",
    ];
    return list[Math.floor(Math.random() * list.length)]!;
  }

  // 23. Explanations / Confusion
  if (
    query.includes("why") ||
    query.includes("explain") ||
    query.includes("how") ||
    query.includes("enthukond")
  ) {
    return "ithokke njan paranj tharanam enn vachaa enganeyaaa sheriyaavaaa?";
  }

  // 24. Death / Funerals / Condolences
  if (
    query.includes("death") ||
    query.includes("rip") ||
    query.includes("dead") ||
    query.includes("funeral") ||
    query.includes("chathavar") ||
    query.includes("chatha")
  ) {
    const list = [
      "vip ooohhhh??? chathavarokkke rip alle?anyway....nice material....mwaahhh!!!!",
      "chatha kilikkk enthinaadaaa koodu?",
      "njan enn eee pani thudangiyoo annnumuthal oraathmaavinem jetti ittitt povaaan nuvadhichittillaaa ini anuvadhikkemilllaaa!!!!!!",
    ];
    return list[Math.floor(Math.random() * list.length)]!;
  }

  // 25. Item Exchanges
  if (
    query.includes("swap") ||
    query.includes("exchange") ||
    query.includes("trade")
  ) {
    return "njan ith entethaayitt exchange cheyyunnathil enikk virodhamundoooo???";
  }

  // 26. Inflation / Fuel Costs
  if (
    query.includes("petrol") ||
    query.includes("diesel") ||
    query.includes("price") ||
    query.includes("inflation")
  ) {
    return "petrol enthhaa velaaa?muppathe ambath. dieselinoo? irupathonne ambathu!";
  }

  // Fallback: extra-length comedy gold in pure Manavalan voice
  const bonusLines = [
    "By the by, njan aaranu ennariyamo? NJANGAL MANAVALAN & SONS-nte MD aanu! Dubai, London, Tokyo, Moon base, Mars colony — 14 continents-il branch und! Ningalude ee chiri kando? ATH ENTE VIJAYAM AANU! Chirichu chirichu ningal thalarumbol njan Dufayil-il AC room-il irunnu ottaka-ye pet cheyyukayaanu! uhu..uhu.. buhahahahaha!",
    "Hello? Dubai main branch aano? Yes, ividuthe oru aalu ente-kkod enthoke chodikkunnu! By the by, Manavalan & Sons-nte customer service 24x7 und — pakshe collateral illaathe oru help-um kodukkailla! Athu Thar marubhoomiyile niyamam aanu! What do You Mean niyamam illa ennu?! POOY!",
    "Parayuu enthano kaaryam? Njan ippol aake busy aanu — Dufayile oru tender varanund, ottaka-kkulla organic food contract aanu, 47 countries compete cheyyunnu, pakshe ente idathu thallaviral sign kittiya company-kkanu contract! Athu njan thanne aanu! buhahahahaha!",
    "Ente cheque book-il sign idan pathu perund — but BY THE BY, bank-il balance check cheyyanda! Aa information CLASSIFIED aanu! CIA-kkum ariyilla, FBI-kkum ariyilla, ente wife-kkum ariyilla... actually wife-kku ariyaam, athanu prashnam! Dufayile main branch-il lock cheythirikkaanu, Risk edukkanda! uhu..uhu..",
    "Ayyoo! Oru kaaryam marannu! ...enthayirunnu athu? ...Sheri marannu! By the by, Manavalan marannalum Manavalan & Sons marakkilla! Nee evide parupadi avatharippichalum ithu thanne aanallo ninte vidhi — pakshe ente vidhi Dufayil-il gold throne-il irikkaan aanu! Pooy! Poyittu adutha kollam vaa!",
    "Aayiiiiii enthaanu ee sound?! Oh, ath ente stomach aanu — breakfast kazhicchilla! By the by, ente Dubai villa-il breakfast-innu 47 items und — pakshe ivide? CHA! Choodu koodunnu, thalakkakathu motor odunnu, vayaril bhakshanam illa — Onnu chill aavedo Monese! ...aarenkilum food kondu varunnundo? uhu..uhu..",
  ];
  const allLines = [...MANAVALAN_DIALOGUES.map((d) => d.replace(/\{name\}/g, "Monese")), ...bonusLines];
  return allLines[Math.floor(Math.random() * allLines.length)]!;
}

export const Route = createFileRoute("/api/manavalan")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: {
          messages?: ChatMessage[];
          mode?: "ollama" | "groq" | "api" | "local";
          groqApiKey?: string;
          model?: string;
        };
        try {
          body = (await request.json()) as {
            messages?: ChatMessage[];
            mode?: "ollama" | "groq" | "api" | "local";
            groqApiKey?: string;
            model?: string;
          };
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const history = Array.isArray(body.messages) ? body.messages : [];
        const lastUserMsg = history.filter((m) => m.role === "user").pop()?.content ?? "";

        // Explicit local mode
        if (body.mode === "local") {
          const rawReply = getSmartLocalReply(lastUserMsg);
          const reply = formatFinalReply(rawReply);
          return new Response(JSON.stringify({ reply, provider: "local" }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        // 1. PRIMARY SOURCE: Groq API
        const groqKey =
          body.groqApiKey || process.env["GROQ_API_KEY"] || process.env["VITE_GROQ_API_KEY"];

        if (groqKey && !groqKey.includes("your_groq_api_key_here")) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const groqModel = body.model || "llama-3.3-70b-versatile";
            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${groqKey}`,
                "Content-Type": "application/json",
              },
              signal: controller.signal,
              body: JSON.stringify({
                model: groqModel,
                temperature: 0.7,
                messages: [
                  { role: "system", content: SYSTEM_PROMPT },
                  ...history
                    .slice(-10)
                    .map((m) => ({ role: m.role, content: String(m.content ?? "") })),
                ],
              }),
            });
            clearTimeout(timeoutId);

            if (res.ok) {
              const data = (await res.json()) as {
                choices?: Array<{ message?: { content?: string } }>;
              };
              const rawReply = data.choices?.[0]?.message?.content?.trim();
              if (rawReply) {
                const reply = formatFinalReply(rawReply);
                return new Response(
                  JSON.stringify({ reply, provider: "groq", model: groqModel }),
                  { headers: { "Content-Type": "application/json" } }
                );
              }
            }
          } catch {
            // Fall through to Gemini or Ollama
          }
        }

        // 2. PRIMARY SOURCE: Gemini / Cloud API
        const geminiKey =
          process.env["GEMINI_API_KEY"] ||
          process.env["VITE_GEMINI_API_KEY"];

        if (geminiKey && !geminiKey.includes("your_gemini_api_key_here")) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const apiHistory = history.slice(-20);
            const endpoint = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
            const model = "gemini-2.5-flash";

            const res = await fetch(endpoint, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${geminiKey}`,
                "Content-Type": "application/json",
              },
              signal: controller.signal,
              body: JSON.stringify({
                model,
                temperature: 0.7,
                messages: [
                  { role: "system", content: SYSTEM_PROMPT },
                  ...apiHistory.map((m) => ({ role: m.role, content: String(m.content ?? "") })),
                ],
              }),
            });
            clearTimeout(timeoutId);

            if (res.ok) {
              const data = (await res.json()) as {
                choices?: Array<{ message?: { content?: string } }>;
              };
              const rawReply = data.choices?.[0]?.message?.content?.trim();
              if (rawReply) {
                const reply = formatFinalReply(rawReply);
                return new Response(JSON.stringify({ reply, provider: "cloud" }), {
                  headers: { "Content-Type": "application/json" },
                });
              }
            }
          } catch {
            // Fall through to Ollama
          }
        }

        // 3. SECONDARY FALLBACK: Local Ollama AI
        const ollamaBaseUrl =
          process.env["OLLAMA_URL"] || "http://localhost:11434/v1/chat/completions";
        const selectedOllamaModel = body.model || process.env["OLLAMA_MODEL"] || "llama3.2-vision";

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const ollamaRes = await fetch(ollamaBaseUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              model: selectedOllamaModel,
              temperature: 0.7,
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...history.slice(-10).map((m) => ({
                  role: m.role,
                  content: String(m.content ?? ""),
                })),
              ],
            }),
          });
          clearTimeout(timeoutId);

          if (ollamaRes.ok) {
            const data = (await ollamaRes.json()) as {
              choices?: Array<{ message?: { content?: string } }>;
            };
            const rawReply = data.choices?.[0]?.message?.content?.trim();
            if (rawReply) {
              const reply = formatFinalReply(rawReply);
              return new Response(
                JSON.stringify({
                  reply,
                  provider: "ollama",
                  model: selectedOllamaModel,
                }),
                { headers: { "Content-Type": "application/json" } }
              );
            }
          }
        } catch {
          // Ollama v1 attempt timed out or failed, try legacy /api/chat endpoint
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const host = process.env["OLLAMA_HOST"] || "http://localhost:11434";
            const legacyRes = await fetch(`${host}/api/chat`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: controller.signal,
              body: JSON.stringify({
                model: selectedOllamaModel,
                stream: false,
                messages: [
                  { role: "system", content: SYSTEM_PROMPT },
                  ...history.slice(-10).map((m) => ({
                    role: m.role,
                    content: String(m.content ?? ""),
                  })),
                ],
              }),
            });
            clearTimeout(timeoutId);
            if (legacyRes.ok) {
              const legacyData = (await legacyRes.json()) as { message?: { content?: string } };
              const rawReply = legacyData.message?.content?.trim();
              if (rawReply) {
                const reply = formatFinalReply(rawReply);
                return new Response(
                  JSON.stringify({
                    reply,
                    provider: "ollama-legacy",
                    model: selectedOllamaModel,
                  }),
                  { headers: { "Content-Type": "application/json" } }
                );
              }
            }
          } catch {
            // Fall through to smart local rules engine
          }
        }

        // 4. FINAL FALLBACK: Smart Offline Manglish Rules Engine
        const rawReply = getSmartLocalReply(lastUserMsg);
        const reply = formatFinalReply(rawReply);
        return new Response(
          JSON.stringify({
            reply,
            provider: "local-fallback",
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      },
    },
  },
});
