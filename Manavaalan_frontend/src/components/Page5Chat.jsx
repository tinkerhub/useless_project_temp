import React, { useEffect, useRef, useState } from "react";
import {
  Mic,
  Send,
  Square,
  Loader2,
  Image as ImageIcon,
  Download,
  BadgeCheck,
  Sparkles,
  X,
  MessageSquareQuote,
  Camera,
  RotateCcw,
} from "lucide-react";
import { toPng } from "html-to-image";
import manavalanPoster from "../assets/manavalan.jpg";
import melcowBg from "../assets/melcow-bg.jpg";
import { startRecording } from "../lib/recorder";

const GREETING = {
  role: "assistant",
  content:
    "Sakrutha kruthavaaya naattukaare, kalaaparipadikal thudangaan aarambikkenotta... pooy! Njan Dufayil aana valarthiya aalaada... Njangal Manavalan & Sons ethrai ethrai prapanchangalil branch thudangiyittund ennariyamo? Ningalude ee chiriyaanu ente vijayam! Chodhyangal chodikkam, photo upload cheythal meme aaki tharam. By the by, paisa chodikkanaanenkil risk edukkanda, main branch-il lock aane!",
};

const QUICK_PROMPTS = [
  { label: "Ente peru Nivin", text: "Ente peru Nivin" },
  { label: "5000 roopa tharuo?", text: "Manavala, oru 5000 roopa kadam tharuo?" },
  { label: "English speech parayu", text: "Can you speak in English with me?" },
  { label: "Dharmendra vannu!", text: "Dharmendra ividunnu ninte peru chodichu vannu!" },
  {
    label: "Sign idan mudrapathram",
    text: "Namukku oru agreement sign cheyyanam, mudrapathram veno?",
  },
  { label: "Dubai vazhi etha?", text: "Dubai-ilottu engane pokam? Vazhi parayuo?" },
  { label: "Ottakathe kando?", text: "Ottakathe patti enthanu abhiprayam?" },
  { label: "Vandi kazhukiyappol", text: "Vandi kazhukumbozhanu accident pattiyathu!" },
];

