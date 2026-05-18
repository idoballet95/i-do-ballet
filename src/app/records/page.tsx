'use client';

import { useState, useMemo } from 'react';
import { mockEvents } from '@/data/mock';
import type { FutsalSession, BalletSession, WorkoutEvent, FutsalType, MatchResult } from '@/types';
import { conditionEmoji, balletTypeEmoji } from '@/lib/ballet';
import EventModal from '@/components/EventModal';
import MonthYearPicker from '@/components/MonthYearPicker';
import Avatar from '@/components/Avatar';

type Tab = 'futsal' | 'ballet';
type FutsalView = 'overview' | '대회' | '친선경기' | '훈련';
type PeriodMode = 'all' | 'month' | 'year';

function isFutsal(e: WorkoutEvent): e is FutsalSession {
  return e.category === 'futsal';
}

function matchOurScore(m: MatchResult): number {
  return m.finalOur ?? (m.quarterResults ?? []).reduce((s, q) => s + q.our, 0);
}
function matchTheirScore(m: MatchResult): number {
  return m.finalTheir ?? (m.quarterResults ?? []).reduce((s, q) => s + q.their, 0);
}
function matchResult(m: MatchResult): '승' | '무' | '패' {
  const our = matchOurScore(m);
  const their = matchTheirScore(m);
  return our > their ? '승' : our === their ? '무' : '패';
}

