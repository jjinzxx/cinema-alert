// client/src/components/TaskCreator.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Film, Sparkles, CheckCircle, Flame, Calendar as CalendarIcon, LogIn } from 'lucide-react';
import CalendarPicker from './CalendarPicker.jsx';

const PRESET_THEATERS = [
  { cinema: 'CGV', name: '용산아이파크몰', code: '0013', tag: '용아맥/4DX' },
  { cinema: 'MEGABOX', name: '코엑스', code: '1351', tag: '코돌비' },
  { cinema: 'LOTTE', name: '월드타워', code: '1|1|1016', tag: '수퍼플렉스/샤롯데' },
  { cinema: 'CGV', name: '판교', code: '0074', tag: '판아맥' },
  { cinema: 'MEGABOX', name: '수원스타필드', code: '1651', tag: '수돌비' },
  { cinema: 'CGV', name: '영등포', code: '0059', tag: 'SCREENX' }
];

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

  // Movie keyword
  const [movieKeyword, setMovieKeyword] = useState('');
  const [specialOnly, setSpecialOnly] = useState('ALL');
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  // Load theaters when selected cinema changes
  useEffect(() => {
    let ignore = false;
    setLoadingTheaters(true);
    fetch(`/api/theaters?cinema=${selectedCinema}`)
      .then(res => res.json())
      .then(data => {
        if (!ignore && Array.isArray(data)) {
          setTheaters(data);
          if (data.length > 0) {
            setSelectedTheaterCode(data[0].code);
          }
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!ignore) setLoadingTheaters(false);
      });
    return () => { ignore = true; };
  }, [selectedCinema]);

  const handleApplyPreset = (preset) => {
    setSelectedCinema(preset.cinema);
    setSelectedTheaterCode(preset.code);
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
      alert('극장을 선택해 주세요.');
      return;
    }

    const currentTheater = theaters.find(t => t.code === selectedTheaterCode);
    const theaterName = currentTheater ? currentTheater.name : '선택 극장';

    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
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
          specialOnly
        })
      });

      if (!res.ok) throw new Error('등록 실패');
      
      setSuccessNotice(true);
      setTimeout(() => setSuccessNotice(false), 3000);
      setMovieKeyword('');
      if (onTaskCreated) onTaskCreated();
    } catch (err) {
      alert(`등록 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTheaters = theaters.filter(t => 
    (t.name || '').includes(searchFilter) || (t.region || '').includes(searchFilter)
  );

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
                  onClick={() => setSelectedCinema(c.id)}
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
                  placeholder="지점명 또는 지역 검색 (예: 용산, 강남)"
                  className="w-full pl-8 pr-3 py-2 bg-sage-50 border border-borderLight rounded-xl text-xs text-sage-900 placeholder-sage-400 focus:outline-none focus:bg-white focus:border-sage-500 transition"
                />
              </div>

              <select
                value={selectedTheaterCode}
                onChange={(e) => setSelectedTheaterCode(e.target.value)}
                className="w-full py-2 px-3 bg-sage-50 border border-borderLight rounded-xl text-xs text-sage-900 focus:outline-none focus:bg-white focus:border-sage-500 transition"
              >
                {filteredTheaters.map((t) => (
                  <option key={t.code} value={t.code}>
                    [{t.region}] {t.name}
                  </option>
                ))}
              </select>
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

        {/* Step 4: Movie Title & Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-sage-700 mb-1.5 flex items-center gap-1">
              <Film className="w-3.5 h-3.5 text-sage-500" />
              <span>4. 감시할 영화 제목 (키워드)</span>
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
              <span>5. 상영관 필터</span>
            </label>
            <select
              value={specialOnly}
              onChange={(e) => setSpecialOnly(e.target.value)}
              className="w-full py-2.5 px-3 bg-sage-50 border border-borderLight rounded-xl text-xs text-sage-900 focus:outline-none focus:bg-white focus:border-sage-500 transition"
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
