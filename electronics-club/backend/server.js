require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files — uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
// Static files — frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Routes
app.use('/api/auth',      require('./routes/auth.routes'));
app.use('/api/users',     require('./routes/users.routes'));
app.use('/api/news',      require('./routes/news.routes'));
app.use('/api/events',    require('./routes/events.routes'));
app.use('/api/documents', require('./routes/documents.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Catch-all: serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\x1b[36m
╔════════════════════════════════════════╗
║  Electronics Club Management System    ║
║  Server running on port ${PORT}           ║
╚════════════════════════════════════════╝
\x1b[0m`);
});

module.exports = app;
