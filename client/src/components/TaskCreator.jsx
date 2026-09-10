// client/src/components/TaskCreator.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Film, Sparkles, CheckCircle, Flame, Calendar as CalendarIcon, LogIn, X, Clock } from 'lucide-react';
import CalendarPicker from './CalendarPicker.jsx';
import { API_BASE } from '../config.js';

const PRESET_THEATERS = [
  { cinema: 'CGV', name: '용산아이파크몰', code: '0013', tag: '용아맥/4DX' },
  { cinema: 'MEGABOX', name: '코엑스', code: '1351', tag: '코돌비' },
  { cinema: 'LOTTE', name: '월드타워', code: '1|1|1016', tag: '수퍼플렉스/샤롯데' },
  { cinema: 'CGV', name: '판교', code: '0074', tag: '판아맥' },
  { cinema: 'MEGABOX', name: '수원스타필드', code: '1651', tag: '수돌비' },
  { cinema: 'CGV', name: '영등포', code: '0059', tag: 'SCREENX' }
];

const TIME_PRESETS = [
  { id: 'ALL', label: '전체 시간 (기본)', start: '', end: '', desc: '모든 시간대' },
  { id: 'MORNING', label: '조조/오전 (06~12시)', start: '06:00', end: '12:00' },
  { id: 'AFTERNOON', label: '오후 (12~18시)', start: '12:00', end: '18:00' },
  { id: 'EVENING', label: '저녁/퇴근길 (18~23시)', start: '18:00', end: '23:00' },
  { id: 'NIGHT', label: '심야 (23~04시)', start: '23:00', end: '04:00' }
];

const TIME_OPTIONS = [
  { value: '', label: '제한 없음 (전체)' }
];
for (let h = 6; h <= 23; h++) {
  const hh = String(h).padStart(2, '0');
  const labelSuffix = h === 6 ? ' (아침)'
    : h === 9 ? ' (조조)'
    : h === 12 ? ' (낮 12시)'
    : h === 18 ? ' (퇴근/저녁)'
    : h === 21 ? ' (밤 9시)'
    : h === 23 ? ' (심야)' : '';
  TIME_OPTIONS.push({ value: `${hh}:00`, label: `${hh}:00${labelSuffix}` });
  TIME_OPTIONS.push({ value: `${hh}:30`, label: `${hh}:30` });
}
TIME_OPTIONS.push({ value: '24:00', label: '24:00 (자정)' });
TIME_OPTIONS.push({ value: '01:00', label: '익일 01:00 (새벽)' });
TIME_OPTIONS.push({ value: '02:00', label: '익일 02:00 (새벽)' });
TIME_OPTIONS.push({ value: '03:00', label: '익일 03:00 (새벽)' });
TIME_OPTIONS.push({ value: '04:00', label: '익일 04:00 (새벽)' });

function formatKoreanDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

