// client/src/components/AuthModal.jsx
import React, { useState } from 'react';
import { X, LogIn, UserPlus, Shield, User, Lock, AlertCircle } from 'lucide-react';
import { API_BASE } from '../config.js';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('아이디와 비밀번호를 모두 입력해 주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    const endpoint = isRegister ? `${API_BASE}/api/auth/register` : `${API_BASE}/api/auth/login`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password
        })
      });

      const contentType = res.headers.get('content-type') || '';
      let data = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        if (!res.ok) {
          throw new Error('API 백엔드 서버에 연결할 수 없습니다. GitHub Pages는 정적 페이지만 제공하므로, 로컬 환경(http://localhost:4000)으로 접속하시거나 무료 백엔드 서버(Render 등) 연결이 필요합니다.');
        }
      }

      if (!res.ok) {
        throw new Error(data.error || '인증 처리에 실패했습니다.');
      }

      // Successful auth
      if (onAuthSuccess) {
        onAuthSuccess(data.token, data.user);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sage-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-borderLight rounded-2xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-borderLight">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sage-100 text-sage-700 flex items-center justify-center">
              {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-sage-900">
                {isRegister ? '회원가입' : '로그인'}
              </h3>
              <p className="text-xs text-sage-500 mt-0.5">
                나만의 예매 알림 및 전용 웹훅을 안전하게 보관하세요.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-sage-400 hover:text-sage-800 hover:bg-sage-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="py-4 space-y-3.5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-sage-700 mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-sage-500" />
              <span>아이디 (Username)</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
              className="w-full py-2.5 px-3 bg-sage-50 border border-borderLight rounded-xl text-xs text-sage-900 placeholder-sage-400 focus:outline-none focus:bg-white focus:border-sage-500 transition"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-sage-700 mb-1.5 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-sage-500" />
              <span>비밀번호 (Password)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full py-2.5 px-3 bg-sage-50 border border-borderLight rounded-xl text-xs text-sage-900 placeholder-sage-400 focus:outline-none focus:bg-white focus:border-sage-500 transition"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <span>처리 중...</span>
              ) : isRegister ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>회원가입 완료하기</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>로그인하기</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Switch Mode Footer */}
        <div className="pt-3 border-t border-borderLight text-center text-xs text-sage-600">
          {isRegister ? (
            <p>
              이미 계정이 있으신가요?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(null); }}
                className="font-bold text-sage-900 hover:underline ml-1"
              >
                로그인하기
              </button>
            </p>
          ) : (
            <p>
              처음 이용하시나요?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(null); }}
                className="font-bold text-sage-900 hover:underline ml-1"
              >
                간편 회원가입
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
