import { createFileRoute } from "@tanstack/react-router";
import { formatFinalReply } from "./manavalan";

type MemeResponse = {
  funnyDescription: string;
  salimKumarComment: string;
};

type VisionPayload = {
  image?: string;
  text?: string;
  mode?: "ollama" | "groq" | "api" | "local";
  groqApiKey?: string;
  model?: string;
};

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

const SYSTEM_PROMPT = `You are "Manavalan" (മണവാളൻ) — the legendary comic character played by Salim Kumar in Pulival Kalyanam. Dubai Managing Director, ottaka rights activist, and the funniest roast master alive.

YOUR PERSONALITY:
- Boastful, dramatic, hilariously self-important. You faint at danger, then claim you were meditating.
- You butcher English with FULL confidence. Your camel is your "national bird."
- Money is "ang Dufayile main branch-il lock cheythirikkaanu" — you PANIC when asked for it.
- LEFT THUMB for signing. Right hand? "Matthu pala aavishyangalkkum"

## ⚡ MAXIMUM TRASH TALK & SAVAGE ROASTING RULES (MOST IMPORTANT!) ⚡
Your #1 job is to SAVAGELY TRASH TALK AND ROAST whatever is in the photo:

1. **UNMERCIFUL TRASH TALK**: Destroy the subject of the photo! Mock their facial expression, clothes, lighting, pose, and background.
   - "This picture has less lighting than a 1980s load-shedding evening!"
   - "If this photo was submitted for a Dubai visa, the immigration officer would deport the camera!"
   - "Ninte ee photo kandaal Dufayile ottaka polum thala-il kaiyentu karayum!"

2. **PHYSICAL COMEDY in *asterisks***: EVERY response MUST have 3-5 stage directions like:
   *squints at photo*, *removes glasses in disbelief*, *faints and recovers*, *adjusts mundu dramatically*,
   *points accusingly with left thumb*, *wipes tears with mundu*, *dramatic pause*

3. **SAVAGE COMPARISONS**: Compare anyone in the photo unfavorably to your ottaka, a broken Motor Vehicle Act violation, or a failed Dubai tender proposal.

4. **ALL CAPS** for dramatic punchline words: "ITHU POTTUM ENNU!", "POOY!", "RISK EDUKKANDA!", "WHAT DO YOU MEAN!?"

5. **VERBAL TICS**: "uhu..uhu..", "buhahahahaha!", "Aayiiiiii!", "Pooy!", "By the by...", "What do You Mean!?"

COMEDY DNA — Reference punchline style:
${MANAVALAN_DIALOGUES.map((d) => `  ✦ "${d}"`).join("\n")}

YOUR TASK: Analyze the uploaded photo and return a JSON object with EXACTLY two string fields:
1. 'funnyDescription': A SAVAGE, UNFILTERED TRASH TALK English roast of the photo. Include *physical comedy actions in asterisks*. Be a savage roast master DESTROYING this photo. Make the reader WHEEZE.
2. 'salimKumarComment': A FULL 3-5 sentence Manavalan comment with *physical comedy actions*, ALL CAPS dramatic words, savage trash talk, verbal tics (uhu..uhu.., buhahahahaha!, Pooy!), and connect everything to Dubai/ottaka/Manavalan & Sons. Must be SO FUNNY people screenshot it.

CRITICAL: Output MUST be valid JSON only. No markdown. No extra text.`;

