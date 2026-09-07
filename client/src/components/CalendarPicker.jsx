// client/src/components/CalendarPicker.jsx
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check } from 'lucide-react';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function CalendarPicker({ value, onChange }) {
  // value is YYYY-MM-DD
  const initialDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-indexed

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Quick select helper
  const handleQuickSelect = (offsetDays, forceSaturday = false) => {
    const target = new Date();
    target.setHours(0, 0, 0, 0);
    if (forceSaturday) {
      // Find upcoming Saturday
      const day = target.getDay();
      const diff = (6 - day + 7) % 7 || 7;
      target.setDate(target.getDate() + diff + offsetDays);
    } else {
      target.setDate(target.getDate() + offsetDays);
    }
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    onChange(dateStr);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Generate calendar grid
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays = [];

  // 1. Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    calendarDays.push({
      day: d,
      month: viewMonth - 1,
      year: viewMonth === 0 ? viewYear - 1 : viewYear,
      isCurrentMonth: false
    });
  }

  // 2. Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({
      day: d,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true
    });
  }

  // 3. Next month leading days (fill up to 35 or 42)
  const totalSlots = calendarDays.length <= 35 ? 35 : 42;
  const remaining = totalSlots - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    calendarDays.push({
      day: d,
      month: viewMonth + 1,
      year: viewMonth === 11 ? viewYear + 1 : viewYear,
      isCurrentMonth: false
    });
  }

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  const formatDateString = (y, m, d) => {
    const realMonth = m < 0 ? 11 : m > 11 ? 0 : m;
    return `${y}-${String(realMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const isSelected = (y, m, d) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === y &&
      selectedDate.getMonth() === m &&
      selectedDate.getDate() === d
    );
  };

  const isToday = (y, m, d) => {
    return (
      today.getFullYear() === y &&
      today.getMonth() === m &&
      today.getDate() === d
    );
  };

  const isPast = (y, m, d) => {
    const dateObj = new Date(y, m, d);
    dateObj.setHours(0, 0, 0, 0);
    return dateObj < today;
  };

  // Format selected day info in Korean
  const selectedDayOfWeek = selectedDate ? WEEKDAYS[selectedDate.getDay()] : '';

  return (
    <div className="bg-white border border-borderLight rounded-2xl p-4 shadow-[0_2px_12px_rgba(40,50,40,0.03)]">
      {/* Quick shortcuts */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 pb-3 border-b border-borderLight/80">
        <span className="text-[11px] font-semibold text-sage-600 mr-1 flex items-center gap-1">
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>빠른 선택:</span>
        </span>
        {[
          { label: '오늘', offset: 0 },
          { label: '내일', offset: 1 },
          { label: '모레', offset: 2 },
          { label: '이번 주말(토)', offset: 0, sat: true },
          { label: '다음 주말(토)', offset: 7, sat: true }
        ].map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={() => handleQuickSelect(btn.offset, btn.sat)}
            className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-sage-50 text-sage-700 hover:bg-sage-100 hover:text-sage-900 border border-sage-200/70 transition"
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Month & Navigation Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h4 className="text-sm font-bold text-sage-900 flex items-center gap-1.5">
          <span>{viewYear}년 {viewMonth + 1}월</span>
        </h4>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-lg text-sage-600 hover:bg-sage-100 hover:text-sage-900 transition"
            title="이전 달"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-lg text-sage-600 hover:bg-sage-100 hover:text-sage-900 transition"
            title="다음 달"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {WEEKDAYS.map((w, idx) => (
          <div
            key={w}
            className={`text-[11px] font-bold py-1 ${
              idx === 0 ? 'text-rose-500' : idx === 6 ? 'text-sky-600' : 'text-sage-600'
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* Calendar days grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((item, idx) => {
          const past = isPast(item.year, item.month, item.day);
          const selected = isSelected(item.year, item.month, item.day);
          const currentDay = isToday(item.year, item.month, item.day);
          const dateStr = formatDateString(item.year, item.month, item.day);

          if (!item.isCurrentMonth) {
            return (
              <div
                key={idx}
                className="h-9 flex items-center justify-center text-xs text-sage-300 select-none"
              >
                {item.day}
              </div>
            );
          }

          if (past) {
            return (
              <div
                key={idx}
                className="h-9 flex items-center justify-center text-xs text-sage-300 cursor-not-allowed select-none line-through decoration-sage-200"
              >
                {item.day}
              </div>
            );
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(dateStr)}
              className={`h-9 w-full rounded-xl text-xs font-semibold flex flex-col items-center justify-center relative transition ${
                selected
                  ? 'bg-sage-600 text-white shadow-sm ring-2 ring-sage-600 ring-offset-1 font-bold'
                  : currentDay
                  ? 'bg-sage-100 text-sage-900 hover:bg-sage-200'
                  : 'text-sage-800 hover:bg-sage-50 hover:text-sage-950'
              }`}
            >
              <span>{item.day}</span>
              {currentDay && !selected && (
                <span className="text-[9px] -mt-0.5 text-sage-600 font-bold">오늘</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Current selection summary */}
      {selectedDate && (
        <div className="mt-3 pt-2.5 border-t border-borderLight/80 flex items-center justify-between text-xs">
          <span className="text-sage-600">선택된 날짜:</span>
          <span className="font-bold text-sage-900 bg-sage-50 px-2.5 py-1 rounded-lg border border-sage-200/80 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-sage-600" />
            <span>{value} ({selectedDayOfWeek}요일)</span>
          </span>
        </div>
      )}
    </div>
  );
}
