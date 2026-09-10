// server/scheduler.js
import * as cgv from './adapters/cgv.js';
import * as megabox from './adapters/megabox.js';
import * as lotte from './adapters/lotte.js';
import { sendDiscordAlert } from './notifiers/discord.js';
import { broadcast } from './notifiers/sse.js';
import { getAllTasks, updateTask, getSettings, addLog, getUserById } from './storage.js';

let intervalTimer = null;
let isChecking = false;

function normalize(str) {
  return (str || '').replace(/\s+/g, '').toLowerCase();
}

function matchesSpecialFilter(screenType, screenName, specialOnly) {
  if (!specialOnly || specialOnly === 'ALL') return true;
  const combined = `${screenType} ${screenName}`.toUpperCase();
  if (specialOnly === 'IMAX') return combined.includes('IMAX');
  if (specialOnly === 'DOLBY') return combined.includes('DOLBY') || combined.includes('돌비');
  if (specialOnly === '4DX') return combined.includes('4DX');
  if (specialOnly === 'SUPER PLEX') return combined.includes('SUPER PLEX') || combined.includes('수퍼플렉스');
  return true;
}

function matchesTimeFilter(startTime, rangeStart, rangeEnd) {
  if (!startTime) return true;
  const sStart = (rangeStart || '').trim();
  const sEnd = (rangeEnd || '').trim();
  if (!sStart && !sEnd) return true;

  const st = startTime.trim();
  if (sStart && sEnd) {
    if (sStart <= sEnd) {
      return st >= sStart && st <= sEnd;
    } else {
      // Overnight range, e.g. 23:00 ~ 04:00
      return st >= sStart || st <= sEnd;
    }
  }
  if (sStart) return st >= sStart;
  if (sEnd) return st <= sEnd;
  return true;
}

export async function checkSingleTask(task) {
  const { id, userId, cinema, theaterCode, theaterName, date, movieKeyword, specialOnly, startTime, endTime, webhookUrl } = task;
  const normKeyword = normalize(movieKeyword);

  try {
    let showtimes = [];
    if (cinema === 'CGV') {
      showtimes = await cgv.getShowtimes(theaterCode, date);
    } else if (cinema === 'MEGABOX') {
      showtimes = await megabox.getShowtimes(theaterCode, date);
    } else if (cinema === 'LOTTE') {
      showtimes = await lotte.getShowtimes(theaterCode, date);
    }

    const matched = showtimes.filter(s => {
      const matchTitle = normalize(s.movieTitle).includes(normKeyword);
      const matchSpecial = matchesSpecialFilter(s.screenType, s.screenName, specialOnly);
      const matchTime = matchesTimeFilter(s.startTime, startTime, endTime);
      return matchTitle && matchSpecial && matchTime;
    });

    const now = new Date().toISOString();

    if (matched.length > 0) {
      const triggeredSet = new Set(task.triggeredSchedules || []);
      const newOpenings = [];

      for (const item of matched) {
        const scheduleKey = `${item.date}_${item.startTime}_${item.screenName}`;
        if (!triggeredSet.has(scheduleKey)) {
          newOpenings.push(item);
          triggeredSet.add(scheduleKey);
        }
      }

      if (newOpenings.length > 0) {
        // Resolve target webhook: task-level override or user's personal webhook
        const user = getUserById(userId);
        const targetWebhook = webhookUrl || (user && user.discordWebhookUrl);

        for (const item of newOpenings) {
          if (targetWebhook) {
            try {
              await sendDiscordAlert(targetWebhook, item);
              console.log(`[Discord Sent] User: ${user?.username || userId} | ${item.cinema} ${item.theaterName} - ${item.movieTitle}`);
            } catch (err) {
              console.error(`[Discord Error]`, err.message);
              addLog({
                userId,
                taskId: id,
                type: 'ERROR',
                cinema,
                theaterName,
                movieTitle: item.movieTitle,
                message: `디스코드 전송 실패: ${err.message}`
              });
            }
          }

          // Broadcast SSE to web clients
          broadcast('OPEN_DETECTED', {
            taskId: id,
            userId,
            item,
            timestamp: now
          });

          addLog({
            userId,
            taskId: id,
            type: 'OPEN_DETECTED',
            cinema,
            theaterName,
            movieTitle: item.movieTitle,
            message: `🎉 [${cinema}] ${theaterName} ${item.movieTitle} (${item.screenName} ${item.startTime}) 예매 오픈 감지!`
          });
        }

        const updated = updateTask(id, {
          status: 'TRIGGERED',
          lastCheckedAt: now,
          lastResult: `🎉 예매 오픈 감지됨! (${matched.length}개 회차 등록됨)`,
          matchedCount: matched.length,
          triggeredSchedules: Array.from(triggeredSet)
        });

        broadcast('TASK_UPDATED', updated);
        return { success: true, count: newOpenings.length, showtimes: matched };
      } else {
        const updated = updateTask(id, {
          lastCheckedAt: now,
          lastResult: `현재 ${matched.length}개 회차 오픈 유지 중`,
          matchedCount: matched.length
        });
        broadcast('TASK_UPDATED', updated);
        return { success: true, count: 0, showtimes: matched };
      }
    } else {
      const timeDesc = (startTime || endTime) ? ` [${startTime || '00:00'}~${endTime || '24:00'}]` : '';
      const updated = updateTask(id, {
        lastCheckedAt: now,
        lastResult: `상영 일정 미등록${timeDesc} (감시 중)`,
        matchedCount: 0
      });
      broadcast('TASK_UPDATED', updated);
      return { success: true, count: 0, showtimes: [] };
    }
  } catch (err) {
    console.error(`[Scheduler Error on Task ${id}]`, err.message);
    const now = new Date().toISOString();
    const updated = updateTask(id, {
      lastCheckedAt: now,
      lastResult: `조회 중 일시적 오류: ${err.message}`
    });
    broadcast('TASK_UPDATED', updated);
    return { success: false, error: err.message };
  }
}

export async function runMonitoringCycle() {
  if (isChecking) return;
  isChecking = true;

  try {
    const tasks = getAllTasks();
    const activeTasks = tasks.filter(t => t.status === 'ACTIVE');
    if (activeTasks.length > 0) {
      console.log(`[Scheduler] Checking ${activeTasks.length} active tasks across users...`);
    }

    for (const task of activeTasks) {
      await checkSingleTask(task);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  } catch (err) {
    console.error('[Scheduler Loop Error]', err.message);
  } finally {
    isChecking = false;
    broadcast('CYCLE_COMPLETED', { timestamp: new Date().toISOString() });
  }
}

export function startScheduler() {
  const settings = getSettings();
  const intervalSec = Math.max(15, settings.pollingIntervalSec || 60);

  if (intervalTimer) clearInterval(intervalTimer);

  console.log(`[Scheduler] Started with ${intervalSec}s interval`);
  intervalTimer = setInterval(() => {
    runMonitoringCycle().catch(console.error);
  }, intervalSec * 1000);

  setTimeout(() => {
    runMonitoringCycle().catch(console.error);
  }, 2000);
}

export function restartSchedulerWithInterval(intervalSec) {
  const settings = getSettings();
  settings.pollingIntervalSec = Math.max(15, intervalSec);
  startScheduler();
}