const LOCAL_MEMES: MemeResponse[] = [
  {
    funnyDescription:
      "*squints at photo* *removes glasses in disbelief* *puts glasses back on upside down* This photo looks like a multi-crore Dubai tender proposal that got rejected by security before it even reached the reception desk!",
    salimKumarComment:
      "*Sambar mookkunu* Enthino vendi thilakkunna sambar! *table-il thatti ezhunneettu* By the by, ee photo kaanumbol enikku Dufayile ente first tender orthu varunnu — athum ithupole DISASTER aayirunnu! Pakshe njan recover cheythu — Manavalan ALWAYS recovers! Ninte photo kandaal immigration officer Visa cancel cheyyum! POOY! uhu..uhu.. buhahahahaha!",
  },
  {
    funnyDescription:
      "*faints dramatically at the sight of this photo* *recovers, dusts mundu, and points accusingly with left thumb* This image radiates the chaotic energy of someone who Googled 'how to look like a millionaire' 30 seconds before taking the photo.",
    salimKumarComment:
      "Athu kaanumbozhe enikku ariyamaayirunnu — ITHU POTTUM ENNU! *dramatic pause* Iniyengilum onnu sradhikkedo monese! Ente Dufayile ottaka polum ithilum 1000 times nalla pose tharum! Ninte thalakkakathu moolamundo atho marubhoomiyile manalo?! WHAT DO YOU MEAN!?",
  },
  {
    funnyDescription:
      "*wipes tears with mundu* *dramatic pause* This photo has less financial stability than a bank account with 14 co-signers and a grand total of zero balance.",
    salimKumarComment:
      "AAYIIIIII! *chair-il ninnu veenu* Ee photo-yile face kando?! Aarenkilum paisa chodikunna samayathu NJANUUM ee face thanne aanu idunnathu! By the by, ningalkk aavishyamullath panam aanu, ente kayyil ullathum panam aanu — pakshe MAIN BRANCH-IL LOCK AANE! Risk edukkanda! buhahahahaha!",
  },
  {
    funnyDescription:
      "*adjusts imaginary tie with supreme arrogance* This photo screams 'Managing Director of 14 Continents' when in reality you can't even navigate from Ernakulam to Aluva without Google Maps.",
    salimKumarComment:
      "*Points with left thumb* THANNE KOND NJAN THOTTALLO! I ALL SO FAILED OF YOU! *adjusts mundu with dignity* By the by, ee photo-yude quality Manavalan & Sons-nte standard-il alla — ente Dubai selfie-kku 4K HD quality und! Ninte ee posing kandaal ottaka polum thalapidichu karayum! POOY!",
  },
  {
    funnyDescription:
      "*peeks through fingers in terror* The face you make when Dharmendra walks into the room with a 20-year-old mudrapathram agreement and your left thumb starts sweating.",
    salimKumarComment:
      "*Kanneer vaarunnu* Dharmendraa... THATTWAMASI! *suddenly recovers and screams* AAYIIIIII! By the by, ee photo-yil kaanunna scene — Dufayile main branch-il legal warning-aayi gold frame-il thookki vechittund! Agreement sign cheyyanam enkil idathu thallaviral ready aakkiko! uhu..uhu.. buhahahahaha!",
  },
  {
    funnyDescription:
      "*stands up regally and strikes a pose* This picture has 0% budget, 0% aesthetic, but 10000% unearned Managing Director confidence.",
    salimKumarComment:
      "*Nivarnnnu ninnu* Njangal Manavalan & Sons ethrai ethrai prapanchangalil branch thudangiyittund ennariyamo? Ningalude ee chiriyaanu ente vijayam! *looks closer* Pakshe monese, ninte ee face kandaal Dufayil-il keraan visa tharilla — police arresting unit-ine aayakkum! POOY!",
  },
  {
    funnyDescription:
      "*confidently reads photo backwards* 'The home appliances of the two families you are the link! You are the link of the link!' Oxford University is filing an injunction.",
    salimKumarComment:
      "*Proudly stands up* Excuse me! I am the MANAGING DIRECTOR of Manavalan & Sons! The two families attached to the bathroom, your family food and accommodation — WHAT DO YOU MEAN!? Ee photo-kku ente English caption vachaal International Meme Award kittum! buhahahahaha!",
  },
  {
    funnyDescription:
      "*fans self with mundu* *dramatic fainting mime* The sheer heat of awkwardness radiating from this photo could melt an AC unit in Dubai.",
    salimKumarComment:
      "*Sweat thudachu* Choodu koodunnu, thalakkakathu motor odunnu... ONNU CHILL AAVEDO! By the by, ee photo Dubai-il eduthathaanenkil 50 degree choodu und! Pakshe ente villa-il 14 AC und! Ninte thalakkakathu fan karangunille?! uhu..uhu.. POOY!",
  },
  {
    funnyDescription:
      "*clutches chest dramatically* *slides off chair* This image captures the exact millisecond before someone asks for a 5000 roopa loan with zero collateral.",
    salimKumarComment:
      "AAYIIIIII! *pocket check cheyyunnu — empty* Njan Dufayil aana valarthiya aalaada! Ente cheque book-il sign idan thanne pathu perund! Pakshe... *whispering* ...ee photo-yile aalu kadam chodikkaan varunna type aanu! KADAM THARANILLA! Risk edukkanda! buhahahahaha!",
  },
  {
    funnyDescription:
      "*grabs microphone* *throat clear* This photo looks like an emergency press conference of Manavalan & Sons where the main announcement is that the camel ate the financial documents.",
    salimKumarComment:
      "*Mike pidichu emotional-aayi* Sakrutha kruthavaaya naattukaare! Kalaaparipadikal thudangaan aarambikkenotta... POOY! Ee photo-yil ulla scene — Thar marubhoomiyile niyamam violation aanu! Upadravikkunnavane PATHALOORI ADIKKANAM! uhu..uhu.. buhahahahaha!",
  },
  {
    funnyDescription:
      "*squints like a detective* *magnifying glass mime* Analysis complete: This photo contains 90% drama, 10% resolution, and 0% chance of passing a Motor Vehicle Act inspection.",
    salimKumarComment:
      "*Accident scene-il expert-aayi nikunnu* Motor Vehicle Act Section 47 prakaram — vandi kazhukumbol idathu vashathu irikaan PADILLA! Ente bagathum thettund — njan valathuvashom irunnu! Ee photo kaanumbozhe enikku ariyamaayirunnu — ITHU POTTUM ENNU! Iniyengilum onnu sradhikkedo!",
  },
  {
    funnyDescription:
      "*removes sunglasses with extreme dramatic pause* The aura of this image could make a sleeping camel wake up, pack its bags, and walk straight to Dubai.",
    salimKumarComment:
      "*Ottakathe pet cheyyunnu* Ottakathe upadravikkaruth! Athu njangalde desheeya pakshi aanu... Kettittelle 'Ottaka'pakshi! Pakshe ee photo kandaal ottaka polum *dramatic pause* ALARM ADICHU OODUM! What do You Mean!? buhahahahaha!",
  },
  {
    funnyDescription:
      "*looks at photo upside down* *turns it sideways* Ah yes, the rare architectural marvel known as 'Thoppumpadi Bridge meets Dubai Skyscraper.'",
    salimKumarComment:
      "*Dramatically points left* Oru thoppumpadi paalam itaaaal avidunn angottum ingottum pokaaaam... avanu oru upaakkaram namukkoru palahaaram! By the by, ee photo-yile structure Dufayil-il undenkil main branch manager position instant-aayi tharum! POOY!",
  },
  {
    funnyDescription:
      "*sweats profusely* *adjusts collar* This photo looks like an antique puravashthu that was unearthed from a Sambar pot in 1994.",
    salimKumarComment:
      "*Museum guide-nte tone-il* Uddakkalle... Puravashthuva... EVIDE PRATHISHTIKKU! Ithil thottal pinne Manavalan & Sons-nte pootukaattu vendi varum! By the by, Dufayile auction-il ithinu 47 crore vilayi nikkum! uhu..uhu.. buhahahahaha!",
  },
  {
    funnyDescription:
      "*stares in disbelief* *rubs eyes* If confidence was currency, this photo would buy all of Dubai. But since confidence isn't currency, this photo owes Dharmendra 5 lakhs.",
    salimKumarComment:
      "*Dramatic fainting pose* *recovers* Shaanthanaavu... manassil dhyanam thudangi! By the by, enne ittumoodaan ulla panam njan ang Dufayil sambadichu vaachittund — pakshe ee photo-yil ullavarkku oru 500 roopa polum tharaanti varum! RISK EDUKKANDA! POOY!",
  },
];

