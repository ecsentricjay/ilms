require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Allow all origins — works on Vercel serverless
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight
app.options('*', cors());

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/results', require('./routes/results'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Only listen when running locally — Vercel handles this in prod
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`ILMS Server running on port ${PORT}`));
}

module.exports = app;
