import AppBase from "../base/appBase.js";
import "./musicPlayer.css";

class MusicPlayerApp extends AppBase {
    constructor() {
        super({
            id: "music-player",
            name: "Spotifyn't",
            icon: "🎵"
        });

        this.songs = [
            {
                title: "Blinding Lights",
                artist: "The Weeknd",
                album: "After Hours",
                emoji: "🌃"
            },
            {
                title: "Starboy",
                artist: "The Weeknd",
                album: "Starboy",
                emoji: "⭐"
            },
            {
                title: "Heat Waves",
                artist: "Glass Animals",
                album: "Dreamland",
                emoji: "🌊"
            },
            {
                title: "As It Was",
                artist: "Harry Styles",
                album: "Harry's House",
                emoji: "🏠"
            },
            {
                title: "Believer",
                artist: "Imagine Dragons",
                album: "Evolve",
                emoji: "🔥"
            }
        ];

        this.currentSong = 0;
        this.isPlaying = false;
        this.progress = 0;
        this.volume = 70;
        this.liked = false;
        this.shuffle = false;

        this.progressTimer = null;
        this.eventsInitialized = false;
    }

    render() {
        const song = this.songs[this.currentSong];

        return `
            <div class="rage-music-player">

                <div class="music-header">
                    <div class="music-logo">
                        <span class="music-logo-icon">🎵</span>
                        <div>
                            <h2>Spotifyn't</h2>
                            <p>Music that almost works.</p>
                        </div>
                    </div>

                    <div class="music-search">
                        <input
                            type="text"
                            class="music-search-input"
                            placeholder="Search songs..."
                        />
                        <button class="music-search-button">
                            🔍
                        </button>
                    </div>
                </div>

                <div class="music-body">

                    <!-- Playlist -->
                    <div class="music-playlist">

                        <div class="playlist-header">
                            <h3>Your Playlist</h3>
                            <button class="shuffle-button">
                                🔀
                            </button>
                        </div>

                        <div class="playlist-items">
                            ${this.renderPlaylist()}
                        </div>

                    </div>

                    <!-- Player -->
                    <div class="music-player-main">

                        <div class="album-art">
                            <span>${song.emoji}</span>
                        </div>

                        <div class="song-info">
                            <h1 class="current-song-title">
                                ${song.title}
                            </h1>

                            <p class="current-song-artist">
                                ${song.artist}
                            </p>

                            <p class="current-song-album">
                                ${song.album}
                            </p>
                        </div>

                        <button class="like-button">
                            ${this.liked ? "❤️" : "♡"}
                        </button>

                        <div class="progress-section">

                            <div class="progress-bar-container">
                                <input
                                    type="range"
                                    class="music-progress"
                                    min="0"
                                    max="100"
                                    value="${this.progress}"
                                />
                            </div>

                            <div class="time-display">
                                <span class="current-time">
                                    ${this.formatTime(this.progress)}
                                </span>

                                <span>
                                    3:30
                                </span>
                            </div>

                        </div>

                        <div class="player-controls">

                            <button class="previous-button">
                                ⏮
                            </button>

                            <button class="play-button">
                                ${this.isPlaying ? "⏸" : "▶"}
                            </button>

                            <button class="next-button">
                                ⏭
                            </button>

                        </div>

                        <div class="volume-section">

                            <span>🔊</span>

                            <input
                                type="range"
                                class="music-volume"
                                min="0"
                                max="100"
                                value="${this.volume}"
                            />

                            <span class="volume-value">
                                ${this.volume}%
                            </span>

                        </div>

                        <div class="player-status">
                            ${this.isPlaying
                                ? "▶ Now playing"
                                : "⏸ Paused"}
                        </div>

                    </div>

                </div>

                <div class="music-rage-toast"></div>

            </div>
        `;
    }

    renderPlaylist() {
        return this.songs.map((song, index) => `
            <div
                class="playlist-item ${index === this.currentSong ? "active" : ""}"
                data-song-index="${index}"
            >

                <div class="playlist-icon">
                    ${song.emoji}
                </div>

                <div class="playlist-song-info">
                    <strong>${song.title}</strong>
                    <span>${song.artist}</span>
                </div>

                <span class="playlist-duration">
                    3:${10 + index * 5}
                </span>

            </div>
        `).join("");
    }

    initializeEvents() {
        if (this.eventsInitialized) {
            return;
        }

        this.eventsInitialized = true;

        document.addEventListener("click", (event) => {

            const player = event.target.closest(".rage-music-player");

            if (!player) {
                return;
            }

            /* PLAY / PAUSE */

            if (event.target.closest(".play-button")) {
                this.handlePlayPause();
            }

            /* PREVIOUS */

            if (event.target.closest(".previous-button")) {
                this.previousSong();
            }

            /* NEXT */

            if (event.target.closest(".next-button")) {
                this.nextSong();
            }

            /* LIKE */

            if (event.target.closest(".like-button")) {
                this.toggleLike();
            }

            /* SHUFFLE */

            if (event.target.closest(".shuffle-button")) {
                this.toggleShuffle();
            }

            /* PLAYLIST */

            const playlistItem =
                event.target.closest(".playlist-item");

            if (playlistItem) {
                const index =
                    Number(playlistItem.dataset.songIndex);

                this.selectSong(index);
            }

            /* SEARCH */

            if (event.target.closest(".music-search-button")) {
                this.performSearch(player);
            }
        });

        document.addEventListener("input", (event) => {

            const player =
                event.target.closest(".rage-music-player");

            if (!player) {
                return;
            }

            if (event.target.classList.contains("music-progress")) {

                this.progress =
                    Number(event.target.value);

                this.updatePlayer(player);
            }

            if (event.target.classList.contains("music-volume")) {

                this.volume =
                    Number(event.target.value);

                this.updatePlayer(player);
            }
        });

        document.addEventListener("keydown", (event) => {

            const player =
                event.target.closest(".rage-music-player");

            if (!player) {
                return;
            }

            if (
                event.key === "Enter" &&
                event.target.classList.contains("music-search-input")
            ) {
                this.performSearch(player);
            }
        });
    }

