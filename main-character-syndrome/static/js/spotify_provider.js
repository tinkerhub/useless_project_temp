const SPOTIFY_MOOD_QUERIES = {
  mass_entry: [
    "Indian mass entry BGM",
    "Malayalam action cinematic",
    "Tamil mass hero theme",
    "epic Indian cinematic instrumental",
  ],
  hero_entry: ["hero entry cinematic", "Indian action BGM", "Malayalam mass soundtrack"],
  epic: ["epic cinematic orchestral", "Indian epic instrumental soundtrack"],
  action: ["high energy action soundtrack", "Indian action BGM", "fast cinematic instrumental"],
  cartoon_chase: ["funny chase cartoon music", "comedy chase soundtrack", "fast funny instrumental"],
  comic_chase: ["comedy chase Indian soundtrack", "funny running music"],
  comedy: ["Indian comedy background music", "funny movie soundtrack"],
  indian_comedy: ["Malayalam comedy soundtrack", "Indian funny background score", "Bollywood comedy instrumental"],
  dreamy: ["dreamy mellow instrumental", "peaceful Indian soundtrack", "soft cinematic ambient"],
  emotional: ["emotional Indian instrumental", "melancholic movie soundtrack", "soft violin cinematic"],
  emotional_violin: ["emotional violin soundtrack", "Indian sad instrumental"],
  peaceful: ["peaceful cinematic instrumental", "calm Indian ambient music"],
  mystery: ["mystery thriller soundtrack", "Indian suspense background music"],
  suspense: ["suspense cinematic soundtrack", "thriller background score"],
  indian_suspense: ["Malayalam thriller BGM", "Indian mystery soundtrack"],
  horror: ["horror cinematic soundtrack", "creepy thriller instrumental"],
  royal: ["royal entry cinematic", "king coronation soundtrack", "Indian royal instrumental"],
  victory: ["victory cinematic soundtrack", "triumph Indian instrumental"],
  chaos: ["chaotic funny soundtrack", "crazy fast cinematic music"],
  comedy_thinking: ["funny thinking background music", "confused comedy soundtrack"],
  comedy_confusion: ["confused funny soundtrack", "comedy reaction music"],
  awkward_comedy: ["awkward silence funny soundtrack", "comedy awkward music"],
  sneaky_comedy: ["sneaky funny music", "comedy stealth soundtrack"],
  dramatic_reveal: ["dramatic reveal cinematic", "shocking plot twist soundtrack"],
};

const DEMO_SEARCH_LIBRARY = {
  mass_entry: "Mersal BGM A.R. Rahman",
  hero_entry: "Aavesham Illuminati",
  comedy_chase: "Tom and Jerry Chase Theme",
  cartoon_chase: "Tom and Jerry Chase Theme",
  royal: "Baahubali Theme",
  dreamy: "Malare Premam instrumental",
  dramatic_reveal: "Drishyam theme",
  chaos: "Aavesham chaotic BGM",
  victory: "Chak De India Theme",
  emotional: "96 Ram instrumental",
  mystery: "Drishyam BGM",
  suspense: "Drishyam BGM",
  horror: "Conjuring Theme",
  comedy_thinking: "CID Theme slow comedic",
  awkward_comedy: "Curb Your Enthusiasm Theme",
  sneaky_comedy: "Pink Panther Theme",
  peaceful: "Yeh Haseen Wadiyan instrumental",
};

function getDemoSearchQuery(category, universe) {
  const selected = DEMO_SEARCH_LIBRARY[category] || DEMO_SEARCH_LIBRARY.mass_entry;
  return selected;
}

const DEMO_SPOTIFY_TRACKS = {
  mass_entry: "spotify:track:2726Pd2GWM9mz65fTOMfPQ",
  comedy_chase: "spotify:track:5sFKd7dVlGoOuXl2usSZuW",
  royal: "spotify:track:25yHVLeSVMYwhHgiaZHVvK",
  dreamy: "spotify:track:45UyTTSvdUdvCU1cfkc7sO",
  dramatic_reveal: "spotify:track:31NsSyQ8vIGUGG0FEraGP4",
  chaos: "spotify:track:4oWyW7U9YVox9jqTar9k0V",
  victory: "spotify:track:6D3vmtskO4RbZP3bBIDY3X",
  hero_entry: "spotify:track:1kFNFsAZ4iZy4vjBEtT12I",
};

