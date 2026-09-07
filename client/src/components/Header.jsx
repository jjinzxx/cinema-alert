// client/src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Settings, Film, User, LogIn, LogOut, HelpCircle } from 'lucide-react';

export default function Header({
  isConnected,
  currentUser,
  onOpenSettings,
  onOpenGuide,
  onOpenAuth,
  onLogout,
  tasksCount,
  openCount
}) {
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === 'granted') {
        new Notification('시네마 알리미', {
          body: '브라우저 알림이 활성화되었습니다. 예매 오픈 시 팝업이 표시됩니다.',
          icon: '🎬'
        });
      }
    }
  };

  return (
    <header className="border-b border-borderLight bg-surface/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sage-500 text-white flex items-center justify-center shadow-sm">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-sage-900">
                시네마 알리미
              </h1>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sage-100 text-sage-700">
                MINIMAL
              </span>
              <div className="flex items-center gap-1 ml-1">
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">CGV</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">메가박스</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">롯데시네마</span>
              </div>
            </div>
            <p className="text-[11px] text-sage-600 mt-0.5">
              실시간 예매 오픈 감지 • 개인별 디스코드 웹훅 알림
            </p>
          </div>
        </div>

        {/* Status & User Actions */}
        <div className="flex items-center gap-2.5">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sage-50 border border-borderLight text-xs">
            <span className="relative flex h-2 w-2">
              {isConnected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              )}
            </span>
            <span className="text-sage-800 font-medium text-[11px]">
              {isConnected ? "실시간 감시 중" : "서버 연결 중"}
            </span>
            {currentUser && (
              <>
                <span className="text-sage-300">|</span>
                <span className="text-sage-600 text-[11px]">
                  내 작업 <strong className="text-sage-900">{tasksCount}</strong>
                </span>
              </>
            )}
            {openCount > 0 && (
              <>
                <span className="text-sage-300">|</span>
                <span className="text-emerald-700 font-bold text-[11px]">
                  오픈 {openCount}
                </span>
              </>
            )}
          </div>

          {/* Cloud 24H Guide Button */}
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-sage-50 text-sage-700 border border-borderLight text-xs font-medium transition shadow-sm"
            title="컴퓨터 꺼도 24시간 알림 받는 클라우드 무료 배포 안내"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sage-500" />
            <span className="hidden sm:inline">24시간 상시 감시</span>
          </button>

          {/* Browser Notification Button */}
          {permission !== 'granted' ? (
            <button
              onClick={requestNotificationPermission}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sage-100 hover:bg-sage-200 text-sage-800 text-xs font-semibold transition shadow-sm"
              title="브라우저 알림 켜기"
            >
              <Bell className="w-3.5 h-3.5 text-sage-600" />
              <span>알림 켜기</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sage-50 text-sage-700 border border-borderLight text-xs">
              <BellRing className="w-3.5 h-3.5 text-sage-500" />
              <span className="text-[11px]">알림 켬</span>
            </div>
          )}

          {/* User Auth Info or Login Button */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sage-50 hover:bg-sage-100 text-sage-800 border border-borderLight text-xs font-semibold transition"
                title="내 웹훅 및 설정"
              >
                <User className="w-3.5 h-3.5 text-sage-600" />
                <span>{currentUser.username}님</span>
                <Settings className="w-3 h-3 text-sage-400 ml-0.5" />
              </button>

              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-white hover:bg-rose-50 text-sage-500 hover:text-rose-600 border border-borderLight transition"
                title="로그아웃"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sage-700 hover:bg-sage-800 text-white text-xs font-bold transition shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>로그인 / 회원가입</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
