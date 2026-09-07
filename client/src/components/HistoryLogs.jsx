// client/src/components/HistoryLogs.jsx
import React from 'react';
import { History, CheckCircle2, AlertTriangle, Info, BellRing } from 'lucide-react';

export default function HistoryLogs({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="bg-white border border-borderLight rounded-2xl p-6 text-center text-xs text-sage-500">
        아직 기록된 이벤트가 없습니다. 감시 작업이 진행되면 이곳에 실시간으로 기록됩니다.
      </div>
    );
  }

  return (
    <div className="bg-white border border-borderLight rounded-2xl p-5 shadow-[0_2px_12px_rgba(40,50,40,0.02)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-sage-900 flex items-center gap-2">
          <History className="w-4 h-4 text-sage-600" />
          <span>실시간 감지 및 알림 로그</span>
        </h3>
        <span className="text-xs text-sage-500">최근 {logs.length}건 기록</span>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
        {logs.map((log) => {
          const isOpen = log.type === 'OPEN_DETECTED';
          const isError = log.type === 'ERROR';

          return (
            <div
              key={log.id}
              className={`p-3 rounded-xl border text-xs flex items-start gap-3 transition ${
                isOpen
                  ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                  : isError
                  ? 'bg-rose-50 border-rose-200 text-rose-950'
                  : 'bg-sage-50/60 border-borderLight text-sage-800'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isOpen ? (
                  <BellRing className="w-4 h-4 text-amber-600" />
                ) : isError ? (
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                ) : (
                  <Info className="w-4 h-4 text-sage-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    {log.cinema && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-sage-200/80 text-sage-800">
                        {log.cinema}
                      </span>
                    )}
                    <span className="text-sage-900 truncate">
                      {log.theaterName ? `${log.theaterName}` : '시스템'}
                    </span>
                  </div>
                  <span className="text-[11px] text-sage-500 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString('ko-KR')}
                  </span>
                </div>
                <p className="leading-relaxed text-sage-700">{log.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