function buildSpotifyQuery(category, universe) {
  const categoryQueries = SPOTIFY_MOOD_QUERIES[category] || ["cinematic instrumental", "epic soundtrack"];
  const universeKeywords = {
    "Indian Cinema": ["Indian", "Malayalam", "Tamil", "epic"],
    "Indian Comedy": ["funny Indian", "comedy", "Bollywood", "Malayalam comedy"],
    "College / Campus": ["college funny", "campus chaos", "Bollywood college"],
    "Default Cinematic": ["cinematic", "orchestral"],
    "Anime Protagonist": ["anime epic", "battle soundtrack"],
    "Horror Thriller": ["horror thriller", "creepy"],
    "Meme Mode": ["viral funny", "meme soundtrack"],
  };

  const extras = universeKeywords[universe] || ["cinematic"];
  const pool = [];
  categoryQueries.forEach((query) => {
    extras.forEach((extra) => pool.push(`${query} ${extra}`));
  });

  return pool[Math.floor(Math.random() * pool.length)] || categoryQueries[0];
}

class SpotifyProvider {
  constructor() {
    this.player = null;
    this.deviceId = null;
    this.isReady = false;
    this.currentTrack = null;
    this.currentUri = null;
    this.recentlyPlayedTracks = [];
    this.volume = 0.7;
    this.readyPromise = null;
    this.initStarted = false;
  }

  async initialize() {
    if (this.player) {
      return true;
    }

    if (!window.Spotify) {
      console.log("[SPOTIFY PLAYER] Waiting for Spotify SDK to load...");
      return false;
    }

    if (this.initStarted) {
      return false;
    }

    this.initStarted = true;
    console.log("[SPOTIFY PLAYER] SDK loaded");
    this.player = new window.Spotify.Player({
      name: "Main Character Syndrome AI Player",
      getOAuthToken: async (callback) => {
        try {
          const response = await fetch("/api/spotify/token");
          const data = await response.json();
          if (data && data.success && data.access_token) {
            callback(data.access_token);
            return;
          }
          console.log("[SPOTIFY ERROR] Authentication failed");
          callback("");
        } catch (error) {
          console.log("[SPOTIFY ERROR] Token fetch failed", error);
          callback("");
        }
      },
      volume: this.volume,
    });

    this.player.addListener("ready", ({ device_id }) => {
      this.deviceId = device_id;
      this.isReady = true;
      console.log("[SPOTIFY] Player Ready");
      console.log("[SPOTIFY] Device ID:", device_id);
      this.transferPlayback(device_id);
    });

    this.player.addListener("not_ready", ({ device_id }) => {
      console.log("[SPOTIFY] Device is not ready:", device_id);
      this.isReady = false;
    });

    this.player.addListener("initialization_error", ({ message }) => {
      console.log("[SPOTIFY ERROR] Initialization failed:", message);
      this.isReady = false;
    });

    this.player.addListener("authentication_error", ({ message }) => {
      console.log("[SPOTIFY ERROR] Authentication failed:", message);
      this.isReady = false;
    });

    this.player.addListener("account_error", ({ message }) => {
      console.log("[SPOTIFY ERROR] Account error:", message);
      this.isReady = false;
    });

    this.player.addListener("playback_error", ({ message }) => {
      console.log("[SPOTIFY ERROR] Playback failed:", message);
    });

    this.player.addListener("player_state_changed", (state) => {
      if (!state) return;
      const track = state.track_window && state.track_window.current_track;
      if (track) {
        this.currentTrack = track;
        this.currentUri = track.uri;
        console.log("[SPOTIFY RESULT] Selected:", `${track.name} - ${track.artists.map((artist) => artist.name).join(", ")}`);
        const event = new CustomEvent("spotify:track-changed", { detail: track });
        window.dispatchEvent(event);
      }
    });

    try {
      this.player.connect();
    } catch (error) {
      console.log("[SPOTIFY ERROR] Connect call failed:", error);
      this.initStarted = false;
      return false;
    }

    return true;
  }

