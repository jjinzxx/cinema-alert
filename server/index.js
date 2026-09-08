// server/index.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cgv from './adapters/cgv.js';
import * as megabox from './adapters/megabox.js';
import * as lotte from './adapters/lotte.js';
import {
  registerUser,
  loginUser,
  getUserByToken,
  deleteSession,
  updateUserWebhook,
  getTasksByUser,
  addTask,
  updateTask,
  deleteTask,
  getSettings,
  saveSettings,
  getLogs,
  getTaskById,
  initStorage
} from './storage.js';
import { startScheduler, checkSingleTask, restartSchedulerWithInterval } from './scheduler.js';
import { addClient, broadcast } from './notifiers/sse.js';
import { testDiscordWebhook } from './notifiers/discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Auth Middleware (extracts Bearer token)
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    req.user = null;
    return next();
  }
  const user = getUserByToken(token);
  req.user = user || null;
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: '로그인이 필요한 서비스입니다.' });
  }
  next();
}

app.use(authMiddleware);

// --- 1. Auth Endpoints ---

app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  try {
    const result = registerUser(username, password);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  try {
    const result = loginUser(username, password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    discordWebhookUrl: req.user.discordWebhookUrl || ''
  });
});

app.post('/api/auth/webhook', requireAuth, (req, res) => {
  const { webhookUrl } = req.body;
  const updated = updateUserWebhook(req.user.id, webhookUrl);
  res.json({
    success: true,
    discordWebhookUrl: updated.discordWebhookUrl
  });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (token) deleteSession(token);
  res.json({ success: true });
});

// --- 2. Theaters (Public) ---

app.get('/api/theaters', async (req, res) => {
  const { cinema } = req.query;
  try {
    let list = [];
    if (cinema === 'CGV') list = await cgv.getTheaters();
    else if (cinema === 'MEGABOX') list = await megabox.getTheaters();
    else if (cinema === 'LOTTE') list = await lotte.getTheaters();
    else {
      const [c, m, l] = await Promise.all([
        cgv.getTheaters(),
        megabox.getTheaters(),
        lotte.getTheaters()
      ]);
      return res.json({ CGV: c, MEGABOX: m, LOTTE: l });
    }
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 3. User-Isolated Tasks ---

// Get only current user's tasks (or empty if not logged in)
app.get('/api/tasks', (req, res) => {
  const userId = req.user ? req.user.id : null;
  if (!userId) return res.json([]);
  res.json(getTasksByUser(userId));
});

// Create task associated with current user
app.post('/api/tasks', requireAuth, (req, res) => {
  const { tasks } = req.body;
  const items = Array.isArray(tasks) ? tasks : [req.body];
  const createdList = [];

  for (const item of items) {
    if (!item.cinema || !item.theaterCode || !item.date || !item.movieKeyword) {
      continue;
    }
    // Automatically bind user ID and default to user's webhook if none specified
    const taskPayload = {
      ...item,
      webhookUrl: item.webhookUrl || req.user.discordWebhookUrl || ''
    };
    const created = addTask(taskPayload, req.user.id);
    createdList.push(created);
    broadcast('TASK_CREATED', created);
  }

  res.status(201).json(createdList);
});

// Update task
app.patch('/api/tasks/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const task = getTaskById(id);
  if (!task || task.userId !== req.user.id) {
    return res.status(404).json({ error: '해당 작업을 찾을 수 없거나 권한이 없습니다.' });
  }

  const updated = updateTask(id, req.body);
  broadcast('TASK_UPDATED', updated);
  res.json(updated);
});

// Delete task
app.delete('/api/tasks/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const task = getTaskById(id);
  if (!task || task.userId !== req.user.id) {
    return res.status(404).json({ error: '해당 작업을 찾을 수 없거나 권한이 없습니다.' });
  }

  deleteTask(id, req.user.id);
  broadcast('TASK_DELETED', { id, userId: req.user.id });
  res.json({ success: true, id });
});

// Instant check task
app.post('/api/tasks/:id/check', requireAuth, async (req, res) => {
  const { id } = req.params;
  const task = getTaskById(id);
  if (!task || task.userId !== req.user.id) {
    return res.status(404).json({ error: '해당 작업을 찾을 수 없거나 권한이 없습니다.' });
  }

  const result = await checkSingleTask(task);
  res.json(result);
});

// --- 4. User-Isolated Logs ---

app.get('/api/logs', (req, res) => {
  const userId = req.user ? req.user.id : null;
  res.json(getLogs(userId));
});

// --- 5. Settings & Webhook Testing ---

app.get('/api/settings', (req, res) => {
  const global = getSettings();
  res.json({
    pollingIntervalSec: global.pollingIntervalSec,
    soundAlert: global.soundAlert,
    discordWebhookUrl: req.user ? req.user.discordWebhookUrl : ''
  });
});

app.post('/api/settings', requireAuth, (req, res) => {
  const { discordWebhookUrl, pollingIntervalSec, soundAlert } = req.body;
  if (discordWebhookUrl !== undefined) {
    updateUserWebhook(req.user.id, discordWebhookUrl);
  }
  const oldSettings = getSettings();
  const newSettings = {
    ...oldSettings,
    pollingIntervalSec: pollingIntervalSec || oldSettings.pollingIntervalSec,
    soundAlert: soundAlert !== undefined ? soundAlert : oldSettings.soundAlert
  };
  saveSettings(newSettings);

  if (newSettings.pollingIntervalSec !== oldSettings.pollingIntervalSec) {
    restartSchedulerWithInterval(newSettings.pollingIntervalSec);
  }

  res.json({
    ...newSettings,
    discordWebhookUrl: req.user.discordWebhookUrl
  });
});

app.post('/api/test-webhook', async (req, res) => {
  const { webhookUrl } = req.body;
  const target = webhookUrl || (req.user && req.user.discordWebhookUrl);
  if (!target) {
    return res.status(400).json({ error: '디스코드 웹훅 URL이 입력되지 않았습니다.' });
  }

  try {
    await testDiscordWebhook(target);
    res.json({ success: true, message: '디스코드 채널로 테스트 알림 카드가 발송되었습니다!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 6. SSE Endpoint ---

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  addClient(res);
  res.write(`event: CONNECTED\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`);
});

// --- Static Client Serving ---
const clientDist = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), err => {
    if (err) res.send('Cinema Alert Server is running...');
  });
});

async function startServer() {
  await initStorage();
  app.listen(PORT, () => {
    console.log(`🎬 Cinema Alert Server listening on http://localhost:${PORT}`);
    startScheduler();
  });
}

startServer().catch(err => {
  console.error('Fatal server boot error:', err);
});
