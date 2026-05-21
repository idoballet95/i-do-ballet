'use client';

import { useState, useMemo } from 'react';
import { useEvents } from '@/lib/events-store';
import { WorkoutEvent } from '@/types';
import EventModal from '@/components/EventModal';
import Avatar from '@/components/Avatar';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const { events } = useEvents();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<WorkoutEvent | null>(null);

  const eventsByDate = useMemo(() => {
    const map: Record<string, WorkoutEvent[]> = {};
    events.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(formatDateKey(today.getFullYear(), today.getMonth(), today.getDate()));
  };

  const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

  const upcomingEvents = useMemo(() => {
    return events
      .filter((e) => e.date >= todayKey)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [events, todayKey]);

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="px-5 pt-14 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <Avatar size={44} />
          <div>
            <p className="text-xs text-text-tertiary">안녕하세요,</p>
            <p className="text-base font-bold text-text-primary leading-tight">아이두 님 👋</p>
          </div>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              {currentYear}년 {currentMonth + 1}월
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-medium text-accent bg-blue-50 rounded-full active:scale-95 transition-transform"
            >
              오늘
            </button>
            <button onClick={prevMonth} className="p-2 active:scale-90 transition-transform">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button onClick={nextMonth} className="p-2 active:scale-90 transition-transform">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d, i) => (
            <div
              key={d}
              className={`text-center text-[11px] font-medium py-1.5 ${
                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-text-tertiary'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-12" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateKey = formatDateKey(currentYear, currentMonth, day);
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDate;
            const dayEvents = eventsByDate[dateKey] || [];
            const hasFutsal = dayEvents.some((e) => e.category === 'futsal');
            const hasBallet = dayEvents.some((e) => e.category === 'ballet');
            const dayOfWeek = (firstDay + i) % 7;

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(dateKey === selectedDate ? null : dateKey)}
                className="h-12 flex flex-col items-center justify-center relative active:scale-90 transition-transform"
              >
                <span
                  className={`text-sm w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                    isToday && isSelected
                      ? 'bg-accent text-white font-semibold'
                      : isToday
                      ? 'bg-accent text-white font-semibold'
                      : isSelected
                      ? 'bg-surface-tertiary text-text-primary font-semibold'
                      : dayOfWeek === 0
                      ? 'text-red-400'
                      : dayOfWeek === 6
                      ? 'text-blue-400'
                      : 'text-text-primary'
                  }`}
                >
                  {day}
                </span>
                <div className="flex gap-0.5 mt-0.5 h-1.5">
                  {hasFutsal && <span className="w-1.5 h-1.5 rounded-full bg-futsal" />}
                  {hasBallet && <span className="w-1.5 h-1.5 rounded-full bg-ballet" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date events */}
      {selectedDate && selectedEvents.length > 0 && (
        <div className="px-5 pt-3 pb-2 animate-fade-in-up">
          <p className="text-xs font-medium text-text-tertiary mb-2 tracking-wide">
            {formatDisplayDate(selectedDate)}
          </p>
          <div className="space-y-2">
            {selectedEvents.map((event) => (
              <EventCard key={event.id} event={event} onTap={() => setSelectedEvent(event)} />
            ))}
          </div>
        </div>
      )}

      {selectedDate && selectedEvents.length === 0 && (
        <div className="px-5 pt-6 pb-2 text-center animate-fade-in">
          <p className="text-sm text-text-tertiary">이 날은 기록이 없어요</p>
        </div>
      )}

      {/* Upcoming events */}
      {!selectedDate && (
        <div className="px-5 pt-4 pb-2">
          <p className="text-xs font-medium text-text-tertiary mb-3 tracking-wide">다가오는 일정</p>
          <div className="space-y-2">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} onTap={() => setSelectedEvent(event)} showDate />
              ))
            ) : (
              <p className="text-sm text-text-tertiary text-center py-4">예정된 일정이 없어요</p>
            )}
          </div>
        </div>
      )}

      <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}

function EventCard({
  event,
  onTap,
  showDate = false,
}: {
  event: WorkoutEvent;
  onTap: () => void;
  showDate?: boolean;
}) {
  const isFutsal = event.category === 'futsal';
  const borderColor = isFutsal ? 'border-l-futsal' : 'border-l-ballet';
  const label =
    isFutsal && event.category === 'futsal'
      ? (event as import('@/types').FutsalSession).customTeam || (event as import('@/types').FutsalSession).team
      : (event as import('@/types').BalletSession).customStudio || (event as import('@/types').BalletSession).studio;

  return (
    <button
      onClick={onTap}
      className={`w-full text-left bg-surface-secondary rounded-2xl p-3.5 border-l-[3px] ${borderColor} active:scale-[0.98] transition-transform`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-text-primary">{label}</p>
          <p className="text-xs text-text-secondary mt-0.5">
            {showDate && <span>{formatShortDate(event.date)} · </span>}
            {event.startTime} – {event.endTime} · {event.place}
          </p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </button>
  );
}

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
