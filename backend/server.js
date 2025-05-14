import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
// import csrfProtection from './middleware/csrfMiddleware.js'; // Removed CSRF

import authRoutes from './routes/authRoutes.js';
import voteRoutes from './routes/voteRoutes.js';
import secureVoteRoutes from './routes/secureVoteRoutes.js';
import initializeDatabase from './utils/dbInit.js';

// ES Module equivalents for __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  message: { error: 'Too many requests, please try again later' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 5 login/register attempts per windowMs
  standardHeaders: true,
  message: { error: 'Too many login attempts, please try again later' }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Create CSRF token endpoint - REMOVED
// app.get('/api/csrf-token', (req, res) => {
//   const token = csrfProtection.generateToken(req, res);
//   res.json({ csrfToken: token });
// });

// Add CSRF protection for non-GET routes - REMOVED
// app.use(csrfProtection.doubleCsrfProtection);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/polls', voteRoutes);
app.use('/api/secure-polls', secureVoteRoutes);

// Serve static files after API routes
app.use(express.static(path.join(__dirname, '../dist')));

// Serve React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Function to start server with port finding
const startServer = (port) => {
  const SERVER = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  }).on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying port ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error('Server error:', e);
    }
  });
};

// Initialize database and start server
initializeDatabase()
  .then(() => {
    startServer(PORT);
  })
  .catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  }); 