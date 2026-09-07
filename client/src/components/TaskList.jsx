// client/src/components/TaskList.jsx
import React, { useState } from 'react';
import { Play, Pause, Trash2, Zap, ExternalLink, Clock, Calendar, CheckCircle2, Film } from 'lucide-react';
import { API_BASE } from '../config.js';

const BOOKING_URLS = {
  CGV: 'https://cgv.co.kr/ticket',
  MEGABOX: 'https://m.megabox.co.kr/booking',
  LOTTE: 'https://www.lottecinema.co.kr/NLCHS/Ticketing'
};

export default function TaskList({ tasks, token, onRefresh }) {
  const [checkingId, setCheckingId] = useState(null);

  const handleToggleStatus = async (task) => {
    const nextStatus = task.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await fetch(`${API_BASE}/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('이 감시 작업을 삭제하시겠습니까?')) return;
    try {
      await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleInstantCheck = async (id) => {
    setCheckingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}/check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (onRefresh) onRefresh();
      if (data.count > 0) {
        alert(`🎉 예매 오픈이 확인되었습니다! (${data.count}개 회차 감지)`);
      }
    } catch (err) {
      alert(`확인 실패: ${err.message}`);
    } finally {
      setCheckingId(null);
    }
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-white border border-borderLight rounded-2xl p-12 text-center shadow-[0_2px_12px_rgba(40,50,40,0.02)] my-4">
        <Film className="w-10 h-10 text-sage-300 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-sage-800 mb-1">등록된 내 감시 작업이 없습니다</h3>
        <p className="text-xs text-sage-500 max-w-sm mx-auto">
          상단의 등록 폼에서 감시할 극장과 날짜, 영화를 선택한 뒤 "알림 감시 시작하기"를 눌러주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 my-4">
      {/* Section Header with generous margin */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-sage-900 flex items-center gap-2">
          <span>내 모니터링 작업 현황</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-sage-100 text-sage-700 font-semibold">
            {tasks.length}개
          </span>
        </h3>
        <span className="text-xs text-sage-500">
          실시간 자동 순회 조회 중
        </span>
      </div>

      {/* Cards Grid with generous gap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => {
          const isTriggered = task.status === 'TRIGGERED';
          const isPaused = task.status === 'PAUSED';
          const isChecking = checkingId === task.id;

          return (
            <div
              key={task.id}
              className={`bg-white border rounded-2xl p-5 sm:p-6 transition flex flex-col justify-between shadow-[0_2px_16px_rgba(40,50,40,0.03)] ${
                isTriggered
                  ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300'
                  : 'border-borderLight hover:border-sage-300'
              }`}
            >
              <div>
                {/* Header Row: Cinema badge & status badge */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-sage-700 text-white shadow-sm">
                      {task.cinema}
                    </span>
                    <span className="text-xs font-semibold text-sage-800">
                      {task.theaterName}
                    </span>
                    {task.specialOnly && task.specialOnly !== 'ALL' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sage-100 text-sage-700 border border-sage-200">
                        {task.specialOnly}
                      </span>
                    )}
                  </div>

                  {/* Status Indicator Badge */}
                  <div>
                    {isTriggered ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>오픈 감지됨!</span>
                      </span>
                    ) : isPaused ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                        <Pause className="w-3 h-3" />
                        <span>일시정지</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-sage-50 text-sage-700 border border-sage-200">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>실시간 감시 중</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Movie Title */}
                <div className="mb-3">
                  <h4 className="text-base font-bold text-sage-900 tracking-tight flex items-center gap-2">
                    <Film className="w-4 h-4 text-sage-500 shrink-0" />
                    <span className="truncate">{task.movieKeyword}</span>
                  </h4>
                </div>

                {/* Meta info: Date & Last check */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-sage-600 mb-4">
                  <span className="flex items-center gap-1.5 bg-sage-50 px-2.5 py-1 rounded-lg border border-borderLight font-semibold text-sage-800">
                    <Calendar className="w-3.5 h-3.5 text-sage-500" />
                    <span>{task.date}</span>
                  </span>
                  <span className="flex items-center gap-1 text-sage-500 text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>확인: {task.lastCheckedAt ? new Date(task.lastCheckedAt).toLocaleTimeString('ko-KR') : '대기 중'}</span>
                  </span>
                </div>

                {/* Result Message Box */}
                <div className={`text-xs px-3.5 py-2.5 rounded-xl mb-4 leading-relaxed ${
                  isTriggered
                    ? 'bg-amber-100/70 text-amber-950 font-semibold border border-amber-200'
                    : 'bg-sage-50 text-sage-700 border border-borderLight'
                }`}>
                  {task.lastResult || '상영 일정 미등록 (감시 중)'}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-3.5 border-t border-borderLight gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleInstantCheck(task.id)}
                    disabled={isChecking}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sage-100 hover:bg-sage-200 text-sage-800 text-xs font-semibold transition disabled:opacity-50"
                    title="스케줄러 주기를 기다리지 않고 지금 즉시 조회"
                  >
                    <Zap className={`w-3.5 h-3.5 text-sage-600 ${isChecking ? 'animate-spin' : ''}`} />
                    <span>{isChecking ? '조회 중...' : '지금 확인'}</span>
                  </button>

                  <button
                    onClick={() => handleToggleStatus(task)}
                    className="p-2 rounded-xl bg-sage-50 hover:bg-sage-100 text-sage-700 border border-borderLight transition"
                    title={isPaused ? "감시 재개" : "감시 일시정지"}
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-600" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-2 rounded-xl bg-sage-50 hover:bg-rose-50 text-sage-400 hover:text-rose-600 border border-borderLight transition"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <a
                  href={BOOKING_URLS[task.cinema] || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isTriggered
                      ? 'bg-sage-700 text-white hover:bg-sage-800 shadow-sm'
                      : 'bg-sage-50 hover:bg-sage-100 text-sage-800 border border-borderLight'
                  }`}
                >
                  <span>예매 링크</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
