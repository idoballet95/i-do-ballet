'use client';

import { WorkoutEvent, FutsalSession, BalletSession } from '@/types';
import { conditionEmoji, balletTypeEmoji } from '@/lib/ballet';

interface EventModalProps {
  event: WorkoutEvent | null;
  onClose: () => void;
}

function isFutsal(e: WorkoutEvent): e is FutsalSession {
  return e.category === 'futsal';
}

function isBallet(e: WorkoutEvent): e is BalletSession {
  return e.category === 'ballet';
}

function rankLabel(r: number) {
  if (r === 1) return '🏆 우승';
  if (r === 2) return '🥈 준우승';
  if (r === 3) return '🥉 3위';
  return `${r}위`;
}

export default function EventModal({ event, onClose }: EventModalProps) {
  if (!event) return null;

  const categoryColor = event.category === 'futsal' ? 'bg-futsal' : 'bg-ballet';
  const categoryLabel = event.category === 'futsal' ? '풋살' : '발레';

  return (
    <div className="fixed inset-0 z-[100] animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="absolute bottom-0 left-0 right-0 max-w-lg mx-auto max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white rounded-t-3xl px-6 pt-3 pb-8 safe-bottom animate-slide-up">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sticky top-0" />

          <div className="flex items-center gap-2.5 mb-4">
            <span className={`w-2.5 h-2.5 rounded-full ${categoryColor}`} />
            <span className="text-xs font-medium text-text-secondary tracking-wide uppercase">
              {categoryLabel}
            </span>
            {isFutsal(event) && (
              <span className="text-[10px] font-medium text-futsal-deep bg-futsal-light px-2 py-0.5 rounded-full">
                {event.type}
              </span>
            )}
            {isBallet(event) && (
              <span className="text-[10px] font-medium text-ballet bg-ballet-light px-2 py-0.5 rounded-full flex items-center gap-1">
                <span>{balletTypeEmoji(event.type)}</span>
                {event.type}
              </span>
            )}
          </div>

          <h3 className="text-xl font-semibold text-text-primary mb-1">
            {isFutsal(event) ? (event.customTeam || event.team) : (event.customStudio || event.studio)}
          </h3>
          <p className="text-sm text-text-secondary mb-5">{event.place}</p>

          {/* Tournament final rank */}
          {isFutsal(event) && event.type === '대회' && event.finalRank && (
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/40 border border-amber-200/60 rounded-2xl px-4 py-3 mb-4">
              <p className="text-[10px] text-amber-700 mb-0.5 tracking-wide">대회 최종 순위</p>
              <p className="text-xl font-bold text-amber-900">{rankLabel(event.finalRank)}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-5">
            <InfoCard label="날짜" value={formatDate(event.date)} />
            <InfoCard label="시간" value={`${event.startTime} – ${event.endTime}`} />
            {isFutsal(event) && (
              <>
                <InfoCard label="총 골" value={String(event.goals)} />
                <InfoCard label="총 어시스트" value={String(event.assists)} />
              </>
            )}
            {isBallet(event) && (
              <>
                <InfoCard label="수업" value={event.classType} />
                <InfoCard
                  label="컨디션"
                  value={`${conditionEmoji(event.bodyCondition)} ${event.bodyCondition}`}
                />
                <InfoCard label="난이도" value={'★'.repeat(event.difficulty) + '☆'.repeat(5 - event.difficulty)} />
              </>
            )}
          </div>

          {/* Matches */}
          {isFutsal(event) && event.matches && event.matches.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-medium text-text-secondary mb-2 tracking-wide">
                {event.type === '대회' ? `대회 경기 (${event.matches.length})` : '경기 결과'}
              </p>
              <div className="space-y-2.5">
                {event.matches.map((m) => {
                  const result = m.finalOur > m.finalTheir ? '승' : m.finalOur === m.finalTheir ? '무' : '패';
                  const resultColor = result === '승' ? 'text-futsal-deep' : result === '패' ? 'text-red-400' : 'text-text-tertiary';
                  return (
                    <div key={m.id} className="bg-surface-secondary rounded-xl p-3.5">
                      <div className="flex items-center justify-between mb-2.5">
                        <p className="text-sm font-semibold text-text-primary">vs {m.opponent}</p>
                        <span className={`text-sm font-bold ${resultColor}`}>
                          {result} {m.finalOur}:{m.finalTheir}
                        </span>
                      </div>

                      {/* Per-match my stats */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="flex-1 bg-white rounded-lg py-1.5 px-2.5 flex items-center justify-between">
                          <span className="text-[10px] text-text-tertiary">내 골</span>
                          <span className="text-sm font-bold text-futsal-deep tabular-nums">{m.myGoals}</span>
                        </div>
                        <div className="flex-1 bg-white rounded-lg py-1.5 px-2.5 flex items-center justify-between">
                          <span className="text-[10px] text-text-tertiary">어시</span>
                          <span className="text-sm font-bold text-futsal-deep tabular-nums">{m.myAssists}</span>
                        </div>
                      </div>

                      {/* Quarter results — only for friendly */}
                      {m.quarterResults && m.quarterResults.length > 0 && (
                        <div className="flex gap-1.5">
                          {m.quarterResults.map((q) => (
                            <div key={q.quarter} className="flex-1 bg-white rounded-lg py-1.5 text-center">
                              <p className="text-[9px] text-text-tertiary">Q{q.quarter}</p>
                              <p className="text-xs font-medium text-text-primary tabular-nums">
                                {q.our}<span className="text-text-tertiary mx-0.5">:</span>{q.their}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Memo (diary) */}
          {event.memo && (
            <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-4 mb-5 border border-amber-100/60">
              <div className="flex items-center gap-1.5 mb-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <p className="text-[11px] text-amber-700 font-medium tracking-wide">오늘의 메모</p>
              </div>
              <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{event.memo}</p>
            </div>
          )}

          {/* Video links */}
          {isFutsal(event) && event.videoLinks && event.videoLinks.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-medium text-text-secondary mb-2 tracking-wide">
                영상 ({event.videoLinks.length})
              </p>
              <div className="space-y-1.5">
                {event.videoLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 bg-surface-secondary rounded-xl px-3.5 py-2.5 active:scale-[0.98] transition-transform"
                  >
                    <div className="w-7 h-7 rounded-lg bg-futsal-light flex items-center justify-center flex-shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#65A30D" strokeWidth="2" strokeLinecap="round">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                    </div>
                    <span className="text-xs text-text-primary flex-1 truncate">영상 {idx + 1}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3.5 bg-surface-secondary text-text-primary font-medium rounded-2xl text-sm active:scale-[0.98] transition-transform"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-secondary rounded-xl p-3">
      <p className="text-[10px] text-text-tertiary mb-0.5 tracking-wide">{label}</p>
      <p className="text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}
