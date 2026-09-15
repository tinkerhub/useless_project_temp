const db = require('./connection');

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      username   TEXT UNIQUE NOT NULL,
      email      TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      bio        TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      is_premium INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS posts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content    TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS follows (
      follower_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at   TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (follower_id, following_id)
    );

    CREATE TABLE IF NOT EXISTS likes (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, post_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      content    TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type       TEXT NOT NULL,
      actor_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
      post_id    INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      read       INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  console.log('✅ Database migrated successfully.');
  console.log("   (The content is in there. You just can't see it.)");
}

migrate();
