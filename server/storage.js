// server/storage.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hashPassword, verifyPassword, generateToken } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, '[]', 'utf8');
  }
  if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(SESSIONS_FILE, '{}', 'utf8');
  }
  if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, '[]', 'utf8');
  }
  if (!fs.existsSync(SETTINGS_FILE)) {
    const defaultSettings = {
      pollingIntervalSec: 60,
      soundAlert: true
    };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2), 'utf8');
  }
  if (!fs.existsSync(LOGS_FILE)) {
    fs.writeFileSync(LOGS_FILE, '[]', 'utf8');
  }
}

// --- Users & Auth ---

export function getUsers() {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

export function saveUsers(users) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

export function registerUser(username, password) {
  const users = getUsers();
  const trimmed = username.trim();
  if (!trimmed || !password) {
    throw new Error('아이디와 비밀번호를 모두 입력해 주세요.');
  }
  if (users.some(u => u.username.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error('이미 사용 중인 아이디입니다.');
  }

  const { salt, hash } = hashPassword(password);
  const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const newUser = {
    id: userId,
    username: trimmed,
    salt,
    passwordHash: hash,
    discordWebhookUrl: '',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  const token = createSession(userId);
  return {
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      discordWebhookUrl: newUser.discordWebhookUrl
    }
  };
}

export function loginUser(username, password) {
  const users = getUsers();
  const trimmed = (username || '').trim();
  const user = users.find(u => u.username.toLowerCase() === trimmed.toLowerCase());
  if (!user) {
    throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
  }

  const isValid = verifyPassword(password, user.salt, user.passwordHash);
  if (!isValid) {
    throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
  }

  const token = createSession(user.id);
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      discordWebhookUrl: user.discordWebhookUrl || ''
    }
  };
}

export function getUserById(userId) {
  const users = getUsers();
  return users.find(u => u.id === userId);
}

export function updateUserWebhook(userId, webhookUrl) {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    user.discordWebhookUrl = (webhookUrl || '').trim();
    saveUsers(users);
    return user;
  }
  return null;
}

// --- Sessions ---

function getSessions() {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveSessions(sessions) {
  ensureDataDir();
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf8');
}

export function createSession(userId) {
  const sessions = getSessions();
  const token = generateToken();
  sessions[token] = { userId, createdAt: new Date().toISOString() };
  saveSessions(sessions);
  return token;
}

export function getUserByToken(token) {
  if (!token) return null;
  const sessions = getSessions();
  const session = sessions[token];
  if (!session) return null;
  return getUserById(session.userId);
}

export function deleteSession(token) {
  const sessions = getSessions();
  delete sessions[token];
  saveSessions(sessions);
}

// --- Tasks ---

export function getAllTasks() {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(TASKS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getTasksByUser(userId) {
  const tasks = getAllTasks();
  if (!userId) return tasks;
  return tasks.filter(t => t.userId === userId);
}

export function saveTasks(tasks) {
  ensureDataDir();
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
}

export function getTaskById(id) {
  const tasks = getAllTasks();
  return tasks.find(t => t.id === id);
}

export function addTask(taskData, userId) {
  const tasks = getAllTasks();
  
  // Check if identical task already exists for this user (prevents duplicates during sync/restore)
  const existing = tasks.find(t => 
    t.userId === (userId || 'default') &&
    t.cinema === taskData.cinema &&
    t.theaterCode === taskData.theaterCode &&
    t.date === taskData.date &&
    (t.movieKeyword || '').trim().toLowerCase() === (taskData.movieKeyword || '').trim().toLowerCase()
  );
  if (existing) {
    return existing;
  }

  const id = taskData.id || ('task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
  const newTask = {
    id,
    userId: userId || 'default',
    cinema: taskData.cinema,
    theaterCode: taskData.theaterCode,
    theaterName: taskData.theaterName,
    date: taskData.date,
    movieKeyword: taskData.movieKeyword.trim(),
    specialOnly: taskData.specialOnly || 'ALL',
    webhookUrl: taskData.webhookUrl || '',
    status: taskData.status || 'ACTIVE',
    createdAt: taskData.createdAt || new Date().toISOString(),
    lastCheckedAt: null,
    lastResult: '등록됨 (대기 중)',
    matchedCount: 0,
    triggeredSchedules: []
  };
  tasks.unshift(newTask);
  saveTasks(tasks);

  addLog({
    userId: newTask.userId,
    taskId: id,
    type: 'INFO',
    cinema: newTask.cinema,
    theaterName: newTask.theaterName,
    movieTitle: newTask.movieKeyword,
    message: `새 예매 감시 작업이 등록되었습니다: [${newTask.cinema}] ${newTask.theaterName} / ${newTask.date} / "${newTask.movieKeyword}"`
  });

  return newTask;
}

export function updateTask(id, updates) {
  const tasks = getAllTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx !== -1) {
    tasks[idx] = { ...tasks[idx], ...updates };
    saveTasks(tasks);
    return tasks[idx];
  }
  return null;
}

export function deleteTask(id, userId) {
  const tasks = getAllTasks();
  const filtered = tasks.filter(t => {
    if (t.id !== id) return true;
    if (userId && t.userId && t.userId !== userId) return true; // prevent deleting others
    return false;
  });
  saveTasks(filtered);
}

// --- Global Settings ---

export function getSettings() {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {
      pollingIntervalSec: 60,
      soundAlert: true
    };
  }
}

export function saveSettings(settings) {
  ensureDataDir();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
}

// --- Activity Logs ---

export function getLogs(userId, limit = 100) {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(LOGS_FILE, 'utf8');
    const logs = JSON.parse(raw);
    if (userId) {
      return logs.filter(l => !l.userId || l.userId === userId).slice(0, limit);
    }
    return logs.slice(0, limit);
  } catch {
    return [];
  }
}

export function addLog(logEntry) {
  ensureDataDir();
  try {
    const logs = getLogs(null, 300);
    const newEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toISOString(),
      ...logEntry
    };
    logs.unshift(newEntry);
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs.slice(0, 200), null, 2), 'utf8');
    return newEntry;
  } catch (err) {
    console.error('Failed to write log:', err);
  }
}