  async connect() {
    return this.initialize();
  }

  disconnect() {
    if (this.player) {
      this.player.disconnect();
      this.deviceId = null;
      this.isReady = false;
    }
  }

  getDeviceId() {
    return this.deviceId;
  }

  async transferPlayback(deviceId) {
    if (!deviceId) return null;
    try {
      const response = await fetch("/api/spotify/device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: deviceId }),
      });
      const data = await response.json();
      if (data && data.success) {
        console.log("[SPOTIFY PLAYER] Device ready:", deviceId);
      }
      return data;
    } catch (error) {
      console.log("[SPOTIFY ERROR] Device transfer failed:", error);
      return null;
    }
  }

  async getStatus() {
    try {
      const response = await fetch("/api/spotify/status");
      return await response.json();
    } catch (error) {
      return { authenticated: false, device_id: null, player_ready: false };
    }
  }

  async searchAndPlay(category, universe, metadata = {}) {
    const demoUri = metadata.forceTrackUri || DEMO_SPOTIFY_TRACKS[category];
    if (demoUri && metadata.demoMode) {
      console.log("[SPOTIFY DEMO] Force playing configured Spotify URI for:", category);
      return this.playTrack(demoUri);
    }

    if (!this.isReady || !this.deviceId) {
      await this.initialize();
    }

    try {
      const response = await fetch("/api/spotify/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: category || "mass_entry",
          universe: universe || "Indian Cinema",
          metadata,
        }),
      });
      const data = await response.json();
      if (!data || !data.success || !data.track) {
        console.log("[SPOTIFY ERROR] Search returned no track for category:", category);
        return { success: false, error: data?.error || "No Spotify result found" };
      }

      const track = data.track;
      console.log("[SPOTIFY SEARCH] Query:", buildSpotifyQuery(category, universe));
      console.log("[SPOTIFY RESULT] Selected:", `${track.name} - ${track.artist}`);

      this.currentTrack = track;
      this.currentUri = track.uri;

      const playResult = await this.playTrack(track.uri);
      if (!playResult || !playResult.success) {
        return playResult;
      }

      return { success: true, track };
    } catch (error) {
      console.log("[SPOTIFY ERROR] Search and play failed:", error);
      return { success: false, error: String(error) };
    }
  }

  async playTrack(uri) {
    if (!uri) {
      return { success: false, error: "Spotify track URI missing" };
    }

    if (!this.deviceId) {
      const status = await this.getStatus();
      this.deviceId = status.device_id || this.deviceId;
    }

    const payload = {
      uri,
      device_id: this.deviceId,
    };

    try {
      const response = await fetch("/api/spotify/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!data || !data.success) {
        console.log("[SPOTIFY ERROR] Playback failed:", data?.error || "Unknown playback error");
        return { success: false, error: data?.error || "Playback failed" };
      }
      console.log("[SPOTIFY PLAYBACK] Playing successfully");
      this.currentUri = uri;
      return { success: true, data };
    } catch (error) {
      console.log("[SPOTIFY ERROR] Playback request failed:", error);
      return { success: false, error: String(error) };
    }
  }

  async pause() {
    try {
      const response = await fetch("/api/spotify/pause", { method: "POST" });
      return response.json();
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async resume() {
    if (!this.currentUri) {
      return { success: false, error: "No track loaded to resume" };
    }
    return this.playTrack(this.currentUri);
  }

  async setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.player && this.player.setVolume) {
      this.player.setVolume(this.volume);
    }
  }

  async skip() {
    try {
      const response = await fetch("/api/spotify/next", { method: "POST" });
      return await response.json();
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
