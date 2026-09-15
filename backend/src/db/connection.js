const { DatabaseSync } = require('node:sqlite');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../antisocial.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

module.exports = db;
