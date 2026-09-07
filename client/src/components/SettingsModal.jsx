// client/src/components/SettingsModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, Send, ShieldAlert, Volume2, Clock, CheckCircle, ExternalLink, User } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, token, currentUser, onSettingsUpdated }) {
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [pollingIntervalSec, setPollingIntervalSec] = useState(60);
  const [soundAlert, setSoundAlert] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (currentUser) {
        setDiscordWebhookUrl(currentUser.discordWebhookUrl || '');
      }
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          setPollingIntervalSec(data.pollingIntervalSec || 60);
          setSoundAlert(data.soundAlert !== false);
        })
        .catch(console.error);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!token) {
      alert('설정을 저장하려면 먼저 로그인해 주세요.');
      return;
    }

    setSaving(true);
    try {
      // 1. Save personal webhook
      await fetch('/api/auth/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ webhookUrl: discordWebhookUrl.trim() })
      });

      // 2. Save settings
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pollingIntervalSec,
          soundAlert,
          discordWebhookUrl: discordWebhookUrl.trim()
        })
      });

      const updated = await res.json();
      if (onSettingsUpdated) {
        onSettingsUpdated({
          ...updated,
          discordWebhookUrl: discordWebhookUrl.trim()
        });
      }
      onClose();
    } catch (err) {
      alert(`설정 저장 실패: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!discordWebhookUrl.trim()) {
      alert('디스코드 웹훅 URL을 먼저 입력해 주세요.');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: discordWebhookUrl.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult({ success: true, message: '내 디스코드 채널로 테스트 알림 카드가 정상 발송되었습니다! 채널을 확인하세요.' });
      } else {
        setTestResult({ success: false, message: data.error || '발송 실패' });
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sage-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-borderLight rounded-2xl w-full max-w-xl p-6 shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-borderLight">
          <div>
            <h3 className="text-base font-bold text-sage-900 flex items-center gap-2">
              <span>내 알림 및 디스코드 웹훅 설정</span>
            </h3>
            <p className="text-xs text-sage-500 mt-0.5">
              {currentUser ? `${currentUser.username}님의 전용 알림 환경을 구성합니다.` : '설정을 변경하려면 먼저 로그인해 주세요.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-sage-400 hover:text-sage-800 hover:bg-sage-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="py-4 space-y-4">
          {/* Discord Webhook Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-sage-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sage-500"></span>
                <span>내 전용 디스코드 웹훅 URL</span>
              </label>
              <a
                href="https://support.discord.com/hc/ko/articles/228383668-%EC%9B%B9%ED%9B%85-Webhook-%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sage-600 hover:text-sage-900 flex items-center gap-0.5"
              >
                <span>웹훅 생성 가이드</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={discordWebhookUrl}
                onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="flex-1 py-2 px-3 bg-sage-50 border border-borderLight rounded-xl text-xs text-sage-900 placeholder-sage-400 focus:outline-none focus:bg-white focus:border-sage-500 transition"
              />
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={testing}
                className="px-3.5 py-2 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testing ? '전송 중...' : '테스트 전송'}</span>
              </button>
            </div>
            
            <p className="text-[11px] text-sage-500 mt-1.5 leading-relaxed">
              * 이 웹훅 URL은 <strong>{currentUser?.username || '나'}의 계정에만 안전하게 귀속</strong>되며 다른 사용자에게 노출되지 않습니다.
            </p>

            {testResult && (
              <div className={`mt-2 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-sage-100 border border-sage-200 text-sage-900'
                  : 'bg-rose-50 border border-rose-200 text-rose-900'
              }`}>
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Polling Interval */}
          <div className="pt-2 border-t border-borderLight">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-sage-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sage-500" />
                <span>스케줄러 확인 주기 (폴링 간격)</span>
              </label>
              <span className="text-xs font-bold text-sage-800 bg-sage-100 px-2 py-0.5 rounded-md">
                {pollingIntervalSec}초마다 확인
              </span>
            </div>

            <input
              type="range"
              min="15"
              max="300"
              step="5"
              value={pollingIntervalSec}
              onChange={(e) => setPollingIntervalSec(parseInt(e.target.value, 10))}
              className="w-full accent-sage-600 cursor-pointer mb-1"
            />
            <div className="flex justify-between text-[10px] text-sage-500 px-0.5">
              <span>빠름 (15초)</span>
              <span>권장 (60초)</span>
              <span>여유 (5분)</span>
            </div>
          </div>

          {/* Sound Notification */}
          <div className="pt-2 border-t border-borderLight space-y-2">
            <label className="text-xs font-semibold text-sage-800 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-sage-500" />
              <span>알림 사운드</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={soundAlert}
                onChange={(e) => setSoundAlert(e.target.checked)}
                className="rounded border-borderLight text-sage-600 focus:ring-sage-500 w-4 h-4"
              />
              <span className="text-xs text-sage-700">
                예매 오픈 감지 시 맑은 차임벨(딩동) 효과음 자동 재생
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-borderLight flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-sage-50 hover:bg-sage-100 text-sage-700 text-xs font-medium transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? '저장 중...' : '설정 저장'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