export default function TaskCreator({ onTaskCreated, currentUser, token, onRequireAuth }) {
  const [selectedCinema, setSelectedCinema] = useState('CGV');
  const [theaters, setTheaters] = useState([]);
  const [loadingTheaters, setLoadingTheaters] = useState(false);
  const [selectedTheaterCode, setSelectedTheaterCode] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Date selection
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(defaultDate);

  // Movie keyword & Filters
  const [movieKeyword, setMovieKeyword] = useState('');
  const [specialOnly, setSpecialOnly] = useState('ALL');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  const activePreset = (() => {
    if (!startTime && !endTime) return 'ALL';
    if (startTime === '06:00' && endTime === '12:00') return 'MORNING';
    if (startTime === '12:00' && endTime === '18:00') return 'AFTERNOON';
    if (startTime === '18:00' && endTime === '23:00') return 'EVENING';
    if (startTime === '23:00' && endTime === '04:00') return 'NIGHT';
    return 'CUSTOM';
  })();

  // Load theaters when selected cinema changes
  useEffect(() => {
    let ignore = false;
    setLoadingTheaters(true);
    fetch(`${API_BASE}/api/theaters?cinema=${selectedCinema}`)
      .then(res => {
        if (!res.ok) throw new Error('지점 목록 조회 실패');
        return res.json();
      })
      .then(data => {
        if (!ignore && Array.isArray(data)) {
          setTheaters(data);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!ignore) setLoadingTheaters(false);
      });
    return () => { ignore = true; };
  }, [selectedCinema]);

  // Keep selectedTheaterCode strictly in sync with available & filtered theaters
  useEffect(() => {
    if (theaters.length === 0) {
      setSelectedTheaterCode('');
      return;
    }
    const filterLower = searchFilter.trim().toLowerCase();
    const matches = filterLower
      ? theaters.filter(t => 
          (t.name || '').toLowerCase().includes(filterLower) || 
          (t.region || '').toLowerCase().includes(filterLower)
        )
      : theaters;

    setSelectedTheaterCode(prev => {
      // If current selection is still in the filtered list, retain it!
      const exists = matches.some(t => t.code === prev);
      if (exists) return prev;
      // Otherwise immediately auto-select the first matching theater
      return matches.length > 0 ? matches[0].code : '';
    });
  }, [theaters, searchFilter]);

  const handleApplyPreset = (preset) => {
    setSelectedCinema(preset.cinema);
    setSearchFilter('');
    setSelectedTheaterCode(preset.code);
  };

  const handleCinemaChange = (cinemaId) => {
    if (selectedCinema === cinemaId) return;
    setSelectedCinema(cinemaId);
    setSearchFilter('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser || !token) {
      if (onRequireAuth) onRequireAuth();
      return;
    }

    if (!movieKeyword.trim()) {
      alert('감시할 영화 제목 또는 키워드를 입력해 주세요.');
      return;
    }
    if (!selectedTheaterCode) {
      alert('극장을 선택해 주세요. 검색 결과가 없다면 검색어를 지워주세요.');
      return;
    }

    const currentTheater = theaters.find(t => t.code === selectedTheaterCode);
    if (!currentTheater) {
      alert('유효한 극장 지점이 선택되지 않았습니다.');
      return;
    }
    const theaterName = currentTheater.name;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cinema: selectedCinema,
          theaterCode: selectedTheaterCode,
          theaterName,
          date: selectedDate,
          movieKeyword: movieKeyword.trim(),
          specialOnly,
          startTime: startTime || '',
          endTime: endTime || ''
        })
      });

      if (!res.ok) throw new Error('등록 실패');
      
      setSuccessNotice(true);
      setTimeout(() => setSuccessNotice(false), 3000);
      setMovieKeyword('');
      setStartTime('');
      setEndTime('');
      if (onTaskCreated) onTaskCreated();
    } catch (err) {
      alert(`등록 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const currentTheater = theaters.find(t => t.code === selectedTheaterCode);
  const filterLower = searchFilter.trim().toLowerCase();
  const filteredTheaters = filterLower
    ? theaters.filter(t => 
        (t.name || '').toLowerCase().includes(filterLower) || 
        (t.region || '').toLowerCase().includes(filterLower)
      )
    : theaters;

  return (
    <div className="bg-white border border-borderLight rounded-2xl p-6 shadow-[0_2px_16px_rgba(40,50,40,0.03)]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-sage-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sage-500"></span>
            <span>새 예매 오픈 감시 등록</span>
          </h2>
          <p className="text-xs text-sage-600 mt-0.5">
            아직 상영 스케줄이 열리지 않은 날짜와 기대작을 등록해 두세요.
          </p>
        </div>

        {/* Popular Presets */}
        <div className="hidden lg:flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-sage-500 mr-1 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-500" />
            <span>추천:</span>
          </span>
          {PRESET_THEATERS.slice(0, 4).map((p) => {
            const isSelected = selectedCinema === p.cinema && selectedTheaterCode === p.code;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition ${
                  isSelected
                    ? 'bg-sage-600 text-white shadow-sm'
                    : 'bg-sage-50 text-sage-700 hover:bg-sage-100'
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1 & 2: Cinema Brand & Theater Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-sage-700 mb-1.5">1. 극장사 선택</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-sage-50 rounded-xl border border-borderLight">
              {[
                { id: 'CGV', name: 'CGV' },
                { id: 'MEGABOX', name: '메가박스' },
                { id: 'LOTTE', name: '롯데시네마' }
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleCinemaChange(c.id)}
                  className={`py-2 px-1 rounded-lg text-xs font-bold transition text-center ${
                    selectedCinema === c.id
                      ? 'bg-white text-sage-900 shadow-sm border border-borderLight'
                      : 'text-sage-600 hover:text-sage-900'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-sage-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-sage-500" />
                <span>2. 지점 선택 ({theaters.length}개 지점)</span>
              </label>
              {loadingTheaters && <span className="text-[11px] text-sage-500 animate-pulse">지점 로딩 중...</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-sage-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="지점명 또는 지역 검색 (예: 수원, 용산)"
                  className="w-full pl-8 pr-7 py-2 bg-sage-50 border border-borderLight rounded-xl text-xs text-sage-900 placeholder-sage-400 focus:outline-none focus:bg-white focus:border-sage-500 transition"
                />
                {searchFilter && (
                  <button
                    type="button"
                    onClick={() => setSearchFilter('')}
                    className="absolute right-2.5 top-2.5 text-sage-400 hover:text-sage-600 p-0.5 rounded-full hover:bg-sage-200/50 transition"
                    title="검색어 지우기"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <select
                value={selectedTheaterCode}
                onChange={(e) => setSelectedTheaterCode(e.target.value)}
                disabled={filteredTheaters.length === 0}
                className="w-full py-2 px-3 bg-sage-50 border border-borderLight rounded-xl text-xs text-sage-900 focus:outline-none focus:bg-white focus:border-sage-500 transition disabled:opacity-50"
              >
                {filteredTheaters.length === 0 ? (
                  <option value="">검색 결과가 없습니다</option>
                ) : (
                  filteredTheaters.map((t) => (
                    <option key={t.code} value={t.code}>
                      [{t.region}] {t.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Selected Theater Confirmation Badge */}
            <div className="mt-2 flex items-center justify-between text-[11px]">
              {currentTheater ? (
                <div className="flex items-center gap-1.5 text-sage-700">
                  <span className="text-sage-500 font-medium">선택 완료:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-sage-100 font-bold text-sage-900 border border-sage-200/60">
                    [{selectedCinema}] {currentTheater.region ? `[${currentTheater.region}] ` : ''}{currentTheater.name}
                  </span>
                </div>
              ) : (
                <div className="text-amber-600 font-medium">
                  {filteredTheaters.length === 0 ? '일치하는 지점이 없습니다. 검색어를 지워주세요.' : '지점을 선택해 주세요.'}
                </div>
              )}
              {searchFilter && (
                <span className="text-sage-500 text-[11px]">
                  검색 결과 {filteredTheaters.length}개
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Calendar Picker */}
        <div>
          <label className="block text-xs font-semibold text-sage-700 mb-1.5 flex items-center gap-1">
            <CalendarIcon className="w-3.5 h-3.5 text-sage-500" />
            <span>3. 상영 날짜 선택 (달력 칸을 직접 클릭하세요)</span>
          </label>
          <CalendarPicker
            value={selectedDate}
            onChange={(dateStr) => setSelectedDate(dateStr)}
          />
        </div>

        {/* Step 4: Time Range Filter (Optional, positioned right after Date) */}
        <div className="bg-sage-50/60 border border-borderLight rounded-2xl p-4 sm:p-5 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-sage-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sage-600" />
                <span>4. 희망 상영 시간대 (선택 사항)</span>
              </label>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sage-100 text-sage-700 border border-sage-200/70">
                선택 안 하면 하루 전체 감시
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1 flex-wrap">
              {TIME_PRESETS.map((p) => {
                const isActive = activePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setStartTime(p.start);
                      setEndTime(p.end);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-sage-700 text-white shadow-xs'
                        : 'bg-white text-sage-700 hover:bg-sage-100 border border-borderLight'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Selectors: Start & End */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
            <div>
              <label className="block text-[11px] font-semibold text-sage-700 mb-1">
                시작 시간 (이 시간 이후 회차)
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full py-2.5 px-3 bg-white border border-borderLight rounded-xl text-xs text-sage-900 focus:outline-none focus:border-sage-500 transition font-medium"
              >
                {TIME_OPTIONS.map((opt) => (
                  <option key={'start_' + opt.value} value={opt.value}>
                    {opt.value ? `시작: ${opt.label}` : '시작 시간 제한 없음 (처음부터)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-sage-700 mb-1">
                종료 시간 (이 시간 이전 회차)
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full py-2.5 px-3 bg-white border border-borderLight rounded-xl text-xs text-sage-900 focus:outline-none focus:border-sage-500 transition font-medium"
              >
                {TIME_OPTIONS.map((opt) => (
                  <option key={'end_' + opt.value} value={opt.value}>
                    {opt.value ? `종료: ${opt.label}` : '종료 시간 제한 없음 (끝까지)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Reassurance Banner */}
          <div className={`p-3 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition ${
            (startTime || endTime)
              ? 'bg-sage-100/90 border border-sage-200 text-sage-900 shadow-xs'
              : 'bg-white border border-borderLight text-sage-600'
          }`}>
            <div className="flex items-start sm:items-center gap-2">
              <span className="text-base shrink-0">{(startTime || endTime) ? '🎯' : '✨'}</span>
              <div>
                <div className="font-bold flex items-center gap-1.5 flex-wrap">
                  <span className="text-sage-800">{formatKoreanDate(selectedDate)}</span>
                  <span className="text-sage-400">|</span>
                  <span className={startTime || endTime ? 'text-sage-900' : 'text-sage-700'}>
                    {(startTime || endTime)
                      ? `[${startTime || '00:00'} ~ ${endTime || '24:00'}] 사이 회차만 알림`
                      : '전체 시간대 (모든 상영 회차 알림)'}
                  </span>
                </div>
                <p className="text-[11px] text-sage-600 mt-0.5">
                  {(startTime || endTime)
                    ? `지정한 시간대에 시작하는 상영 스케줄이 열리면 디스코드로 즉시 알려드립니다.`
                    : `상영 시작 시간에 관계없이 해당 날짜의 모든 오픈 회차를 감시합니다.`}
                </p>
              </div>
            </div>

            {(startTime || endTime) && (
              <button
                type="button"
                onClick={() => {
                  setStartTime('');
                  setEndTime('');
                }}
                className="self-start sm:self-auto px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-sage-600 hover:text-rose-600 border border-borderLight text-[11px] font-semibold transition shrink-0 shadow-xs flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>전체 시간으로 초기화</span>
              </button>
            )}
          </div>
        </div>

        {/* Step 5 & 6: Movie Title & Screen Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-sage-700 mb-1.5 flex items-center gap-1">
              <Film className="w-3.5 h-3.5 text-sage-500" />
              <span>5. 감시할 영화 제목 (키워드)</span>
            </label>
            <input
              type="text"
              value={movieKeyword}
              onChange={(e) => setMovieKeyword(e.target.value)}
              placeholder="예: 미키 17, 아바타, 듄, 오펜하이머"
              className="w-full py-2.5 px-3 bg-sage-50 border border-borderLight rounded-xl text-xs text-sage-900 placeholder-sage-400 focus:outline-none focus:bg-white focus:border-sage-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-sage-700 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-sage-500" />
              <span>6. 상영관 필터</span>
            </label>
            <select
              value={specialOnly}
              onChange={(e) => setSpecialOnly(e.target.value)}
              className="w-full py-2.5 px-3 bg-sage-50 border border-borderLight rounded-xl text-xs text-sage-900 focus:outline-none focus:border-sage-500 transition"
            >
              <option value="ALL">전체 상영관</option>
              <option value="IMAX">IMAX 전용</option>
              <option value="DOLBY">Dolby Cinema 전용</option>
              <option value="4DX">4DX 전용</option>
              <option value="SUPER PLEX">수퍼플렉스 전용</option>
            </select>
          </div>
        </div>

        {/* Submit & Status Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-borderLight/80">
          <span className="text-xs text-sage-500">
            {currentUser
              ? (currentUser.discordWebhookUrl ? `✅ ${currentUser.username}님의 전용 디스코드 웹훅 연결됨` : `⚠️ ${currentUser.username}님의 디스코드 웹훅 미등록 (설정 메뉴에서 등록 가능)`)
              : '🔒 감시 작업을 등록하려면 먼저 로그인해 주세요.'}
          </span>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span>등록 중...</span>
            ) : !currentUser ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>로그인하고 감시 시작하기</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>알림 감시 시작하기</span>
              </>
            )}
          </button>
        </div>

        {successNotice && (
          <div className="p-3 bg-sage-100 border border-sage-200 text-sage-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle className="w-4 h-4 text-sage-600 shrink-0" />
            <span>새 예매 감시 작업이 등록되었습니다! 백그라운드에서 실시간 모니터링을 진행합니다.</span>
          </div>
        )}
      </form>
    </div>
  );
}
