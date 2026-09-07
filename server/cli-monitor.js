// server/cli-monitor.js
// Standalone runner designed for GitHub Actions cron execution (runs every 10-15 mins in GitHub Cloud)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkSingleTask } from './scheduler.js';
import { getAllTasks, saveTasks, getLogs, addLog } from './storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runCliMonitoring() {
  console.log('====================================================');
  console.log(`[GitHub Actions Monitor] Run at: ${new Date().toISOString()}`);
  console.log('====================================================');

  const tasks = getAllTasks();
  const activeTasks = tasks.filter(t => t.status === 'ACTIVE');

  if (activeTasks.length === 0) {
    console.log('No active monitoring tasks found in data/tasks.json.');
    console.log('Please add tasks via the Web UI or commit tasks into data/tasks.json.');
    return;
  }

  console.log(`Found ${activeTasks.length} active tasks to check:`);
  for (const t of activeTasks) {
    console.log(` • [${t.cinema}] ${t.theaterName} | ${t.date} | "${t.movieKeyword}"`);
  }

  let openingsCount = 0;

  for (const task of activeTasks) {
    console.log(`\nChecking [${task.cinema}] ${task.theaterName} for "${task.movieKeyword}" (${task.date})...`);
    try {
      const res = await checkSingleTask(task);
      if (res && res.count > 0) {
        openingsCount += res.count;
        console.log(`🎉 [OPEN DETECTED] Found ${res.count} new sessions! Discord webhook dispatched.`);
      } else if (res && res.showtimes && res.showtimes.length > 0) {
        console.log(`ℹ️ [ALREADY OPEN] ${res.showtimes.length} sessions active.`);
      } else {
        console.log(`⏳ [WAITING] Not yet opened.`);
      }
    } catch (err) {
      console.error(`❌ Error checking task ${task.id}:`, err.message);
    }
    // Respectful delay between queries
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n====================================================');
  console.log(`[GitHub Actions Monitor Finished] New openings detected: ${openingsCount}`);
  console.log('====================================================');
}

runCliMonitoring()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal CLI monitor error:', err);
    process.exit(1);
  });