    handlePlayPause() {

        /*
         * RAGEBAIT #1
         * Play button sometimes betrays the user.
         */

        if (Math.random() < 0.20) {

            this.showRageMessage(
                "😈 Play button decided to do nothing."
            );

            return;
        }

        this.isPlaying = !this.isPlaying;

        if (this.isPlaying) {
            this.startProgress();
        } else {
            this.stopProgress();
        }

        this.refresh();
    }

    nextSong() {

        /*
         * RAGEBAIT #2
         * Next button sometimes goes backwards.
         */

        if (Math.random() < 0.25) {

            this.currentSong--;

            if (this.currentSong < 0) {
                this.currentSong =
                    this.songs.length - 1;
            }

            this.showRageMessage(
                "😈 Next? Nah. Here's the previous song."
            );

        } else {

            this.currentSong++;

            if (this.currentSong >= this.songs.length) {
                this.currentSong = 0;
            }
        }

        this.progress = 0;
        this.refresh();
    }

    previousSong() {

        this.currentSong--;

        if (this.currentSong < 0) {
            this.currentSong =
                this.songs.length - 1;
        }

        this.progress = 0;

        this.refresh();
    }

    selectSong(index) {

        /*
         * RAGEBAIT #3
         * Clicking a song can play the wrong song.
         */

        if (Math.random() < 0.25) {

            let wrongIndex =
                Math.floor(
                    Math.random() * this.songs.length
                );

            if (wrongIndex === index) {
                wrongIndex =
                    (wrongIndex + 1) %
                    this.songs.length;
            }

            this.currentSong = wrongIndex;

            this.showRageMessage(
                "😈 You clicked one song. We chose another."
            );

        } else {

            this.currentSong = index;
        }

        this.progress = 0;
        this.isPlaying = true;

        this.startProgress();
        this.refresh();
    }

    toggleLike() {

        /*
         * RAGEBAIT #4
         * Like button sometimes does the opposite.
         */

        if (Math.random() < 0.20) {

            this.liked = !this.liked;

            this.showRageMessage(
                "💔 Like button malfunction."
            );

        } else {

            this.liked = !this.liked;
        }

        this.refresh();
    }

    toggleShuffle() {

        this.shuffle = !this.shuffle;

        this.showRageMessage(
            this.shuffle
                ? "🔀 Shuffle enabled."
                : "➡️ Shuffle disabled."
        );
    }

    performSearch(player) {

        const input =
            player.querySelector(".music-search-input");

        const query =
            input.value.trim();

        if (!query) {
            return;
        }

        /*
         * RAGEBAIT #5
         * Search sometimes returns nonsense.
         */

        if (Math.random() < 0.30) {

            this.showRageMessage(
                `😈 Search result for "${query}": absolutely nothing.`
            );

            return;
        }

        const foundIndex =
            this.songs.findIndex(song =>
                song.title
                    .toLowerCase()
                    .includes(query.toLowerCase())
            );

        if (foundIndex !== -1) {

            this.currentSong = foundIndex;
            this.progress = 0;

            this.refresh();

        } else {

            this.showRageMessage(
                `🔍 No results for "${query}".`
            );
        }
    }

    startProgress() {

        this.stopProgress();

        this.progressTimer =
            setInterval(() => {

                if (!this.isPlaying) {
                    return;
                }

                /*
                 * RAGEBAIT #6
                 * Progress occasionally jumps backwards.
                 */

                if (Math.random() < 0.04) {

                    this.progress =
                        Math.max(
                            0,
                            this.progress - 15
                        );

                    this.showRageMessage(
                        "😈 Playback went backwards."
                    );

                } else {

                    this.progress += 0.5;
                }

                if (this.progress >= 100) {

                    this.progress = 0;

                    this.currentSong++;

                    if (
                        this.currentSong >=
                        this.songs.length
                    ) {
                        this.currentSong = 0;
                    }
                }

                this.refresh();

            }, 1000);
    }

    stopProgress() {

        if (this.progressTimer) {

            clearInterval(this.progressTimer);

            this.progressTimer = null;
        }
    }

    updatePlayer(player) {

        const time =
            player.querySelector(".current-time");

        const volume =
            player.querySelector(".volume-value");

        if (time) {
            time.textContent =
                this.formatTime(this.progress);
        }

        if (volume) {
            volume.textContent =
                `${this.volume}%`;
        }
    }

    formatTime(progress) {

        const totalSeconds =
            Math.floor(
                (progress / 100) * 210
            );

        const minutes =
            Math.floor(totalSeconds / 60);

        const seconds =
            totalSeconds % 60;

        return `${minutes}:${seconds
            .toString()
            .padStart(2, "0")}`;
    }

    refresh() {

        const player =
            document.querySelector(
                ".rage-music-player"
            );

        if (!player) {
            return;
        }

        player.outerHTML = this.render();
    }

    showRageMessage(message) {

        const toast =
            document.querySelector(
                ".music-rage-toast"
            );

        if (!toast) {
            return;
        }

        toast.textContent = message;
        toast.classList.add("show");

        setTimeout(() => {

            toast.classList.remove("show");

        }, 2500);
    }
}

const musicPlayerApp =
    new MusicPlayerApp();

musicPlayerApp.initializeEvents();

export default musicPlayerApp;