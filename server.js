const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Datenbank (wird automatisch als Datei gespeichert)
const db = new sqlite3.Database('./data.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS desks (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, x REAL, y REAL, w REAL, h REAL, mode TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, deskId INTEGER, date TEXT, user TEXT, startTime TEXT, endTime TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`);

  // Beispiel-Tisch falls leer
  db.get("SELECT COUNT(*) as count FROM desks", (err, row) => {
    if (row.count === 0) {
      db.run(`INSERT INTO desks (name, x, y, w, h, mode) VALUES ('Tisch 1', 200, 150, 120, 80, 'FULLDAY')`);
    }
  });
});

// API
app.get('/api/desks', (req, res) => {
  db.all("SELECT * FROM desks", (err, desks) => {
    db.all("SELECT * FROM bookings WHERE date >= date('now')", (err, bookings) => {
      res.json({ desks, bookings });
    });
  });
});

app.post('/api/book', express.json(), (req, res) => {
  const { deskId, date, user, startTime, endTime } = req.body;
  db.run(`INSERT INTO bookings (deskId, date, user, startTime, endTime) VALUES (?, ?, ?, ?, ?)`,
    [deskId, date, user, startTime || '09:00', endTime || '18:00'], function(err) {
      res.json({ success: !err });
    });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Läuft auf Port ${PORT}`);
});