export function Page5Chat({ language = 'MALAYALAM', userName = 'Friend', initialGreeting, onRestartOnboarding }) {
  const [messages, setMessages] = useState(() => {
    const rawGreeting = initialGreeting ||
      `Sakrutha kruthavaaya ${userName}, kalaaparipadikal thudangaan aarambikkenotta... pooy! Njan Dufayil aana valarthiya aalaada... Njangal Manavalan & Sons ethrai ethrai prapanchangalil branch thudangiyittund ennariyamo? Ningalude ee chiriyaanu ente vijayam!`;
    const formattedGreeting = rawGreeting.includes("Parayu, ini enthaanukaaryam?")
      ? rawGreeting
      : `${rawGreeting}\n\nParayu, ini enthaanukaaryam? Mindaathirikkadhe enthenkilum chodikkeda!`;
    return [{ role: "assistant", content: formattedGreeting }];
  });
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [downloadingIdx, setDownloadingIdx] = useState(null);
  const [recording, setRecording] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const cardRefs = useRef({});
  const recorderRef = useRef(null);
  const endRef = useRef(null);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError("Image size should be less than 8MB.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSelectedImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function openCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      setCameraActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setError("Athu kaanumbozhe enikku ariyamaayirunnu, ithu pottum ennu! (Camera access denied)");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setSelectedImage(dataUrl);
    closeCamera();
  }

  function closeCamera() {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setCameraActive(false);
  }

  async function downloadMemeCard(idx) {
    const node = cardRefs.current[idx];
    if (!node) return;
    try {
      setDownloadingIdx(idx);
      const dataUrl = await toPng(node, { cacheBust: true, quality: 0.95 });
      const link = document.createElement("a");
      link.download = `manavalan_meme_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download meme image.");
    } finally {
      setDownloadingIdx(null);
    }
  }

  async function send(text) {
    const trimmed = text.trim();
    const hasImage = Boolean(selectedImage);
    if (!trimmed && !hasImage) return;
    if (thinking) return;

    setError(null);
    const activeImage = selectedImage;
    setSelectedImage(null);

    const userMsg = {
      role: "user",
      content: trimmed || (hasImage ? "Analyzed uploaded image" : ""),
      image: activeImage ?? undefined,
    };

    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setThinking(true);

    try {
      if (hasImage && activeImage) {
        const res = await fetch("/api/manavalan-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: activeImage,
            text: trimmed,
          }),
        });
        if (!res.ok) throw new Error(await res.text().catch(() => "Meme generation failed"));
        const data = await res.json();

        const assistantMsg = {
          role: "assistant",
          content: data.salimKumarComment,
          image: activeImage,
          funnyDescription: data.funnyDescription,
          salimKumarComment: data.salimKumarComment,
          isMeme: true,
        };

        setMessages((m) => [...m, assistantMsg]);
      } else {
        const res = await fetch("/api/manavalan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: next,
            userName,
            language,
          }),
        });
        if (!res.ok) throw new Error(await res.text().catch(() => "chat failed"));
        const data = await res.json();
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.reply, provider: data.provider },
        ]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Thanne kond njan thottallo... I ALL SO FAILED OF YOU!");
    } finally {
      setThinking(false);
    }
  }

  async function toggleMic() {
    if (recording) {
      setRecording(false);
      const rec = recorderRef.current;
      recorderRef.current = null;
      if (!rec) return;
      const blob = await rec.stop();
      if (blob.size < 4096) {
        setError("Parayu, ini enthaanukaaryam? Mindaathirikkadhe enthenkilum chodikkeda! (Recording too short)");
        return;
      }
      setThinking(true);
      try {
        const form = new FormData();
        form.append("file", blob, "recording.wav");
        const res = await fetch("/api/manavalan-listen", { method: "POST", body: form });
        if (!res.ok) throw new Error(await res.text().catch(() => "transcription failed"));
        const data = await res.json();
        setThinking(false);
        if (data.text?.trim()) await send(data.text);
        else setError("Thante manassil enthaano ulla kaaryam, athu spashthamaayi parayu! (Nothing heard)");
      } catch (e) {
        setThinking(false);
        setError(e instanceof Error ? e.message : "Plannu ellam super aayirunnu... Pakshe timing thottu poyi! (Audio error)");
      }
      return;
    }
    try {
      setError(null);
      recorderRef.current = await startRecording();
      setRecording(true);
    } catch {
      setError("Athu kaanumbozhe enikku ariyamaayirunnu, ithu pottum ennu! (Mic access denied)");
    }
  }

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-fixed manavalan-page text-foreground font-sans antialiased"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(18, 8, 8, 0.78), rgba(12, 5, 5, 0.86)), url(${melcowBg})`,
      }}
    >
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 pb-6 manavalan-shell">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 py-4 manavalan-header">
          <div className="flex items-center gap-3.5">
            <img
              src={manavalanPoster}
              alt="Illustrated poster of Manavalan, a comic Malayali businessman"
              width={1024}
              height={1024}
              className="size-14 rounded-full border-2 border-primary object-cover shadow-sm manavalan-logo"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-primary manavalan-title">
                  മണവാളൻ & കമ്പനി
                </h1>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary vibe-badge border border-primary/30">
                  Manglish AI & Meme
                </span>
              </div>
              <p className="text-xs text-muted-foreground tagline">
                Dubai Managing Director • Text, Voice or Meme Upload!
              </p>
            </div>
          </div>

          {onRestartOnboarding && (
            <button
              onClick={onRestartOnboarding}
              title="Reset Onboarding / Change User"
              className="px-3.5 py-1.5 rounded-full bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <RotateCcw className="size-3.5" /> Reset Intro Flow
            </button>
          )}
        </header>

        <section className="flex-1 space-y-5 overflow-y-auto py-5 manavalan-chat-stream">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "flex justify-end chat-row user-row"
                  : "flex justify-start chat-row bot-row"
              }
            >
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] space-y-2 rounded-2xl rounded-br-sm bg-accent px-4 py-3 text-accent-foreground manavalan-message-bubble user-bubble"
                    : "max-w-[90%] space-y-3 rounded-2xl rounded-bl-sm border border-border bg-card p-4 text-card-foreground shadow-xs sm:max-w-[85%] manavalan-message-bubble bot-bubble"
                }
              >
                {/* User Image Attachment */}
                {m.role === "user" && m.image && (
                  <div className="overflow-hidden rounded-xl border border-border/50">
                    <img
                      src={m.image}
                      alt="Uploaded by user"
                      className="max-h-60 w-full object-cover"
                    />
                  </div>
                )}

                {/* Normal Text Content */}
                {!m.isMeme && (
                  <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                    {m.content}
                  </p>
                )}

                {/* Assistant Meme Output Card */}
                {m.isMeme && m.image && (
                  <div className="space-y-4">
                    {/* Capture container for html-to-image meme downloading */}
                    <div
                      ref={(el) => {
                        cardRefs.current[i] = el;
                      }}
                      className="overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-md transition-all"
                    >
                      {/* Uploaded Photo */}
                      <div className="relative overflow-hidden rounded-xl border border-border/40 bg-black/5">
                        <img
                          src={m.image}
                          alt="Meme source photo"
                          className="max-h-80 w-full object-contain"
                        />
                      </div>

                      {/* Roast Caption Block */}
                      {m.funnyDescription && (
                        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-foreground sm:text-sm">
                          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                          <p className="italic">"{m.funnyDescription}"</p>
                        </div>
                      )}

                      {/* Social Media Comment Card */}
                      {m.salimKumarComment && (
                        <div className="mt-3.5 rounded-xl border border-border/80 bg-background/90 p-3.5 shadow-xs">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={manavalanPoster}
                              alt="Manavalan avatar"
                              className="size-9 rounded-full border border-primary/30 object-cover"
                            />
                            <div className="flex-1 leading-tight">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-foreground text-sm">Manavalan</span>
                                <BadgeCheck className="size-4 text-[#1D9BF0] fill-[#1D9BF0]/10" />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                @Manavalan_Official
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">Just now</span>
                          </div>
                          <p className="mt-2.5 text-sm font-semibold leading-normal text-foreground">
                            {m.salimKumarComment}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action buttons bar */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => downloadMemeCard(i)}
                        disabled={downloadingIdx === i}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition-all hover:bg-muted disabled:opacity-50"
                      >
                        {downloadingIdx === i ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Download className="size-3.5" />
                        )}
                        Download Meme
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {thinking && (
            <div className="flex items-center gap-2 text-sm italic text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>മണവാളൻ ആലോചിക്കുന്നു… (Choodu koodunnu, thalakkakathu motor odunnu...)</span>
            </div>
          )}
          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          <div ref={endRef} />
        </section>

        {/* Quick Manglish dialogue prompt suggestions */}
        <div className="mb-2">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mb-1.5 px-1">
            <MessageSquareQuote className="size-3 text-primary" />
            <span>Classic Manglish Prompts:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => void send(qp.text)}
                disabled={thinking}
                className="rounded-full border border-border bg-card/80 px-2.5 py-1 text-xs text-foreground/80 transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary active:scale-95 disabled:opacity-50"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Image Preview before sending */}
        {selectedImage && (
          <div className="relative mb-2 inline-block max-w-xs overflow-hidden rounded-xl border border-primary bg-card p-1 shadow-md">
            <img
              src={selectedImage}
              alt="Selected preview"
              className="h-24 w-full rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 rounded-full bg-background/90 p-1 text-foreground shadow-sm hover:bg-background"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Camera Capture Overlay */}
        {cameraActive && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4">
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border-2 border-primary bg-black shadow-2xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-2xl"
              />
              <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-4 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10">
                <button
                  type="button"
                  onClick={closeCamera}
                  className="inline-flex size-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                  aria-label="Cancel camera"
                >
                  <X className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="inline-flex size-16 items-center justify-center rounded-full border-4 border-white bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
                  aria-label="Capture photo"
                >
                  <Camera className="size-7" />
                </button>
                <div className="size-12" />
              </div>
            </div>
            <p className="mt-3 text-center text-sm text-white/70">
              📸 Manavalan & Sons — Photo Capturing Division
            </p>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-background py-3 manavalan-composer"
        >
          {/* File Input for Image Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload image"
            title="Upload photo from gallery"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-muted"
          >
            <ImageIcon className="size-5 text-primary" />
          </button>

          <button
            type="button"
            onClick={() => void openCamera()}
            aria-label="Take photo with camera"
            title="Take photo with camera"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-muted"
          >
            <Camera className="size-5 text-primary" />
          </button>

          <button
            type="button"
            onClick={() => void toggleMic()}
            aria-label={recording ? "Stop recording" : "Record voice"}
            className={
              recording
                ? "inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                : "inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-muted"
            }
          >
            {recording ? <Square className="size-4" /> : <Mic className="size-5" />}
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selectedImage
                ? "Ee photo-ye patti enthanu abhiprayam?..."
                : "Parayu, ini enthaanukaaryam? (Manavala, oru 500 roopa tharuo?)"
            }
            className="h-11 flex-1 rounded-full border border-border bg-input px-4 text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />

          <button
            type="submit"
            disabled={thinking || (!input.trim() && !selectedImage)}
            aria-label="Send message"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Send className="size-5" />
          </button>
        </form>
      </div>
    </main>
  );
}

export default Page5Chat;
