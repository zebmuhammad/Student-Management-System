import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import session from 'express-session';
import methodOverride from 'method-override';
import expressLayouts from 'express-ejs-layouts';
import Student from './models/Student.js';
import { fileURLToPath } from 'url';

import studentRoutes from './routes/studentRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Basic middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Session management
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Static assets
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

// Expose current path and user info to views
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.user = req.session.userId ? {
    id: req.session.userId,
    username: req.session.username,
    role: req.session.role
  } : null;
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    console.log(JSON.stringify({
      time: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: req.ip
    }));
  });
  next();
});

// Routes
app.get('/', async (req, res, next) => {
  try {
    const [total, byDept, avgGpaAgg] = await Promise.all([
      Student.estimatedDocumentCount(),
      Student.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Student.aggregate([{ $group: { _id: null, avg: { $avg: '$gpa' } } }])
    ]);

    const topDepartments = byDept.map(d => ({ name: d._id || 'Unknown', count: d.count }));
    const avgGpa = avgGpaAgg.length ? Number(avgGpaAgg[0].avg.toFixed(2)) : null;

    // Flash messages
    let flashMsg = '';
    if (req.query.msg === 'login_success') {
      flashMsg = 'Welcome back! You have successfully logged in.';
    } else if (req.query.msg === 'logout_success') {
      flashMsg = 'You have been successfully logged out.';
    }

    res.render('index', { 
      title: 'Home', 
      total, 
      topDepartments, 
      avgGpa,
      flashMsg 
    });
  } catch (e) {
    next(e);
  }
});

// Authentication routes
app.use('/', authRoutes);

// Student routes
app.use('/students', studentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404);
  res.render('error', { title: 'Not Found', message: 'The page you requested was not found.', status: 404 });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message = status === 500 ? 'An unexpected error occurred.' : err.message;
  if (req.accepts('html')) {
    return res.status(status).render('error', { title: 'Error', message, status });
  }
  res.status(status).json({ error: message });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_management';

mongoose
  .connect(MONGODB_URI, { autoIndex: true })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });


