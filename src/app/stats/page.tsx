'use client';

import { useMemo, useState } from 'react';
import { useEvents } from '@/lib/events-store';
import type { FutsalSession, MatchResult, MatchScorer, WorkoutEvent } from '@/types';
import Avatar from '@/components/Avatar';
import EditEventSheet from '@/components/EditEventSheet';

function isFutsal(e: { category: string }): e is FutsalSession {
  return e.category === 'futsal';
}

function matchOur(m: MatchResult) {
  return m.finalOur ?? m.quarterResults?.reduce((s, q) => s + q.our, 0) ?? 0;
}
function matchTheir(m: MatchResult) {
  return m.finalTheir ?? m.quarterResults?.reduce((s, q) => s + q.their, 0) ?? 0;
}

type Tab = 'nova' | 'me';
type FutsalKind = '대회' | '친선경기';

interface MatchPoint {
  date: string;
  matchId: string;
  opponent: string;
  our: number;
  their: number;
  diff: number;
  result: '승' | '무' | '패';
  myGoals: number;
  myAssists: number;
  type: FutsalKind;
  sessionId: string;
  finalRank?: number;
  sessionPlace: string;
  videoLinks?: string[];
  videoLink?: string;
  scorers?: MatchScorer[];
}

interface TournamentInfo {
  sessionId: string;
  date: string;
  finalRank?: number;
  place: string;
  matches: MatchPoint[];
}

export default function StatsPage() {
  const { events } = useEvents();
  const [tab, setTab] = useState<Tab>('nova');
  const [editingEvent, setEditingEvent] = useState<WorkoutEvent | null>(null);

  const novaMatches: MatchPoint[] = useMemo(
    () => collectMatches(events, (s) => s.team === 'NOVA'),
    [events]
  );
  const myMatches: MatchPoint[] = useMemo(() => collectMatches(events, () => true), [events]);

  const handleEditSession = (sessionId: string) => {
    const found = events.find((e) => e.id === sessionId) ?? null;
    setEditingEvent(found);
  };

  return (
    <div className="animate-fade-in-up">
      <div className="px-5 pt-14 pb-6">
        <div className="flex items-center gap-3 mb-5">
          <Avatar size={44} />
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight leading-tight">성장 그래프</h1>
            <p className="text-xs text-text-tertiary mt-0.5">아이두의 기록들</p>
          </div>
        </div>

        {/* Main tabs */}
        <div className="flex bg-[#F2F2F4] rounded-2xl p-1 mb-6 gap-1">
          <button
            onClick={() => setTab('nova')}
            className={`flex-1 py-2.5 rounded-[14px] transition-all duration-200 flex items-center justify-center ${
              tab === 'nova' ? 'tab-pill-active' : 'opacity-35'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/nova-logo.png"
              alt="NOVA"
              className="object-contain w-auto"
              style={{ height: '17px' }}
            />
          </button>
          <button
            onClick={() => setTab('me')}
            className={`flex-1 py-2.5 rounded-[14px] text-sm font-bold tracking-tight transition-all duration-200 flex items-center justify-center ${
              tab === 'me' ? 'tab-pill-active text-text-primary' : 'text-text-tertiary'
            }`}
          >
            아이두
          </button>
        </div>

        {tab === 'nova' ? (
          <NovaView matches={novaMatches} onEditSession={handleEditSession} />
        ) : (
          <MeView matches={myMatches} onEditSession={handleEditSession} />
        )}
      </div>

      {/* Edit sheet overlay */}
      {editingEvent && (
        <div className="fixed inset-0 z-[100] animate-fade-in">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEditingEvent(null)} />
          <div className="absolute bottom-0 left-0 right-0 max-w-lg mx-auto max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-t-3xl px-6 pt-3 pb-8 safe-bottom animate-slide-up">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              <EditEventSheet
                event={editingEvent}
                onClose={() => setEditingEvent(null)}
                onSaved={() => setEditingEvent(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function collectMatches(events: import('@/types').WorkoutEvent[], filter: (s: FutsalSession) => boolean): MatchPoint[] {
  const out: MatchPoint[] = [];
  events
    .filter(isFutsal)
    .filter((s) => (s.type === '대회' || s.type === '친선경기') && filter(s))
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((s) => {
      s.matches?.forEach((m) => {
        const our = matchOur(m);
        const their = matchTheir(m);
        out.push({
          date: s.date,
          matchId: m.id,
          opponent: m.opponent,
          our,
          their,
          diff: our - their,
          result: our > their ? '승' : our === their ? '무' : '패',
          myGoals: m.myGoals,
          myAssists: m.myAssists,
          type: s.type as FutsalKind,
          sessionId: s.id,
          finalRank: s.finalRank,
          sessionPlace: s.place,
          videoLinks: s.videoLinks,
          videoLink: m.videoLink,
          scorers: m.scorers,
        });
      });
    });
  return out;
}

// ─────────────────────────────────────── NOVA

function NovaView({ matches, onEditSession }: { matches: MatchPoint[]; onEditSession: (id: string) => void }) {
  const [kind, setKind] = useState<FutsalKind>('대회');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // 연도 목록 (중복 제거, 내림차순)
  const years = useMemo(() => {
    const s = new Set(matches.map((m) => new Date(m.date + 'T00:00:00').getFullYear()));
    return Array.from(s).sort((a, b) => b - a);
  }, [matches]);

  const filtered = matches
    .filter((m) => m.type === kind)
    .filter((m) => selectedYear === null || new Date(m.date + 'T00:00:00').getFullYear() === selectedYear);

  // kind / year 바뀌면 선택 초기화
  const handleKindChange = (k: FutsalKind) => { setKind(k); setSelectedSessionId(null); };
  const handleYearChange = (y: number | null) => { setSelectedYear(y); setSelectedSessionId(null); };

  const wins = filtered.filter((m) => m.result === '승').length;
  const draws = filtered.filter((m) => m.result === '무').length;
  const losses = filtered.filter((m) => m.result === '패').length;
  const winRate = filtered.length ? Math.round((wins / filtered.length) * 100) : 0;
  const totalFor = filtered.reduce((s, m) => s + m.our, 0);
  const totalAgainst = filtered.reduce((s, m) => s + m.their, 0);

  // 선택된 대회의 경기만 Performance에 표시 (없으면 전체)
  const performanceMatches = selectedSessionId
    ? filtered.filter((m) => m.sessionId === selectedSessionId)
    : filtered;

  const tournaments: TournamentInfo[] = useMemo(() => {
    const map = new Map<string, TournamentInfo>();
    matches
      .filter((m) => m.type === '대회')
      .forEach((m) => {
        if (!map.has(m.sessionId)) {
          map.set(m.sessionId, {
            sessionId: m.sessionId,
            date: m.date,
            finalRank: m.finalRank,
            place: m.sessionPlace,
            matches: [],
          });
        }
        map.get(m.sessionId)!.matches.push(m);
      });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [matches]);

  // Performance 카드 제목 + 영상 링크
  const selectedMatch = selectedSessionId ? filtered.find((m) => m.sessionId === selectedSessionId) : null;
  const perfTitle = selectedMatch?.sessionPlace ?? 'Performance';
  const sessionVideoLinks = selectedMatch?.videoLinks ?? [];

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {(['대회', '친선경기'] as FutsalKind[]).map((k) => (
          <button
            key={k}
            onClick={() => handleKindChange(k)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              kind === k
                ? 'bg-nova text-white shadow-sm'
                : 'bg-surface-secondary text-text-secondary'
            }`}
          >
            {k === '친선경기' ? '친선' : k}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-surface-secondary rounded-2xl">
          <p className="text-sm text-text-tertiary">NOVA의 {kind} 기록이 없어요</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-4 gap-2">
            <MiniStat label="승률" value={`${winRate}%`} color="nova" />
            <MiniStat label="승" value={String(wins)} color="futsal" />
            <MiniStat label="무" value={String(draws)} />
            <MiniStat label="패" value={String(losses)} color="red" />
          </div>

          {/* Goal Tracker + Performance — 데스크탑 2열 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <ChartCard
              title="노바 대회 기록"
              subtitle={`득점 ${totalFor} · 실점 ${totalAgainst}`}
              headerRight={
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleYearChange(null)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                      selectedYear === null ? 'bg-nova text-white' : 'bg-surface-secondary text-text-tertiary hover:bg-gray-200'
                    }`}
                  >
                    전체
                  </button>
                  {years.map((y) => (
                    <button
                      key={y}
                      onClick={() => handleYearChange(y)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                        selectedYear === y ? 'bg-nova text-white' : 'bg-surface-secondary text-text-tertiary hover:bg-gray-200'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              }
            >
              <HorizontalGoalsChart
                matches={filtered}
                kind={kind}
                selectedSessionId={selectedSessionId}
                onSelect={(id) => setSelectedSessionId(id === selectedSessionId ? null : id)}
              />
            </ChartCard>

            <ChartCard
              title={perfTitle}
              subtitle={selectedSessionId ? '경기 목록 · 탭해서 수정' : '전체 경기'}
              headerRight={
                selectedSessionId ? (
                  <button
                    onClick={() => setSelectedSessionId(null)}
                    className="text-[10px] text-text-tertiary bg-surface-secondary px-2 py-1 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    전체 보기
                  </button>
                ) : undefined
              }
            >
              <PerformanceList matches={performanceMatches} onEdit={onEditSession} />
            </ChartCard>
          </div>

          {/* Tournament rank — only 대회 */}
          {kind === '대회' && tournaments.length > 0 && (
            <RankChartCard tournaments={tournaments} />
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────── 아이두

function MeView({ matches, onEditSession: _onEditSession }: { matches: MatchPoint[]; onEditSession: (id: string) => void }) {
  const tour = matches.filter((m) => m.type === '대회');
  const friend = matches.filter((m) => m.type === '친선경기');

  const tourWins = tour.filter((m) => m.result === '승').length;
  const tourDraws = tour.filter((m) => m.result === '무').length;
  const tourLosses = tour.filter((m) => m.result === '패').length;
  const tourRate = tour.length ? Math.round((tourWins / tour.length) * 100) : 0;

  const friendWins = friend.filter((m) => m.result === '승').length;
  const friendDraws = friend.filter((m) => m.result === '무').length;
  const friendLosses = friend.filter((m) => m.result === '패').length;
  const friendRate = friend.length ? Math.round((friendWins / friend.length) * 100) : 0;

  const tourG = tour.reduce((s, m) => s + m.myGoals, 0);
  const tourA = tour.reduce((s, m) => s + m.myAssists, 0);
  const friendG = friend.reduce((s, m) => s + m.myGoals, 0);
  const friendA = friend.reduce((s, m) => s + m.myAssists, 0);

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* 대회 stats */}
      <div className="bg-amber-50 rounded-2xl p-4">
        <p className="text-xs font-semibold text-amber-700 mb-3">대회</p>
        <div className="grid grid-cols-4 gap-2">
          <MiniStat label="승률" value={`${tourRate}%`} color="amber" />
          <MiniStat label="승" value={String(tourWins)} color="futsal" />
          <MiniStat label="무" value={String(tourDraws)} />
          <MiniStat label="패" value={String(tourLosses)} color="red" />
        </div>
      </div>

      {/* 친선 stats */}
      <div className="bg-futsal-light rounded-2xl p-4">
        <p className="text-xs font-semibold text-futsal-deep mb-3">친선</p>
        <div className="grid grid-cols-4 gap-2">
          <MiniStat label="승률" value={`${friendRate}%`} color="futsal" />
          <MiniStat label="승" value={String(friendWins)} color="futsal" />
          <MiniStat label="무" value={String(friendDraws)} />
          <MiniStat label="패" value={String(friendLosses)} color="red" />
        </div>
      </div>

      {/* Goal Tracker 대회 + 친선 — 데스크탑 2열 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Goal Tracker · 대회" subtitle={`골 ${tourG} · 어시 ${tourA}`}>
          <CumulativeAttackChart matches={tour} accent="#D97706" lightAccent="#FCD34D" />
        </ChartCard>

        <ChartCard title="Goal Tracker · 친선" subtitle={`골 ${friendG} · 어시 ${friendA}`}>
          <CumulativeAttackChart matches={friend} accent="#65A30D" lightAccent="#BEF264" />
        </ChartCard>
      </div>
    </div>
  );
}

// ─────────────────────────────────────── Horizontal Goals Chart (대회/친선 리스트)

interface SessionRow {
  sessionId: string;
  label: string;
  date: string;
  totalOur: number;
  totalTheir: number;
  finalRank?: number;
}

function groupBySession(matches: MatchPoint[]): SessionRow[] {
  const map = new Map<string, SessionRow>();
  matches.forEach((m) => {
    if (!map.has(m.sessionId)) {
      map.set(m.sessionId, {
        sessionId: m.sessionId,
        label: m.sessionPlace,
        date: m.date,
        totalOur: 0,
        totalTheir: 0,
        finalRank: m.finalRank,
      });
    }
    const row = map.get(m.sessionId)!;
    row.totalOur += m.our;
    row.totalTheir += m.their;
  });
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function HorizontalGoalsChart({
  matches,
  kind,
  selectedSessionId,
  onSelect,
}: {
  matches: MatchPoint[];
  kind: FutsalKind;
  selectedSessionId: string | null;
  onSelect: (id: string) => void;
}) {
  if (matches.length === 0)
    return <p className="text-xs text-text-tertiary text-center py-6">기록이 없어요</p>;

  // 대회: 세션별 묶음 / 친선: 개별 경기
  const rows: SessionRow[] =
    kind === '대회'
      ? groupBySession(matches)
      : matches.map((m) => ({
          sessionId: m.sessionId,
          label: `vs ${m.opponent}`,
          date: m.date,
          totalOur: m.our,
          totalTheir: m.their,
        }));

  const maxGoals = Math.max(1, ...rows.map((r) => Math.max(r.totalOur, r.totalTheir)));

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const isSelected = selectedSessionId === row.sessionId;
        const ourPct = (row.totalOur / maxGoals) * 100;
        const theirPct = (row.totalTheir / maxGoals) * 100;
        const result =
          row.totalOur > row.totalTheir ? '승' : row.totalOur < row.totalTheir ? '패' : '무';
        const resultColor =
          result === '승' ? 'text-futsal-deep' : result === '패' ? 'text-red-400' : 'text-gray-400';

        // 대회: 최종순위 표시 / 친선: 승무패 표시
        const rankLabel =
          kind === '대회' && row.finalRank != null
            ? `${row.finalRank}위`
            : kind === '대회'
            ? ''
            : result;
        const rankColor =
          kind === '대회' && row.finalRank != null
            ? row.finalRank === 1
              ? 'text-amber-500'
              : row.finalRank <= 3
              ? 'text-purple-500'
              : 'text-text-tertiary'
            : resultColor;

        return (
          <button
            key={row.sessionId}
            onClick={() => onSelect(row.sessionId)}
            className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 ${
              isSelected
                ? 'bg-nova/10 ring-1 ring-nova/40'
                : 'bg-white hover:bg-gray-50 active:scale-[0.99]'
            }`}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-primary truncate max-w-[70%]">
                {row.label}
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {rankLabel && (
                  <span className={`text-[11px] font-bold ${rankColor}`}>{rankLabel}</span>
                )}
                <span className="text-[10px] text-text-tertiary">{formatDotDate(row.date)}</span>
              </div>
            </div>

            {/* 득점 바 */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-futsal-deep w-4 text-right tabular-nums">
                {row.totalOur}
              </span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-futsal rounded-full transition-all duration-300"
                  style={{ width: `${ourPct}%` }}
                />
              </div>
              <span className="text-[10px] text-text-tertiary w-6">득점</span>
            </div>

            {/* 실점 바 */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-red-400 w-4 text-right tabular-nums">
                {row.totalTheir}
              </span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-300 rounded-full transition-all duration-300"
                  style={{ width: `${theirPct}%` }}
                />
              </div>
              <span className="text-[10px] text-text-tertiary w-6">실점</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────── shared components

function MiniStat({ label, value, color }: { label: string; value: string; color?: 'nova' | 'futsal' | 'red' | 'amber' }) {
  const valueColor =
    color === 'nova'
      ? 'text-nova'
      : color === 'futsal'
      ? 'text-futsal-deep'
      : color === 'amber'
      ? 'text-amber-600'
      : color === 'red'
      ? 'text-red-400'
      : 'text-text-primary';
  return (
    <div className="bg-white rounded-xl py-3 text-center shadow-sm">
      <p className={`text-2xl font-bold tabular-nums leading-none ${valueColor}`}>{value}</p>
      <p className="text-[11px] text-text-tertiary mt-1.5 font-medium">{label}</p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  headerRight,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  return (
    <div className="bg-surface-secondary rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-text-primary">{title}</p>
          {subtitle && <p className="text-[10px] text-text-tertiary mt-0.5">{subtitle}</p>}
        </div>
        {headerRight}
      </div>
      {children}
    </div>
  );
}

function formatShort(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDotDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

function formatYear(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').getFullYear();
}

// ─────────────────────────────────────── Performance list

function PerformanceList({ matches, onEdit }: { matches: MatchPoint[]; onEdit?: (sessionId: string) => void }) {
  if (matches.length === 0)
    return <p className="text-xs text-text-tertiary text-center py-6">기록이 없어요</p>;

  const wins = matches.filter((m) => m.result === '승').length;
  const draws = matches.filter((m) => m.result === '무').length;
  const losses = matches.filter((m) => m.result === '패').length;

  return (
    <div>
      {/* Summary bar */}
      <div className="flex gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-futsal inline-block" />
          <span className="text-xs font-semibold text-futsal-deep">{wins}승</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />
          <span className="text-xs font-semibold text-text-secondary">{draws}무</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
          <span className="text-xs font-semibold text-red-400">{losses}패</span>
        </div>
        <div className="flex-1" />
        <span className="text-[10px] text-text-tertiary self-center">{matches.length}경기</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100 mb-4">
        <div className="bg-futsal transition-all" style={{ width: `${(wins / matches.length) * 100}%` }} />
        <div className="bg-gray-300 transition-all" style={{ width: `${(draws / matches.length) * 100}%` }} />
        <div className="bg-red-400 transition-all" style={{ width: `${(losses / matches.length) * 100}%` }} />
      </div>

      {/* Match list */}
      <div className="space-y-2">
        {matches.map((m, i) => {
          const bg =
            m.result === '승'
              ? 'bg-futsal text-white'
              : m.result === '무'
              ? 'bg-gray-200 text-text-secondary'
              : 'bg-red-400 text-white';
          const scoreTint =
            m.result === '승'
              ? 'text-futsal-deep'
              : m.result === '패'
              ? 'text-red-400'
              : 'text-text-secondary';
          return (
            <div key={i} className="flex items-center bg-white rounded-xl px-3 py-2.5 gap-3 active:scale-[0.99] transition-transform">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${bg}`}>
                {m.result}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">vs {m.opponent}</p>
                {m.scorers && m.scorers.length > 0 ? (
                  <p className="text-[10px] text-text-tertiary mt-0.5 truncate">
                    ⚽ {m.scorers.map((s) => `${s.name}${s.goals > 1 ? ` (${s.goals})` : ''}`).join(' · ')}
                  </p>
                ) : (
                  <p className="text-[10px] text-text-tertiary mt-0.5">{formatShort(m.date)}</p>
                )}
                {m.videoLink && (
                  <a
                    href={m.videoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 mt-1 text-[10px] text-red-500 hover:text-red-600 transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3 3 0 00.5 6.2 31 31 0 000 12a31 31 0 00.5 5.8 3 3 0 002.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 002.1-2.1A31 31 0 0024 12a31 31 0 00-.5-5.8z"/>
                      <polygon fill="white" points="9.8 15.2 15.8 12 9.8 8.8 9.8 15.2"/>
                    </svg>
                    경기 영상
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-base font-bold tabular-nums ${scoreTint}`}>
                  {m.our} : {m.their}
                </span>
                {onEdit && (
                  <button
                    onClick={() => onEdit(m.sessionId)}
                    className="w-7 h-7 rounded-lg bg-surface-secondary flex items-center justify-center active:scale-90 transition-transform"
                    title="수정하기"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────── Goal Tracker bar chart

function NovaGoalsChart({ matches }: { matches: MatchPoint[] }) {
  if (matches.length === 0) return <p className="text-xs text-text-tertiary text-center py-6">기록이 없어요</p>;

  const maxVal = Math.max(2, ...matches.flatMap((m) => [m.our, m.their]));
  const w = 320;
  const h = 150;
  const padTop = 14;
  const padBottom = 38;
  const innerH = h - padTop - padBottom;
  const colW = w / matches.length;
  const barW = Math.max(5, Math.min(11, colW * 0.34));

  return (
    <div className="overflow-x-auto hide-scrollbar -mx-1 px-1">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ minWidth: matches.length * 32 }}>
        <line x1={0} x2={w} y1={padTop + innerH} y2={padTop + innerH} stroke="#E5E7EB" strokeWidth={1} />
        {matches.map((m, i) => {
          const cx = colW * i + colW / 2;
          const oH = (m.our / maxVal) * innerH;
          const tH = (m.their / maxVal) * innerH;
          return (
            <g key={i}>
              <rect x={cx - barW - 1} y={padTop + innerH - oH} width={barW} height={Math.max(1, oH)} rx={2} fill="#84CC16" />
              <rect x={cx + 1} y={padTop + innerH - tH} width={barW} height={Math.max(1, tH)} rx={2} fill="#FCA5A5" />
              <text x={cx - barW / 2 - 1} y={padTop + innerH - oH - 3} textAnchor="middle" fontSize={8} fontWeight={600} fill="#65A30D">
                {m.our > 0 ? m.our : ''}
              </text>
              <text x={cx + barW / 2 + 1} y={padTop + innerH - tH - 3} textAnchor="middle" fontSize={8} fontWeight={600} fill="#DC2626">
                {m.their > 0 ? m.their : ''}
              </text>
              <text x={cx} y={h - 20} textAnchor="middle" fontSize={8} fill="#9CA3AF">
                {formatShort(m.date)}
              </text>
              <text x={cx} y={h - 8} textAnchor="middle" fontSize={7} fill="#C4C9D4">
                {m.opponent.length > 5 ? m.opponent.slice(0, 4) + '…' : m.opponent}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center justify-center gap-4 mt-1">
        <Legend color="#84CC16" label="득점" />
        <Legend color="#FCA5A5" label="실점" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────── Rank chart card (대회 only)

function RankChartCard({ tournaments }: { tournaments: TournamentInfo[] }) {
  const years = useMemo(() => {
    const s = new Set(tournaments.map((t) => formatYear(t.date)));
    return Array.from(s).sort((a, b) => b - a);
  }, [tournaments]);

  const [selectedYear, setSelectedYear] = useState<number>(years[0] ?? new Date().getFullYear());

  const filtered = tournaments.filter((t) => formatYear(t.date) === selectedYear);

  return (
    <div className="bg-surface-secondary rounded-2xl p-4">
      {/* header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-text-primary">대회 최종 순위</p>
        <div className="flex items-center gap-1">
          {/* Calendar icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
          </svg>
          <div className="flex gap-1 ml-1">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                  selectedYear === y
                    ? 'bg-nova text-white'
                    : 'bg-white text-text-tertiary'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>
      <RankChart tournaments={filtered} />
    </div>
  );
}

function RankChart({ tournaments }: { tournaments: TournamentInfo[] }) {
  const ranks = tournaments.filter((t) => t.finalRank != null);
  if (ranks.length === 0)
    return <p className="text-xs text-text-tertiary text-center py-6">순위 기록이 없어요</p>;

  const worst = Math.max(8, ...ranks.map((t) => t.finalRank!));
  const w = 320;
  const h = 160;
  const padTop = 18;
  const padBottom = 42;
  const innerH = h - padTop - padBottom;
  const colW = w / ranks.length;

  const yAt = (rank: number) => padTop + ((rank - 1) / Math.max(1, worst - 1)) * innerH;

  const path = ranks
    .map((t, i) => `${i === 0 ? 'M' : 'L'} ${colW * i + colW / 2} ${yAt(t.finalRank!)}`)
    .join(' ');

  const medal = (r: number) => (r === 1 ? '🏆' : r === 2 ? '🥈' : r === 3 ? '🥉' : '');

  return (
    <div className="overflow-x-auto hide-scrollbar -mx-1 px-1">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ minWidth: ranks.length * 70 }}>
        {/* podium highlight zone */}
        <rect x={0} y={yAt(1) - 6} width={w} height={yAt(3) - yAt(1) + 12} fill="#FEF3C7" opacity={0.5} rx={4} />

        <path d={path} fill="none" stroke="#FF00C8" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {ranks.map((t, i) => {
          const cx = colW * i + colW / 2;
          const y = yAt(t.finalRank!);
          const shortPlace = t.place.length > 6 ? t.place.slice(0, 5) + '…' : t.place;
          return (
            <g key={t.sessionId}>
              <circle cx={cx} cy={y} r={5} fill="#FF00C8" stroke="white" strokeWidth={2} />
              {medal(t.finalRank!) && (
                <text x={cx} y={y - 10} textAnchor="middle" fontSize={12}>
                  {medal(t.finalRank!)}
                </text>
              )}
              <text x={cx} y={y + 16} textAnchor="middle" fontSize={11} fontWeight={700} fill="#9333EA">
                {t.finalRank}위
              </text>
              {/* date */}
              <text x={cx} y={h - 20} textAnchor="middle" fontSize={8} fill="#9CA3AF">
                {formatShort(t.date)}
              </text>
              {/* place name */}
              <text x={cx} y={h - 8} textAnchor="middle" fontSize={7.5} fill="#C4C9D4">
                {shortPlace}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────── Cumulative attack chart

function CumulativeAttackChart({
  matches,
  accent,
  lightAccent,
}: {
  matches: MatchPoint[];
  accent: string;
  lightAccent: string;
}) {
  if (matches.length === 0) {
    return <p className="text-xs text-text-tertiary text-center py-8">아직 기록이 없어요</p>;
  }
  let g = 0, a = 0;
  const series = matches.map((m) => {
    g += m.myGoals;
    a += m.myAssists;
    return { ...m, totalG: g, totalA: a };
  });
  const finalTotal = series[series.length - 1];
  const max = Math.max(2, finalTotal.totalG + finalTotal.totalA);

  const w = 320;
  const h = 140;
  const padX = 16;
  const padTop = 14;
  const padBottom = 28;
  const innerW = w - padX * 2;
  const innerH = h - padTop - padBottom;

  const xAt = (i: number) => (series.length === 1 ? w / 2 : padX + (i / (series.length - 1)) * innerW);
  const yAt = (v: number) => padTop + innerH - (v / max) * innerH;

  const goalsPath = series.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(p.totalG)}`).join(' ');
  const assistsPath = series.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(p.totalA)}`).join(' ');
  const totalPath = series.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(p.totalG + p.totalA)}`).join(' ');

  const gradId = `grad-${accent.replace('#', '')}`;

  return (
    <div className="overflow-x-auto hide-scrollbar -mx-1 px-1">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ minWidth: series.length * 30 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.3" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((p) => (
          <line key={p} x1={padX} x2={w - padX} y1={padTop + innerH * (1 - p)} y2={padTop + innerH * (1 - p)} stroke="#F0F0F0" strokeWidth={1} />
        ))}
        <path
          d={`${totalPath} L ${xAt(series.length - 1)} ${padTop + innerH} L ${xAt(0)} ${padTop + innerH} Z`}
          fill={`url(#${gradId})`}
        />
        <path d={totalPath} fill="none" stroke={accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <path d={goalsPath} fill="none" stroke={accent} strokeWidth={1.5} strokeOpacity={0.6} strokeDasharray="3 3" strokeLinecap="round" />
        <path d={assistsPath} fill="none" stroke={lightAccent} strokeWidth={1.5} strokeDasharray="3 3" strokeLinecap="round" />

        {series.map((p, i) => (
          <g key={i}>
            <circle cx={xAt(i)} cy={yAt(p.totalG + p.totalA)} r={3} fill={accent} stroke="white" strokeWidth={1.5} />
            <text x={xAt(i)} y={h - 8} textAnchor="middle" fontSize={8} fill="#9CA3AF">
              {formatShort(p.date)}
            </text>
          </g>
        ))}
        <text
          x={xAt(series.length - 1) - 6}
          y={yAt(finalTotal.totalG + finalTotal.totalA) - 8}
          textAnchor="end"
          fontSize={10}
          fontWeight={700}
          fill={accent}
        >
          P {finalTotal.totalG + finalTotal.totalA}
        </text>
      </svg>
      <div className="flex items-center justify-center gap-4 mt-1">
        <Legend color={accent} label="총 포인트" />
        <Legend color={accent} label="누적 골" dashed opacity={0.6} />
        <Legend color={lightAccent} label="누적 어시" dashed />
      </div>
    </div>
  );
}

function Legend({ color, label, dashed = false, opacity = 1 }: { color: string; label: string; dashed?: boolean; opacity?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-3 h-0.5 rounded-full"
        style={{
          backgroundColor: dashed ? 'transparent' : color,
          borderTop: dashed ? `2px dashed ${color}` : undefined,
          opacity,
        }}
      />
      <span className="text-[10px] text-text-secondary">{label}</span>
    </div>
  );
}
