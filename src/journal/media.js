/**
 * media.js — Centralized media manifest for the Project Journal.
 *
 * HOW TO USE:
 * 1. Drop your actual media files into public/journal/{videos,images,screenshots,memes}/
 * 2. Update the paths below to match your filenames.
 * 3. Every component in the journal reads from this manifest — no scattered paths.
 *
 * Placeholder paths point to files that may not exist yet.
 * The journal gracefully handles missing media (shows a labeled placeholder box).
 */

export const MEDIA = {
  videos: {
    COLGATE:       '/journal/videos/colgate.mp4',
    MURSHUU:       '/journal/videos/murshuu.mp4',
    CODING_NIGHT:  '/journal/videos/coding-night.mp4',
    ARRIVAL:       '/journal/videos/arrival.mp4',
    FINAL_DEMO:    '/journal/videos/final-demo.mp4',
    EVENT_GENERAL: '/journal/videos/event-general.mp4',
  },

  images: {
    VENUE:          '/journal/images/venue.jpg',
    BRAINSTORMING:  '/journal/images/brainstorming.jpg',
    LATE_NIGHT:     '/journal/images/late-night.jpg',
    MORNING:        '/journal/images/morning.jpg',
    TEAM:           '/journal/images/team.jpg',
  },

  screenshots: {
    SCANNER:         '/journal/screenshots/scanner.png',
    PASSPORT:        '/journal/screenshots/passport.png',
    IMMIGRATION:     '/journal/screenshots/immigration.png',
    DEATH:           '/journal/screenshots/death.png',
    BUG_01:          '/journal/screenshots/bug-01.png',
    WRONG_DETECTION: '/journal/screenshots/wrong-detection.png',
    WORLD:           '/journal/screenshots/world.png',
  },

  memes: {
    ZERO_IDEAS:    '/journal/memes/zero-ideas.jpg',
    SCOPE_CREEP:   '/journal/memes/scope-creep.jpg',
    AI_WRONG:      '/journal/memes/ai-wrong.jpg',
    DEBUGGING:     '/journal/memes/debugging.jpg',
  },

  audio: {
    DEATH_SOUND:   '/sounds/v.mp3',
    INTRO:         '/sounds/chath.mp3',
    ENIK_DIALOGUE: '/journal/audio/enik.mp3',
  },
};

/**
 * Timeline data — editable timestamps.
 * Update these to match your actual makeathon schedule.
 */
export const TIMELINE = [
  { time: '2:00 PM',  remaining: '18:00', status: 'NO IDEA',                emoji: '😶' },
  { time: '3:00 PM',  remaining: '17:00', status: 'PASSPORT IDEA',          emoji: '💡' },
  { time: '5:00 PM',  remaining: '15:00', status: 'WAIT... WHAT IF LIVES?', emoji: '🤯' },
  { time: '8:00 PM',  remaining: '12:00', status: 'BUILDING SOMETHING',     emoji: '🔨' },
  { time: '10:00 PM', remaining: '10:00', status: 'WHY DID I DO THIS',      emoji: '😰' },
  { time: '12:00 AM', remaining: '08:00', status: 'IMMIGRATION WORKS',      emoji: '🛂' },
  { time: '2:00 AM',  remaining: '04:00', status: 'MURSHUU',                emoji: '😂' },
  { time: '4:00 AM',  remaining: '02:00', status: 'BUGS',                   emoji: '🪲' },
  { time: '6:00 AM',  remaining: '00:30', status: 'FINAL PUSH',             emoji: '💀' },
  { time: '8:00 AM',  remaining: '00:00', status: 'SUBMITTED',              emoji: '✅' },
];
