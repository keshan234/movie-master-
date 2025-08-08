// server.js
// Simple Node.js + Express + SQLite demo for MOVIE MASTER HUB
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database('./database.db');

app.use(bodyParser.json());
// serve static files (index.html, movie.html, uploads if any)
app.use(express.static(__dirname));

// Initialize DB table
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    year TEXT,
    description TEXT,
    image TEXT,
    downloads TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// API: list movies
app.get('/api/movies', (req, res) => {
  db.all('SELECT id, title, year, description, image, downloads FROM movies ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// API: get single movie
app.get('/api/movies/:id', (req, res) => {
  db.get('SELECT * FROM movies WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Movie not found' });
    // downloads stored as JSON string
    try { row.downloads = JSON.parse(row.downloads || '[]'); } catch(e){ row.downloads = []; }
    res.json(row);
  });
});

// API: create movie (simple; for real site add validation & file upload)
app.post('/api/movies', (req, res) => {
  const { title, year, description, image, downloads } = req.body;
  const downloadsStr = downloads ? JSON.stringify(downloads) : JSON.stringify([]);
  db.run('INSERT INTO movies (title, year, description, image, downloads) VALUES (?, ?, ?, ?, ?)',
    [title, year, description, image || '', downloadsStr],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
});

// Serve main pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/movie', (req, res) => res.sendFile(path.join(__dirname, 'movie.html')));

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
