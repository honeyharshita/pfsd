import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db.js';
import chatRoutes from './routes/chat.js';
import moodRoutes from './routes/mood.js';
import predictMoodRoutes from './routes/predictMood.js';
import analysisRoutes from './routes/analysis.js';
import reportRoutes from './routes/reports.js';
import forecasterRoutes from './routes/forecaster.js';
import decisionRoutes from './routes/decision.js';
import adminRoutes from './routes/admin.js';
import aiRoutes from './routes/ai.js';
import aiInsightsRoutes from './routes/aiInsights.js';
import entityRoutes from './routes/entities.js';
import notificationRoutes from './routes/notifications.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', 'pfsd', '.env.local') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.some((pattern) => pattern.test(origin))) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use((req, _res, next) => {
  console.log('[REQ] %s %s', req.method, req.url);
  next();
});

// Initialize database
await initDb();

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api', predictMoodRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/forecaster', forecasterRoutes);
app.use('/api/decision', decisionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai', aiInsightsRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/notifications', notificationRoutes);

// Compatibility aliases for cleaner production API paths.
app.post('/api/chat', (req, res, next) => {
  req.url = '/send';
  chatRoutes(req, res, next);
});

app.get('/api/predict', (req, res, next) => {
  req.url = '/predict';
  forecasterRoutes(req, res, next);
});

app.post('/api/journal', (req, res, next) => {
  req.url = '/journal-analysis';
  aiInsightsRoutes(req, res, next);
});

app.post('/api/journal-analysis', (req, res, next) => {
  req.url = '/journal-analysis';
  aiInsightsRoutes(req, res, next);
});

app.post('/api/trigger-analyzer', (req, res, next) => {
  req.url = '/trigger-analyzer';
  aiInsightsRoutes(req, res, next);
});

app.post('/api/report', (req, res, next) => {
  req.url = '/weekly';
  reportRoutes(req, res, next);
});

app.get('/api/weekly-report', (req, res, next) => {
  req.url = '/weekly-report';
  reportRoutes(req, res, next);
});

app.post('/api/weekly-report', (req, res, next) => {
  req.url = '/weekly-report';
  reportRoutes(req, res, next);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  const key = process.env.OPENAI_API_KEY || '';
  const validKey = key.trim().length > 0 && !/YOUR-OPENAI-API-KEY|YOUR_KEY_HERE|sk-proj-YOUR/i.test(key);
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`✅ Storage ready`);
  console.log(`✅ OpenAI key loaded: ${validKey}`);
});
