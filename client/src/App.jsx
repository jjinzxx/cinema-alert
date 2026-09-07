// client/src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header.jsx';
import TaskCreator from './components/TaskCreator.jsx';
import TaskList from './components/TaskList.jsx';
import HistoryLogs from './components/HistoryLogs.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import AuthModal from './components/AuthModal.jsx';
import { BellRing, ExternalLink } from 'lucide-react';

function playDingSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.12);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime + index * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.12 + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + index * 0.12);
      osc.stop(ctx.currentTime + index * 0.12 + 0.45);
    });
  } catch (e) {
    console.warn('Audio not permitted', e);
  }
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('cinema_alert_token') || '');
  const [currentUser, setCurrentUser] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [latestAlert, setLatestAlert] = useState(null);

  // Check login session on token change
  useEffect(() => {
    if (!token) {
      setCurrentUser(null);
      setTasks([]);
      return;
    }

    fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Session expired');
        return res.json();
      })
      .then(user => {
        setCurrentUser(user);
      })
      .catch(() => {
        // Token invalid or expired
        localStorage.removeItem('cinema_alert_token');
        setToken('');
        setCurrentUser(null);
      });
  }, [token]);

  const fetchTasks = useCallback(async () => {
    if (!token) {
      setTasks([]);
      return;
    }
    try {
      const res = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    }
  }, [token]);

  const fetchLogs = useCallback(async () => {
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch('/api/logs', { headers });
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    }
  }, [token]);

  useEffect(() => {
    fetchTasks();
    fetchLogs();
  }, [fetchTasks, fetchLogs]);

  const handleAuthSuccess = (newToken, user) => {
    localStorage.setItem('cinema_alert_token', newToken);
    setToken(newToken);
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch {}
    localStorage.removeItem('cinema_alert_token');
    setToken('');
    setCurrentUser(null);
    setTasks([]);
  };

  // Server-Sent Events (SSE) listener
  useEffect(() => {
    let eventSource = null;

    function connectSSE() {
      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.addEventListener('OPEN_DETECTED', (e) => {
        const data = JSON.parse(e.data);
        const item = data.item;

        // Only alert if the opening belongs to this user!
        if (currentUser && data.userId === currentUser.id) {
          setLatestAlert(item);
          playDingSound();

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`🎉 [${item.cinema}] ${item.movieTitle} 예매 오픈!`, {
              body: `${item.theaterName} (${item.screenName})\n상영시간: ${item.startTime} ~ ${item.endTime}\n잔여: ${item.availableSeats}석`,
              icon: item.posterUrl || '🎬'
            });
          }
        }

        fetchTasks();
        fetchLogs();
      });

      eventSource.addEventListener('TASK_UPDATED', () => fetchTasks());
      eventSource.addEventListener('TASK_CREATED', () => { fetchTasks(); fetchLogs(); });
      eventSource.addEventListener('TASK_DELETED', () => fetchTasks());
      eventSource.addEventListener('CYCLE_COMPLETED', () => fetchTasks());

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();
        setTimeout(connectSSE, 4000);
      };
    }

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [currentUser, fetchTasks, fetchLogs]);

  const openCount = tasks.filter(t => t.status === 'TRIGGERED').length;

  return (
    <div className="min-h-screen bg-[#F6F7F3] text-sage-900 flex flex-col font-sans">
      {/* Minimalist Navigation */}
      <Header
        isConnected={isConnected}
        currentUser={currentUser}
        onOpenSettings={() => {
          if (!currentUser) setIsAuthOpen(true);
          else setIsSettingsOpen(true);
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        tasksCount={tasks.length}
        openCount={openCount}
      />

      {/* Alert Notification Banner */}
      {latestAlert && (
        <div className="bg-sage-800 text-white px-4 py-3 shadow-lg flex items-center justify-between sticky top-[61px] z-30 animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-1.5 bg-white/10 rounded-lg">
                <BellRing className="w-5 h-5 text-amber-300" />
              </span>
              <div>
                <p className="text-[11px] font-bold tracking-wider text-sage-200">
                  🎉 [예매 오픈 감지] {latestAlert.cinema} {latestAlert.theaterName}
                </p>
                <p className="text-sm font-semibold">
                  {latestAlert.movieTitle} • {latestAlert.screenName} ({latestAlert.startTime} ~ {latestAlert.endTime} / 잔여 {latestAlert.availableSeats}석)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={latestAlert.bookingUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-white text-sage-900 font-bold text-xs hover:bg-sage-100 transition shadow flex items-center gap-1"
              >
                <span>예매하러 가기</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setLatestAlert(null)}
                className="px-2 py-1 text-xs text-white/80 hover:text-white"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area with generous padding */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Task Creation Form with Calendar */}
        <TaskCreator
          onTaskCreated={fetchTasks}
          currentUser={currentUser}
          token={token}
          onRequireAuth={() => setIsAuthOpen(true)}
        />

        {/* User-Isolated Task List */}
        <TaskList
          tasks={tasks}
          token={token}
          onRefresh={fetchTasks}
        />

        {/* Real-time Logs */}
        <HistoryLogs logs={logs} />
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        token={token}
        currentUser={currentUser}
        onSettingsUpdated={(updatedUser) => {
          if (currentUser) {
            setCurrentUser({ ...currentUser, discordWebhookUrl: updatedUser.discordWebhookUrl });
          }
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Minimalist Footer with jjinzxx Copyright */}
      <footer className="border-t border-borderLight bg-white py-6 text-center text-xs text-sage-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Cinema Alert • CGV · 메가박스 · 롯데시네마 실시간 예매 오픈 알리미</p>
          <div className="flex items-center gap-1.5 text-sage-600">
            <span>Created by</span>
            <a
              href="https://blog.naver.com/epspqm823"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-sage-800 hover:text-sage-950 hover:underline inline-flex items-center gap-1"
            >
              <span>jjinzxx</span>
            </a>
            <span className="mx-1">•</span>
            <span>All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