export default function RecordsPage() {
  const [tab, setTab] = useState<Tab>('futsal');
  const [futsalView, setFutsalView] = useState<FutsalView>('overview');
  const [selectedEvent, setSelectedEvent] = useState<WorkoutEvent | null>(null);

  // Period filter
  const today = new Date();
  const [periodMode, setPeriodMode] = useState<PeriodMode>('all');
  const [pYear, setPYear] = useState(today.getFullYear());
  const [pMonth, setPMonth] = useState(today.getMonth());
  const [pickerOpen, setPickerOpen] = useState(false);

  const periodLabel = useMemo(() => {
    if (periodMode === 'all') return '전체 기간';
    if (periodMode === 'year') return `${pYear}년`;
    return `${pYear}년 ${pMonth + 1}월`;
  }, [periodMode, pYear, pMonth]);

  const matchesPeriod = (dateStr: string) => {
    if (periodMode === 'all') return true;
    const d = new Date(dateStr + 'T00:00:00');
    if (periodMode === 'year') return d.getFullYear() === pYear;
    return d.getFullYear() === pYear && d.getMonth() === pMonth;
  };

  const futsalSessions = useMemo(
    () =>
      mockEvents
        .filter(isFutsal)
        .filter((e) => matchesPeriod(e.date))
        .sort((a, b) => b.date.localeCompare(a.date)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [periodMode, pYear, pMonth]
  );
  const balletSessions = useMemo(
    () =>
      mockEvents
        .filter((e): e is BalletSession => e.category === 'ballet')
        .filter((e) => matchesPeriod(e.date))
        .sort((a, b) => b.date.localeCompare(a.date)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [periodMode, pYear, pMonth]
  );

  const futsalStats = useMemo(() => {
    const totalGoals = futsalSessions.reduce((s, e) => s + e.goals, 0);
    const totalAssists = futsalSessions.reduce((s, e) => s + e.assists, 0);
    const training = futsalSessions.filter((e) => e.type === '훈련').length;
    const tournament = futsalSessions.filter((e) => e.type === '대회').length;
    const friendly = futsalSessions.filter((e) => e.type === '친선경기').length;

    const teamCounts: Record<string, number> = {};
    futsalSessions.forEach((e) => {
      const name = e.customTeam || e.team;
      teamCounts[name] = (teamCounts[name] || 0) + 1;
    });

    const allMatches = futsalSessions.flatMap((e) => e.matches ?? []);
    let wins = 0, draws = 0, losses = 0;
    allMatches.forEach((m) => {
      const r = matchResult(m);
      if (r === '승') wins++;
      else if (r === '무') draws++;
      else losses++;
    });

    return { total: futsalSessions.length, totalGoals, totalAssists, training, tournament, friendly, teamCounts, wins, draws, losses };
  }, [futsalSessions]);

  const balletStats = useMemo(() => {
    const studioCounts: Record<string, number> = {};
    balletSessions.forEach((e) => {
      const name = e.customStudio || e.studio;
      studioCounts[name] = (studioCounts[name] || 0) + 1;
    });
    const typeCounts = {
      공연: balletSessions.filter((e) => e.type === '공연').length,
      리허설: balletSessions.filter((e) => e.type === '리허설').length,
      수업: balletSessions.filter((e) => e.type === '수업').length,
    };
    return { total: balletSessions.length, studioCounts, typeCounts };
  }, [balletSessions]);

  return (
    <div className="animate-fade-in-up">
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-center gap-3 mb-5">
          <Avatar size={44} />
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight leading-tight">아이두 기록장</h1>
            <p className="text-xs text-text-tertiary mt-0.5">나의 모든 기록</p>
          </div>
        </div>

        <PeriodSelector
          mode={periodMode}
          label={periodLabel}
          onModeChange={(m) => {
            setPeriodMode(m);
            if (m !== 'all') setPickerOpen(true);
          }}
          onPickerOpen={() => setPickerOpen((v) => !v)}
          pickerSlot={
            <MonthYearPicker
              open={pickerOpen}
              mode={periodMode === 'year' ? 'year' : 'month'}
              year={pYear}
              month={pMonth}
              onClose={() => setPickerOpen(false)}
              onApply={(y, m) => {
                setPYear(y);
                setPMonth(m);
              }}
            />
          }
        />

        <div className="flex bg-[#F2F2F4] rounded-2xl p-1 mb-6 mt-4 gap-1">
          <button
            onClick={() => setTab('futsal')}
            className={`flex-1 py-2.5 rounded-[14px] text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
              tab === 'futsal' ? 'tab-pill-active text-futsal-deep' : 'text-text-tertiary'
            }`}
          >
            <span className="text-base leading-none">⚽</span>
            풋살
          </button>
          <button
            onClick={() => setTab('ballet')}
            className={`flex-1 py-2.5 rounded-[14px] text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
              tab === 'ballet' ? 'tab-pill-active text-ballet' : 'text-text-tertiary'
            }`}
          >
            <span className="text-base leading-none">🩰</span>
            발레
          </button>
        </div>

        {tab === 'futsal' ? (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-5 px-5">
              {(['overview', '대회', '친선경기', '훈련'] as FutsalView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setFutsalView(v)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    futsalView === v
                      ? 'bg-futsal text-white'
                      : 'bg-surface-secondary text-text-secondary'
                  }`}
                >
                  {v === 'overview' ? '전체' : v}
                </button>
              ))}
            </div>

            {futsalSessions.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-text-tertiary">{periodLabel}에 기록이 없어요</p>
              </div>
            ) : futsalView === 'overview' ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <BigStatCard label="총 골" value={futsalStats.totalGoals} accent />
                  <BigStatCard label="어시스트" value={futsalStats.totalAssists} accent />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <StatCard label="훈련" value={String(futsalStats.training)} />
                  <StatCard label="대회" value={String(futsalStats.tournament)} />
                  <StatCard label="친선" value={String(futsalStats.friendly)} />
                </div>

                <div className="bg-surface-secondary rounded-2xl p-4 text-center">
                  <p className="text-xs text-text-tertiary mb-1">총 세션</p>
                  <p className="text-3xl font-bold text-text-primary">{futsalStats.total}</p>
                </div>

                {(futsalStats.wins + futsalStats.draws + futsalStats.losses) > 0 && (
                  <div className="bg-surface-secondary rounded-2xl p-4">
                    <p className="text-xs font-medium text-text-tertiary mb-3">전체 경기 전적</p>
                    <div className="flex items-center justify-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-futsal-deep">{futsalStats.wins}</p>
                        <p className="text-[10px] text-text-tertiary mt-0.5">승</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-text-tertiary">{futsalStats.draws}</p>
                        <p className="text-[10px] text-text-tertiary mt-0.5">무</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-400">{futsalStats.losses}</p>
                        <p className="text-[10px] text-text-tertiary mt-0.5">패</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-surface-secondary rounded-2xl p-4">
                  <p className="text-xs font-medium text-text-tertiary mb-3">팀별 세션</p>
                  <div className="space-y-2">
                    {Object.entries(futsalStats.teamCounts)
                      .sort(([, a], [, b]) => b - a)
                      .map(([team, count]) => (
                        <div key={team} className="flex items-center justify-between">
                          <span className="text-sm text-text-primary">{team}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-white rounded-full overflow-hidden">
                              <div
                                className="h-full bg-futsal rounded-full"
                                style={{ width: `${(count / futsalStats.total) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-text-secondary tabular-nums w-5 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-text-tertiary mb-2">최근 세션</p>
                  <div className="space-y-2">
                    {futsalSessions.slice(0, 5).map((e) => (
                      <FutsalSessionRow key={e.id} e={e} onTap={() => setSelectedEvent(e)} />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <FutsalTypeDetail
                type={futsalView}
                sessions={futsalSessions.filter((s) => s.type === futsalView)}
                onTap={(e) => setSelectedEvent(e)}
              />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {balletSessions.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-text-tertiary">{periodLabel}에 기록이 없어요</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <StatCard label="총 세션" value={String(balletStats.total)} accent="ballet" />
                  <StatCard label="스튜디오" value={String(Object.keys(balletStats.studioCounts).length)} accent="ballet" />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <BalletTypeCard emoji="🎭" label="공연" value={balletStats.typeCounts['공연']} />
                  <BalletTypeCard emoji="🩰" label="리허설" value={balletStats.typeCounts['리허설']} />
                  <BalletTypeCard emoji="✨" label="수업" value={balletStats.typeCounts['수업']} />
                </div>

                <div className="bg-surface-secondary rounded-2xl p-4">
                  <p className="text-xs font-medium text-text-tertiary mb-3">스튜디오별 수업</p>
                  <div className="space-y-2">
                    {Object.entries(balletStats.studioCounts)
                      .sort(([, a], [, b]) => b - a)
                      .map(([studio, count]) => (
                        <div key={studio} className="flex items-center justify-between">
                          <span className="text-sm text-text-primary">{studio}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-white rounded-full overflow-hidden">
                              <div
                                className="h-full bg-ballet rounded-full"
                                style={{ width: `${(count / balletStats.total) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-text-secondary tabular-nums w-5 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-text-tertiary mb-2">최근 수업</p>
                  <div className="space-y-2">
                    {balletSessions.slice(0, 5).map((e) => (
                      <button
                        key={e.id}
                        onClick={() => setSelectedEvent(e)}
                        className="w-full text-left bg-surface-secondary rounded-2xl p-3.5 border-l-[3px] border-l-ballet active:scale-[0.98] transition-transform"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-text-primary">{e.customStudio || e.studio}</p>
                              <span className="text-[10px] text-ballet bg-ballet-light px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <span>{balletTypeEmoji(e.type)}</span>
                                {e.type}
                              </span>
                            </div>
                            <p className="text-xs text-text-secondary mt-0.5">
                              {formatDate(e.date)} · {e.classType} · {conditionEmoji(e.bodyCondition)}
                            </p>
                            {e.memo && (
                              <p className="text-xs text-text-tertiary mt-1.5 line-clamp-1 italic">"{e.memo}"</p>
                            )}
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 ml-2">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}

function PeriodSelector({
  mode,
  label,
  onModeChange,
  onPickerOpen,
  pickerSlot,
}: {
  mode: PeriodMode;
  label: string;
  onModeChange: (m: PeriodMode) => void;
  onPickerOpen: () => void;
  pickerSlot?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex bg-surface-secondary rounded-xl p-1 mb-2">
        {(['all', 'year', 'month'] as PeriodMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === m ? 'bg-white text-text-primary shadow-sm' : 'text-text-tertiary'
            }`}
          >
            {m === 'all' ? '전체' : m === 'year' ? '연도' : '월'}
          </button>
        ))}
      </div>

      {mode !== 'all' && (
        <div className="relative">
          <button
            onClick={onPickerOpen}
            className="w-full flex items-center justify-center gap-2 bg-surface-secondary rounded-xl px-4 py-2.5 active:scale-[0.98] transition-transform"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
            </svg>
            <span className="text-sm font-semibold text-text-primary">{label}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {pickerSlot}
        </div>
      )}
    </div>
  );
}

function FutsalTypeDetail({
  type,
  sessions,
  onTap,
}: {
  type: FutsalType;
  sessions: FutsalSession[];
  onTap: (e: FutsalSession) => void;
}) {
  const totalGoals = sessions.reduce((s, e) => s + e.goals, 0);
  const totalAssists = sessions.reduce((s, e) => s + e.assists, 0);
  const avgGoals = sessions.length ? (totalGoals / sessions.length).toFixed(1) : '0';
  const avgAssists = sessions.length ? (totalAssists / sessions.length).toFixed(1) : '0';

  const allMatches = sessions.flatMap((s) => (s.matches ?? []).map((m) => ({ session: s, match: m })));
  let wins = 0, draws = 0, losses = 0, totalOurScore = 0, totalTheirScore = 0;
  allMatches.forEach(({ match: m }) => {
    const our = matchOurScore(m);
    const their = matchTheirScore(m);
    totalOurScore += our;
    totalTheirScore += their;
    const r = matchResult(m);
    if (r === '승') wins++;
    else if (r === '무') draws++;
    else losses++;
  });

  const teamCounts: Record<string, number> = {};
  sessions.forEach((e) => {
    const name = e.customTeam || e.team;
    teamCounts[name] = (teamCounts[name] || 0) + 1;
  });

  // Opponents breakdown
  const opponentRecord: Record<string, { w: number; d: number; l: number }> = {};
  allMatches.forEach(({ match: m }) => {
    if (!opponentRecord[m.opponent]) opponentRecord[m.opponent] = { w: 0, d: 0, l: 0 };
    const r = matchResult(m);
    if (r === '승') opponentRecord[m.opponent].w++;
    else if (r === '무') opponentRecord[m.opponent].d++;
    else opponentRecord[m.opponent].l++;
  });

  if (sessions.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-text-tertiary">{type} 기록이 없어요</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="bg-gradient-to-br from-futsal-light to-white rounded-2xl p-5 border border-futsal-mid/40">
        <p className="text-xs font-medium text-futsal-deep mb-1 tracking-wide">{type}</p>
        <p className="text-3xl font-bold text-text-primary">
          {sessions.length}<span className="text-base text-text-tertiary font-medium ml-1">회</span>
          {allMatches.length > 0 && (
            <span className="text-sm text-text-tertiary font-medium ml-2">· {allMatches.length}경기</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-secondary rounded-2xl p-4">
          <p className="text-xs text-text-tertiary mb-2">총 골</p>
          <p className="text-2xl font-bold text-futsal-deep">{totalGoals}</p>
          <p className="text-[10px] text-text-tertiary mt-1">평균 {avgGoals}골 / 세션</p>
        </div>
        <div className="bg-surface-secondary rounded-2xl p-4">
          <p className="text-xs text-text-tertiary mb-2">어시스트</p>
          <p className="text-2xl font-bold text-futsal-deep">{totalAssists}</p>
          <p className="text-[10px] text-text-tertiary mt-1">평균 {avgAssists} / 세션</p>
        </div>
      </div>

      {allMatches.length > 0 && (
        <div className="bg-surface-secondary rounded-2xl p-4">
          <p className="text-xs font-medium text-text-tertiary mb-3">경기 전적 ({allMatches.length}경기)</p>
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-futsal-deep">{wins}</p>
              <p className="text-[10px] text-text-tertiary mt-0.5">승</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-text-tertiary">{draws}</p>
              <p className="text-[10px] text-text-tertiary mt-0.5">무</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{losses}</p>
              <p className="text-[10px] text-text-tertiary mt-0.5">패</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-around">
            <div className="text-center">
              <p className="text-xs text-text-tertiary mb-1">득점</p>
              <p className="text-lg font-bold text-text-primary">{totalOurScore}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-text-tertiary mb-1">실점</p>
              <p className="text-lg font-bold text-text-primary">{totalTheirScore}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-text-tertiary mb-1">득실차</p>
              <p className={`text-lg font-bold ${totalOurScore - totalTheirScore >= 0 ? 'text-futsal-deep' : 'text-red-400'}`}>
                {totalOurScore - totalTheirScore > 0 ? '+' : ''}{totalOurScore - totalTheirScore}
              </p>
            </div>
          </div>
        </div>
      )}

      {Object.keys(opponentRecord).length > 0 && (
        <div className="bg-surface-secondary rounded-2xl p-4">
          <p className="text-xs font-medium text-text-tertiary mb-3">상대팀별 전적</p>
          <div className="space-y-2">
            {Object.entries(opponentRecord)
              .sort(([, a], [, b]) => (b.w + b.d + b.l) - (a.w + a.d + a.l))
              .map(([opp, r]) => (
                <div key={opp} className="flex items-center justify-between">
                  <span className="text-sm text-text-primary">{opp}</span>
                  <div className="flex items-center gap-1.5 text-xs font-medium tabular-nums">
                    <span className="text-futsal-deep">{r.w}승</span>
                    <span className="text-text-tertiary">{r.d}무</span>
                    <span className="text-red-400">{r.l}패</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="bg-surface-secondary rounded-2xl p-4">
        <p className="text-xs font-medium text-text-tertiary mb-3">우리 팀별 {type}</p>
        <div className="space-y-2">
          {Object.entries(teamCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([team, count]) => (
              <div key={team} className="flex items-center justify-between">
                <span className="text-sm text-text-primary">{team}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full bg-futsal rounded-full"
                      style={{ width: `${(count / sessions.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-text-secondary tabular-nums w-5 text-right">{count}</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-text-tertiary mb-2">{type} 전체 ({sessions.length})</p>
        <div className="space-y-2">
          {sessions.map((e) => (
            <FutsalSessionRow key={e.id} e={e} onTap={() => onTap(e)} showResult />
          ))}
        </div>
      </div>
    </div>
  );
}

function FutsalSessionRow({
  e,
  onTap,
  showResult = false,
}: {
  e: FutsalSession;
  onTap: () => void;
  showResult?: boolean;
}) {
  const matches = e.matches ?? [];
  let our = 0, their = 0, w = 0, d = 0, l = 0;
  matches.forEach((m) => {
    our += matchOurScore(m);
    their += matchTheirScore(m);
    const r = matchResult(m);
    if (r === '승') w++;
    else if (r === '무') d++;
    else l++;
  });
  const resultBadge = matches.length > 0
    ? matches.length === 1
      ? `${matchResult(matches[0])} ${our}:${their}`
      : `${w}승 ${d}무 ${l}패`
    : null;
  const isWinDominant = w > l;
  const isLossDominant = l > w;
  const resultColor = isWinDominant ? 'text-futsal-deep' : isLossDominant ? 'text-red-400' : 'text-text-tertiary';

  return (
    <button
      onClick={onTap}
      className="w-full text-left bg-surface-secondary rounded-2xl p-3.5 border-l-[3px] border-l-futsal active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-text-primary truncate">{e.customTeam || e.team}</p>
            {showResult && resultBadge && (
              <span className={`text-[10px] font-bold ${resultColor}`}>{resultBadge}</span>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            {formatDate(e.date)} · {e.type} · {e.goals}골 {e.assists}어시
          </p>
          {e.memo && (
            <p className="text-xs text-text-tertiary mt-1.5 line-clamp-1 italic">"{e.memo}"</p>
          )}
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-1">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </button>
  );
}

function BigStatCard({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 ${accent ? 'bg-futsal-light border border-futsal-mid/50' : 'bg-surface-secondary'}`}>
      <p className={`text-xs mb-1.5 ${accent ? 'text-futsal-deep' : 'text-text-tertiary'}`}>{label}</p>
      <p className={`text-3xl font-bold ${accent ? 'text-futsal-deep' : 'text-text-primary'}`}>{value}</p>
    </div>
  );
}

function BalletTypeCard({ emoji, label, value }: { emoji: string; label: string; value: number }) {
  return (
    <div className="bg-surface-secondary rounded-2xl p-3.5 text-center">
      <p className="text-xl leading-none mb-1">{emoji}</p>
      <p className="text-xl font-bold text-ballet tabular-nums">{value}</p>
      <p className="text-[10px] text-text-tertiary mt-0.5">{label}</p>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-surface-secondary rounded-2xl p-3.5 text-center">
      <p className={`text-2xl font-bold ${
        accent === 'futsal' ? 'text-futsal-deep' : accent === 'ballet' ? 'text-ballet' : 'text-text-primary'
      }`}>
        {value}
      </p>
      <p className="text-[10px] text-text-tertiary mt-0.5">{label}</p>
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
