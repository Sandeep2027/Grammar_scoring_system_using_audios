const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/grammar.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    verified INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    subject TEXT,
    question TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    transcript TEXT,
    grammar_score INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

module.exports = db;
