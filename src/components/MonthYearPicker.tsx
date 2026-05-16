'use client';

import { useState, useEffect } from 'react';

interface MonthYearPickerProps {
  open: boolean;
  mode: 'year' | 'month';
  year: number;
  month: number;
  onClose: () => void;
  onApply: (year: number, month: number) => void;
}

export default function MonthYearPicker({
  open,
  mode,
  year,
  month,
  onClose,
  onApply,
}: MonthYearPickerProps) {
  const [pickerYear, setPickerYear] = useState(year);
  const [yearGridStart, setYearGridStart] = useState(year - 5);

  useEffect(() => {
    if (open) {
      setPickerYear(year);
      setYearGridStart(year - 5);
    }
  }, [open, year, month]);

  if (!open) return null;

  const today = new Date();
  const currentY = today.getFullYear();
  const currentM = today.getMonth();

  return (
    <>
      {/* Click-outside layer (no backdrop) */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Anchored mini-calendar popup */}
      <div
        className="absolute left-0 right-0 mt-2 z-50 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-2xl shadow-xl border border-border-strong p-3.5">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => {
                if (mode === 'month') setPickerYear(pickerYear - 1);
                else setYearGridStart(yearGridStart - 12);
              }}
              className="w-7 h-7 rounded-full hover:bg-surface-secondary flex items-center justify-center active:scale-90 transition-transform"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <p className="text-sm font-bold text-text-primary tabular-nums">
              {mode === 'month' ? `${pickerYear}년` : `${yearGridStart} – ${yearGridStart + 11}`}
            </p>
            <button
              onClick={() => {
                if (mode === 'month') setPickerYear(pickerYear + 1);
                else setYearGridStart(yearGridStart + 12);
              }}
              className="w-7 h-7 rounded-full hover:bg-surface-secondary flex items-center justify-center active:scale-90 transition-transform"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {mode === 'month' ? (
            <div className="grid grid-cols-4 gap-1.5">
              {Array.from({ length: 12 }).map((_, m) => {
                const isSelected = pickerYear === year && m === month;
                const isCurrent = pickerYear === currentY && m === currentM;
                return (
                  <button
                    key={m}
                    onClick={() => {
                      onApply(pickerYear, m);
                      onClose();
                    }}
                    className={`py-2 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-accent text-white'
                        : isCurrent
                        ? 'bg-blue-50 text-accent'
                        : 'text-text-primary hover:bg-surface-secondary'
                    }`}
                  >
                    {m + 1}월
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {Array.from({ length: 12 }).map((_, idx) => {
                const y = yearGridStart + idx;
                const isSelected = y === year;
                const isCurrent = y === currentY;
                return (
                  <button
                    key={y}
                    onClick={() => {
                      onApply(y, month);
                      onClose();
                    }}
                    className={`py-2 rounded-lg text-xs font-medium tabular-nums transition-all ${
                      isSelected
                        ? 'bg-accent text-white'
                        : isCurrent
                        ? 'bg-blue-50 text-accent'
                        : 'text-text-primary hover:bg-surface-secondary'
                    }`}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={() => {
              onApply(currentY, currentM);
              onClose();
            }}
            className="mt-2.5 w-full py-1.5 text-[11px] font-medium text-accent active:scale-95 transition-transform"
          >
            오늘로 이동
          </button>
        </div>
      </div>
    </>
  );
}
