import express from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Import our API handlers
import webhookHandler from './api/webhook.js';
import dashboardHandler from './api/dashboard.js';
import statusHandler from './api/status.js';

// Mock the Vercel req/res for Express
function adaptHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('Handler error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
}

// Routes
app.post('/api/webhook', adaptHandler(webhookHandler));
app.get('/api/dashboard', adaptHandler(dashboardHandler));
app.get('/api/status', adaptHandler(statusHandler));

// Serve dashboard HTML
app.get('/', (req, res) => {
  try {
    const htmlPath = join(__dirname, 'public', 'index.html');
    const html = readFileSync(htmlPath, 'utf8');
    res.send(html);
  } catch (error) {
    console.error('Failed to serve dashboard:', error);
    res.status(500).send(`
    <h1>Dashboard Error</h1>
    <p>Could not load dashboard: ${error.message}</p>
    <p>Try accessing the APIs directly:</p>
    <ul>
      <li><a href="/api/dashboard">/api/dashboard</a></li>
      <li><a href="/api/status">/api/status</a></li>
    </ul>
    `);
  }
});

app.get('/dashboard', (req, res) => res.redirect('/'));

app.listen(port, () => {
  console.log(`🚀 Token Transfer Dashboard running at http://localhost:${port}`);
  console.log(`📊 Dashboard: http://localhost:${port}/`);
  console.log(`🔗 API Endpoints:`);
  console.log(`   POST http://localhost:${port}/api/webhook`);
  console.log(`   GET  http://localhost:${port}/api/dashboard`);
  console.log(`   GET  http://localhost:${port}/api/status`);
});
