const REMOTE_MUSIC_LIBRARY = {
  mass_entry: [],
  hero_entry: [],
  cartoon_chase: [],
  comedy_thinking: [],
  comedy_confusion: [],
  dreamy: [],
  royal: [],
  victory: [],
  horror: [],
  suspense: [],
  mystery: [],
  chaos: [],
  emotional: [],
  peaceful: [],
  action: [],
  dramatic_reveal: [],
};

class RemoteAudioProvider {
  constructor() {
    this.failedUrls = new Map();
    this.currentAudio = null;
  }

  getTracks(category) {
    return REMOTE_MUSIC_LIBRARY[category] || [];
  }

  async play(category, onSuccess, onFallback, onError) {
    const tracks = this.getTracks(category);
    if (!tracks.length) {
      console.log("[AUDIO FALLBACK] No remote URLs configured for category:", category);
      onFallback && onFallback({ category, reason: "no-remote-tracks" });
      return null;
    }

    const tried = new Set();
    for (const track of tracks) {
      const url = track.url;
      if (!url || tried.has(url)) continue;
      tried.add(url);

      const audio = new Audio();
      audio.preload = "auto";
      audio.crossOrigin = "anonymous";

      audio.addEventListener("canplaythrough", () => {
        this.currentAudio = audio;
        console.log("[AUDIO SUCCESS] Remote audio ready:", track.title || url);
        onSuccess && onSuccess({ audio, track, provider: "remote" });
      });

      audio.addEventListener("error", () => {
        this.failedUrls.set(url, (this.failedUrls.get(url) || 0) + 1);
        console.log("[AUDIO ERROR] Remote source failed:", url);
        if (this.failedUrls.get(url) > 2) {
          console.log("[AUDIO FALLBACK] Too many failures; switching to procedural audio.");
          onFallback && onFallback({ category, reason: "remote-failed" });
        }
      });

      audio.src = url;
      audio.load();
      return audio;
    }

    console.log("[AUDIO FALLBACK] All remote URLs for category failed:", category);
    onFallback && onFallback({ category, reason: "all-remote-failed" });
    return null;
  }
}