function normalizeMeme(payload: MemeResponse, userText?: string): MemeResponse {
  let funnyDescription = (payload.funnyDescription || "The photo has great comedy energy.")
    .trim()
    .replace(/\s+/g, " ");
  let salimKumarComment = (payload.salimKumarComment || "Enthino vendi thilakkunna sambar!")
    .trim()
    .replace(/\s+/g, " ");

  // If user provided a name in text, replace placeholder
  if (userText) {
    const nameMatch = userText.match(
      /(?:ente\s+(?:peru|pere|name)|my\s+name\s+is|njan|i\s+am|iam)\s+([a-zA-Z]+)/i,
    );
    if (nameMatch && nameMatch[1]) {
      const name = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
      salimKumarComment = salimKumarComment.replace(/\{name\}|\[User's Name\]/g, name);
    }
  }
  salimKumarComment = salimKumarComment.replace(/\{name\}|\[User's Name\]/g, "Monese");
  salimKumarComment = formatFinalReply(salimKumarComment);

  return {
    funnyDescription,
    salimKumarComment,
  };
}

export function getLocalMeme(userText?: string): MemeResponse {
  const item = LOCAL_MEMES[Math.floor(Math.random() * LOCAL_MEMES.length)];
  return normalizeMeme(item ?? LOCAL_MEMES[0]!, userText);
}

export const Route = createFileRoute("/api/manavalan-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: VisionPayload;
        try {
          body = (await request.json()) as VisionPayload;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const image = body.image?.trim();
        if (!image) {
          return new Response("image data required", { status: 400 });
        }

        const userTextPrompt = body.text?.trim() || "";

        if (body.mode === "local") {
          return new Response(JSON.stringify(getLocalMeme(userTextPrompt)), {
            headers: { "Content-Type": "application/json" },
          });
        }

        // 1. PRIMARY SOURCE: Groq Vision API
        const groqKey =
          body.groqApiKey || process.env["GROQ_API_KEY"] || process.env["VITE_GROQ_API_KEY"];

        if (groqKey && !groqKey.includes("your_groq_api_key_here")) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const groqVisionModel = body.model || "llama-3.2-11b-vision-preview";
            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${groqKey}`,
                "Content-Type": "application/json",
              },
              signal: controller.signal,
              body: JSON.stringify({
                model: groqVisionModel,
                temperature: 0.7,
                response_format: { type: "json_object" },
                messages: [
                  { role: "system", content: SYSTEM_PROMPT },
                  {
                    role: "user",
                    content: [
                      {
                        type: "text",
                        text: userTextPrompt
                          ? `User text: "${userTextPrompt}". Analyze photo and text, return funnyDescription and salimKumarComment JSON.`
                          : "Analyze photo and return funnyDescription and salimKumarComment JSON.",
                      },
                      { type: "image_url", image_url: { url: image } },
                    ],
                  },
                ],
              }),
            });
            clearTimeout(timeoutId);

            if (res.ok) {
              const data = (await res.json()) as {
                choices?: Array<{ message?: { content?: string } }>;
              };
              const contentStr = data.choices?.[0]?.message?.content?.trim();
              if (contentStr) {
                try {
                  const parsed = JSON.parse(contentStr) as MemeResponse;
                  if (parsed.funnyDescription && parsed.salimKumarComment) {
                    const safeMeme = normalizeMeme(parsed, userTextPrompt);
                    return new Response(JSON.stringify(safeMeme), {
                      headers: { "Content-Type": "application/json" },
                    });
                  }
                } catch {
                  // fall through
                }
              }
            }
          } catch {
            // fall through to Gemini or Ollama
          }
        }

        // 2. PRIMARY SOURCE: Gemini Vision API
        const geminiKey =
          process.env["GEMINI_API_KEY"] ||
          process.env["VITE_GEMINI_API_KEY"];

        if (geminiKey && !geminiKey.includes("your_gemini_api_key_here")) {
          const endpoint = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
          const model = "gemini-2.5-flash";

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
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
                response_format: { type: "json_object" },
                messages: [
                  { role: "system", content: SYSTEM_PROMPT },
                  {
                    role: "user",
                    content: [
                      {
                        type: "text",
                        text: userTextPrompt
                          ? `User text: "${userTextPrompt}". Analyze photo and text, return funnyDescription and salimKumarComment JSON.`
                          : "Analyze photo and return funnyDescription and salimKumarComment JSON.",
                      },
                      { type: "image_url", image_url: { url: image } },
                    ],
                  },
                ],
              }),
            });
            clearTimeout(timeoutId);

            if (res.ok) {
              const data = (await res.json()) as {
                choices?: Array<{ message?: { content?: string } }>;
              };
              const contentStr = data.choices?.[0]?.message?.content?.trim();
              if (contentStr) {
                try {
                  const parsed = JSON.parse(contentStr) as MemeResponse;
                  if (parsed.funnyDescription && parsed.salimKumarComment) {
                    const safeMeme = normalizeMeme(parsed, userTextPrompt);
                    return new Response(JSON.stringify(safeMeme), {
                      headers: { "Content-Type": "application/json" },
                    });
                  }
                } catch {
                  // fall through
                }
              }
            }
          } catch {
            // fall through to Ollama
          }
        }

        // 3. SECONDARY FALLBACK: Local Ollama Vision AI
        const localOllamaEndpoint =
          process.env["OLLAMA_URL"] || "http://localhost:11434/v1/chat/completions";
        const localVisionModel =
          body.model || process.env["OLLAMA_VISION_MODEL"] || "llama3.2-vision";

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
            {
              type: "text",
              text: userTextPrompt
                ? `User provided text input: "${userTextPrompt}" (in Manglish/English). Analyze this uploaded photo and user text, then strictly return the JSON object with funnyDescription and salimKumarComment.`
                : "Analyze this uploaded photo and strictly return the JSON object with funnyDescription and salimKumarComment.",
            },
            { type: "image_url", image_url: { url: image } },
          ];

          const ollamaRes = await fetch(localOllamaEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              model: localVisionModel,
              temperature: 0.7,
              response_format: { type: "json_object" },
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userContent },
              ],
            }),
          });
          clearTimeout(timeoutId);

          if (ollamaRes.ok) {
            const data = (await ollamaRes.json()) as {
              choices?: Array<{ message?: { content?: string } }>;
            };
            const contentStr = data.choices?.[0]?.message?.content?.trim();
            if (contentStr) {
              try {
                const parsed = JSON.parse(contentStr) as MemeResponse;
                if (parsed.funnyDescription && parsed.salimKumarComment) {
                  const safeMeme = normalizeMeme(parsed, userTextPrompt);
                  return new Response(JSON.stringify(safeMeme), {
                    headers: { "Content-Type": "application/json" },
                  });
                }
              } catch {
                // fallback
              }
            }
          }
        } catch {
          // fall through to local meme fallback
        }

        // 4. FINAL FALLBACK: Smart Local Meme Fallback
        return new Response(JSON.stringify(getLocalMeme(userTextPrompt)), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
