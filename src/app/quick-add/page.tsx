'use client';

import { useState } from 'react';
import { FUTSAL_TEAMS, BALLET_STUDIOS } from '@/data/mock';
import { BALLET_TYPES, BODY_CONDITIONS, conditionEmoji, balletTypeEmoji } from '@/lib/ballet';
import type { FutsalType, FutsalTeam, QuarterResult, BalletType, BodyCondition, FutsalSession, BalletSession } from '@/types';
import Avatar from '@/components/Avatar';
import { useEvents } from '@/lib/events-store';

type Tab = 'futsal' | 'ballet';

const MAX_VIDEO_LINKS = 5;

interface ScorerInput {
  id: string;
  name: string;
  goals: number;
}

interface MatchInput {
  id: string;
  label: string;       // 예선1, 8강 등
  opponent: string;
  finalOur: string;
  finalTheir: string;
  hasPK: boolean;
  pkOur: string;
  pkTheir: string;
  scorers: ScorerInput[];
  myGoals: number;
  myAssists: number;
  videoLink: string;
  quarters: QuarterResult[];
}

function newMatch(withQuarters: boolean, label = '', opponent = '', videoLink = ''): MatchInput {
  return {
    id: Math.random().toString(36).slice(2),
    label,
    opponent,
    finalOur: '',
    finalTheir: '',
    hasPK: false,
    pkOur: '',
    pkTheir: '',
    scorers: [],
    myGoals: 0,
    myAssists: 0,
    videoLink,
    quarters: withQuarters
      ? [{ quarter: 1, our: 0, their: 0 }, { quarter: 2, our: 0, their: 0 }]
      : [],
  };
}

function newScorer(): ScorerInput {
  return { id: Math.random().toString(36).slice(2), name: '', goals: 1 };
}

// ── 붙여넣기 파서 (URL+라운드+상대팀만 파악, 스코어는 다음 단계에서 입력)
// 지원: "예선1 레드문: https://..." / "예선 2 MUTANT : https://..." / "8강 레드문 fc : https://..."
function parseTournamentText(text: string): {
  date: string;
  place: string;
  matches: MatchInput[];
} {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { date: '', place: '', matches: [] };

  const firstLine = lines[0];
  const dateMatch = firstLine.match(/^(\d{2})\.(\d{2})\.(\d{2})/);
  let date = '';
  let place = '';
  if (dateMatch) {
    date = `20${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
    place = firstLine
      .replace(/^\d{2}\.\d{2}\.\d{2}\s*/, '')
      .replace(/\s*경기영상.*$/i, '')
      .trim();
  }

  const matches: MatchInput[] = [];
  for (const line of lines.slice(1)) {
    // URL 시작 위치 탐색 (indexOf 대신 search 사용)
    const httpIdx = line.search(/https?:\/\//);
    if (httpIdx === -1) continue;

    const videoLink = line.slice(httpIdx).trim();
    // URL 앞 텍스트: 공백·콜론 제거
    const beforeUrl = line.slice(0, httpIdx).replace(/[\s:]+$/, '').trim();

    if (!beforeUrl) {
      matches.push(newMatch(false, '', '', videoLink));
      continue;
    }

    // 라운드명 패턴 — 첫 1~2토큰이 라운드명인지 검사
    // e.g. "예선1 레드문" / "예선 2 MUTANT" / "8강 레드문 fc" / "3.4위전 PELTA"
    const tokens = beforeUrl.split(/\s+/);
    let label = '';
    let opponent = beforeUrl;

    const ROUND_RE = /^(예선\d*|8강|16강|4강|준결승|결승|3\.?4위전|3위전|조별리그\d*)$/i;

    if (tokens.length >= 2) {
      // 첫 토큰이 라운드명인지 ("8강", "4강", "결승" 등)
      if (ROUND_RE.test(tokens[0])) {
        label = tokens[0];
        opponent = tokens.slice(1).join(' ');
      }
      // 두 토큰이 합쳐서 라운드명인지 ("예선 2", "조별리그 1" 등)
      else if (tokens.length >= 3 && ROUND_RE.test(tokens[0] + tokens[1])) {
        label = tokens[0] + tokens[1];
        opponent = tokens.slice(2).join(' ');
      }
      // "예선" + 숫자 분리형 ("예선 2 MUTANT")
      else if (/^예선$/.test(tokens[0]) && /^\d+$/.test(tokens[1])) {
        label = tokens[0] + tokens[1]; // "예선2"
        opponent = tokens.slice(2).join(' ');
      }
    }

    matches.push(newMatch(false, label, opponent || beforeUrl, videoLink));
  }

  return { date, place, matches };
}

export default function QuickAddPage() {
  const [tab, setTab] = useState<Tab>('futsal');
  const [saved, setSaved] = useState(false);
  const { addEvent } = useEvents();

  const handleSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="animate-fade-in-up">
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-center gap-3 mb-5">
          <Avatar size={44} />
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">빠른 기록</h1>
        </div>

        <div className="flex bg-[#F2F2F4] rounded-2xl p-1 mb-6 gap-1">
          <button
            onClick={() => setTab('futsal')}
            className={`flex-1 py-2.5 rounded-[14px] text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
              tab === 'futsal' ? 'tab-pill-active text-futsal-deep' : 'text-text-tertiary'
            }`}
          >
            <span className="text-base leading-none">⚽</span>풋살
          </button>
          <button
            onClick={() => setTab('ballet')}
            className={`flex-1 py-2.5 rounded-[14px] text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
              tab === 'ballet' ? 'tab-pill-active text-ballet' : 'text-text-tertiary'
            }`}
          >
            <span className="text-base leading-none">🩰</span>발레
          </button>
        </div>

        {tab === 'futsal'
          ? <FutsalForm onSaved={handleSaved} addEvent={addEvent} />
          : <BalletForm onSaved={handleSaved} addEvent={addEvent} />}
      </div>

      {saved && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-text-primary text-white px-5 py-3 rounded-2xl text-sm font-medium shadow-lg">
            저장되었습니다 ✓
          </div>
        </div>
      )}
    </div>
  );
}

// ── 풋살 폼 ──────────────────────────────────────────────
function FutsalForm({
  onSaved,
  addEvent,
}: {
  onSaved: () => void;
  addEvent: (e: import('@/types').WorkoutEvent) => void;
}) {
  // 디폴트: NOVA 팀, 대회
  const [team, setTeam] = useState<string>('NOVA');
  const [customTeam, setCustomTeam] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [place, setPlace] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState<FutsalType>('대회');
  const [trainingGoals, setTrainingGoals] = useState(0);
  const [trainingAssists, setTrainingAssists] = useState(0);
  const [finalRank, setFinalRank] = useState('');
  const [matches, setMatches] = useState<MatchInput[]>([newMatch(false)]);
  const [videoLinks, setVideoLinks] = useState<string[]>(['']);
  const [memo, setMemo] = useState('');

  // 붙여넣기 모드
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [parseError, setParseError] = useState('');

  const showMatches = type !== '훈련';
  const withQuarters = type === '친선경기';

  const setTypeAndReset = (t: FutsalType) => {
    setType(t);
    if (t === '훈련') setMatches([]);
    else setMatches([newMatch(t === '친선경기')]);
    setPasteMode(false);
  };

  // ── 경기 업데이트 헬퍼들
  const updateMatch = (id: string, patch: Partial<MatchInput>) =>
    setMatches((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const updateScorer = (matchId: string, scorerId: string, patch: Partial<ScorerInput>) =>
    setMatches((prev) =>
      prev.map((m) =>
        m.id !== matchId ? m : {
          ...m,
          scorers: m.scorers.map((s) => s.id === scorerId ? { ...s, ...patch } : s),
        }
      )
    );

  const addScorer = (matchId: string) =>
    setMatches((prev) =>
      prev.map((m) => m.id !== matchId ? m : { ...m, scorers: [...m.scorers, newScorer()] })
    );

  const removeScorer = (matchId: string, scorerId: string) =>
    setMatches((prev) =>
      prev.map((m) => m.id !== matchId ? m : { ...m, scorers: m.scorers.filter((s) => s.id !== scorerId) })
    );

  const updateQuarter = (matchId: string, qIdx: number, field: 'our' | 'their', value: number) =>
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;
        const next = [...m.quarters];
        next[qIdx] = { ...next[qIdx], [field]: value };
        return { ...m, quarters: next };
      })
    );

  const addQuarter = (matchId: string) =>
    setMatches((prev) =>
      prev.map((m) =>
        m.id !== matchId ? m : { ...m, quarters: [...m.quarters, { quarter: m.quarters.length + 1, our: 0, their: 0 }] }
      )
    );

  const removeQuarter = (matchId: string) =>
    setMatches((prev) =>
      prev.map((m) =>
        m.id !== matchId || m.quarters.length <= 1 ? m :
        { ...m, quarters: m.quarters.slice(0, -1).map((q, i) => ({ ...q, quarter: i + 1 })) }
      )
    );

  const addMatch = () => setMatches((prev) => [...prev, newMatch(withQuarters)]);
  const removeMatch = (id: string) => setMatches((prev) => prev.filter((m) => m.id !== id));

  const updateVideoLink = (idx: number, value: string) =>
    setVideoLinks((prev) => prev.map((l, i) => (i === idx ? value : l)));
  const addVideoLink = () => { if (videoLinks.length < MAX_VIDEO_LINKS) setVideoLinks((prev) => [...prev, '']); };
  const removeVideoLink = (idx: number) => setVideoLinks((prev) => prev.filter((_, i) => i !== idx));

  const handleParse = () => {
    setParseError('');
    const parsed = parseTournamentText(pasteText);
    if (!parsed.date && parsed.matches.length === 0) {
      setParseError('형식을 인식하지 못했어요. 예: "26.05.17 대회명 경기영상\n예선1 상대팀: https://..."');
      return;
    }
    if (parsed.date) setDate(parsed.date);
    if (parsed.place) setPlace(parsed.place);
    if (parsed.matches.length > 0) setMatches(parsed.matches);
    setType('대회');
    setPasteMode(false);
    setPasteText('');
  };

  const totalGoals = type === '훈련'
    ? trainingGoals
    : matches.reduce((s, m) => s + m.myGoals, 0);
  const totalAssists = type === '훈련'
    ? trainingAssists
    : matches.reduce((s, m) => s + m.myAssists, 0);

  const handleSave = () => {
    const id = `event-${Date.now()}`;
    const event: FutsalSession = {
      id,
      category: 'futsal',
      team: team as FutsalTeam,
      customTeam: team === '기타' ? customTeam : undefined,
      date,
      place,
      startTime,
      endTime,
      type,
      goals: totalGoals,
      assists: totalAssists,
      finalRank: finalRank ? parseInt(finalRank) : undefined,
      matches: showMatches
        ? matches.map((m) => {
            const ourScore = parseInt(m.finalOur) || 0;
            const theirScore = parseInt(m.finalTheir) || 0;
            // PK가 있으면 finalOur/Their를 PK 결과로 표현
            const pkOur = m.hasPK ? parseInt(m.pkOur) || 0 : undefined;
            const pkTheir = m.hasPK ? parseInt(m.pkTheir) || 0 : undefined;
            return {
              id: m.id,
              label: m.label || undefined,
              opponent: m.opponent,
              finalOur: ourScore,
              finalTheir: theirScore,
              pkOur,
              pkTheir,
              myGoals: m.myGoals,
              myAssists: m.myAssists,
              scorers: m.scorers.filter((s) => s.name.trim()).map((s) => ({ name: s.name, goals: s.goals })),
              videoLink: m.videoLink || undefined,
              quarterResults: withQuarters ? m.quarters : undefined,
            };
          })
        : undefined,
      videoLinks: videoLinks.filter((l) => l.trim()),
      memo: memo || undefined,
    };
    addEvent(event);
    onSaved();
    setTeam('NOVA'); setPlace(''); setMemo(''); setFinalRank('');
    setType('대회'); setMatches([newMatch(false)]); setVideoLinks(['']);
  };

  return (
    <div className="space-y-4">
      {/* 붙여넣기 버튼 */}
      {type === '대회' && !pasteMode && (
        <button
          onClick={() => setPasteMode(true)}
          className="w-full py-2.5 rounded-xl border border-dashed border-futsal text-futsal-deep text-sm font-medium flex items-center justify-center gap-2 hover:bg-futsal-light transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="9" y="2" width="6" height="4" rx="1"/><path d="M8 6H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-2"/>
          </svg>
          📋 대회 텍스트 붙여넣기
        </button>
      )}

      {/* 붙여넣기 파싱 영역 */}
      {pasteMode && (
        <div className="bg-surface-secondary rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-futsal-deep">대회 텍스트 붙여넣기</p>
            <button onClick={() => { setPasteMode(false); setPasteText(''); setParseError(''); }} className="text-xs text-text-tertiary">취소</button>
          </div>
          <p className="text-[10px] text-text-tertiary leading-relaxed">
            날짜·경기 영상 링크만 붙여넣으면 돼요. 스코어는 다음 단계에서 입력해요.
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={"26.05.17 풋투풋 얼티밋컵 경기영상\n\n예선1 레드문: https://youtu.be/...\n예선2 MUTANT: https://youtu.be/...\n8강 레드문 fc: https://youtu.be/..."}
            rows={8}
            className="w-full bg-white rounded-xl px-3 py-2.5 text-xs text-text-primary outline-none border border-border focus:border-futsal-mid placeholder:text-text-tertiary resize-none font-mono leading-relaxed"
          />
          {parseError && <p className="text-[11px] text-red-400">{parseError}</p>}
          <button
            onClick={handleParse}
            disabled={!pasteText.trim()}
            className="w-full py-2.5 bg-futsal text-white rounded-xl text-sm font-semibold disabled:opacity-40 active:scale-95 transition-transform"
          >
            경기 목록 파싱하기
          </button>
        </div>
      )}

      <SelectField label="팀" value={team} onChange={setTeam} options={FUTSAL_TEAMS as unknown as string[]} placeholder="팀 선택" />
      {team === '기타' && <InputField label="팀 이름" value={customTeam} onChange={setCustomTeam} placeholder="팀 이름 입력" />}
      <InputField label="날짜" type="date" value={date} onChange={setDate} />
      <InputField label="장소 / 대회명" value={place} onChange={setPlace} placeholder="장소 또는 대회 이름" />
      <div className="grid grid-cols-2 gap-3">
        <InputField label="시작" type="time" value={startTime} onChange={setStartTime} />
        <InputField label="종료" type="time" value={endTime} onChange={setEndTime} />
      </div>

      {/* 유형: 대회 → 친선 → 훈련 순서 */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">유형</label>
        <div className="flex gap-2">
          {(['대회', '친선경기', '훈련'] as FutsalType[]).map((t) => (
            <button key={t} onClick={() => setTypeAndReset(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                type === t ? 'bg-futsal text-white' : 'bg-surface-secondary text-text-secondary'
              }`}
            >{t}</button>
          ))}
        </div>
      </div>

      {type === '훈련' && (
        <div className="grid grid-cols-2 gap-3">
          <CounterField label="골" value={trainingGoals} onChange={setTrainingGoals} color="futsal" />
          <CounterField label="어시스트" value={trainingAssists} onChange={setTrainingAssists} color="futsal" />
        </div>
      )}

      {type === '대회' && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">최종 순위</label>
          <div className="flex gap-2 flex-wrap">
            {['1', '2', '3', '4', '8'].map((r) => (
              <button key={r} onClick={() => setFinalRank(finalRank === r ? '' : r)}
                className={`flex-1 min-w-[58px] py-2 rounded-xl text-sm font-medium transition-all ${
                  finalRank === r ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-surface-secondary text-text-secondary border border-transparent'
                }`}
              >
                {r === '1' ? '🏆 우승' : r === '2' ? '🥈 준우승' : r === '3' ? '🥉 3위' : `${r}위`}
              </button>
            ))}
            <input type="number" min={1}
              value={!['1','2','3','4','8'].includes(finalRank) ? finalRank : ''}
              onChange={(e) => setFinalRank(e.target.value)}
              placeholder="기타"
              className="w-16 bg-surface-secondary rounded-xl px-2 py-2 text-sm text-center outline-none border border-transparent focus:border-amber-300 placeholder:text-text-tertiary"
            />
          </div>
        </div>
      )}

      {/* 경기 목록 */}
      {showMatches && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-medium text-text-secondary">
              경기 목록 ({matches.length})
            </label>
            <button onClick={addMatch} className="text-xs font-medium text-futsal-deep flex items-center gap-1 active:scale-95 transition-transform">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              경기 추가
            </button>
          </div>

          <div className="space-y-3">
            {matches.map((m, idx) => (
              <MatchCard
                key={m.id}
                match={m}
                idx={idx}
                withQuarters={withQuarters}
                canRemove={matches.length > 1}
                onRemove={() => removeMatch(m.id)}
                onUpdate={(patch) => updateMatch(m.id, patch)}
                onUpdateScorer={(sid, patch) => updateScorer(m.id, sid, patch)}
                onAddScorer={() => addScorer(m.id)}
                onRemoveScorer={(sid) => removeScorer(m.id, sid)}
                onUpdateQuarter={(qIdx, field, val) => updateQuarter(m.id, qIdx, field, val)}
                onAddQuarter={() => addQuarter(m.id)}
                onRemoveQuarter={() => removeQuarter(m.id)}
              />
            ))}
          </div>

          <div className="mt-3 flex items-center justify-center gap-4 bg-futsal-light rounded-xl py-2.5">
            <span className="text-xs text-futsal-deep">총 골 <span className="font-bold">{totalGoals}</span></span>
            <span className="text-text-tertiary">·</span>
            <span className="text-xs text-futsal-deep">어시 <span className="font-bold">{totalAssists}</span></span>
          </div>
        </div>
      )}

      {/* 대표 영상 링크 */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-text-secondary">대표 영상 링크 ({videoLinks.length}/{MAX_VIDEO_LINKS})</label>
          {videoLinks.length < MAX_VIDEO_LINKS && (
            <button onClick={addVideoLink} className="text-xs font-medium text-futsal-deep flex items-center gap-1 active:scale-95 transition-transform">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>추가
            </button>
          )}
        </div>
        <div className="space-y-2">
          {videoLinks.map((link, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input type="text" value={link} onChange={(e) => updateVideoLink(idx, e.target.value)}
                placeholder={`영상 ${idx + 1} URL`}
                className="flex-1 bg-surface-secondary rounded-xl px-3.5 py-3 text-sm text-text-primary outline-none border border-transparent focus:border-border-strong placeholder:text-text-tertiary"
              />
              {videoLinks.length > 1 && (
                <button onClick={() => removeVideoLink(idx)} className="w-9 h-9 rounded-xl bg-surface-secondary text-text-tertiary flex items-center justify-center active:scale-90 transition-transform flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <DiaryMemo value={memo} onChange={setMemo} type={type} />

      <button onClick={handleSave}
        className="w-full py-3.5 bg-futsal text-white font-semibold rounded-2xl text-sm active:scale-[0.98] transition-transform mt-2"
      >
        저장하기
      </button>
    </div>
  );
}

// ── 경기 카드 ─────────────────────────────────────────────
function MatchCard({
  match: m,
  idx,
  withQuarters,
  canRemove,
  onRemove,
  onUpdate,
  onUpdateScorer,
  onAddScorer,
  onRemoveScorer,
  onUpdateQuarter,
  onAddQuarter,
  onRemoveQuarter,
}: {
  match: MatchInput;
  idx: number;
  withQuarters: boolean;
  canRemove: boolean;
  onRemove: () => void;
  onUpdate: (patch: Partial<MatchInput>) => void;
  onUpdateScorer: (id: string, patch: Partial<ScorerInput>) => void;
  onAddScorer: () => void;
  onRemoveScorer: (id: string) => void;
  onUpdateQuarter: (qIdx: number, field: 'our' | 'their', val: number) => void;
  onAddQuarter: () => void;
  onRemoveQuarter: () => void;
}) {
  const our = parseInt(m.finalOur) || 0;
  const their = parseInt(m.finalTheir) || 0;
  const result = m.finalOur !== '' && m.finalTheir !== ''
    ? (m.hasPK
        ? (parseInt(m.pkOur) || 0) > (parseInt(m.pkTheir) || 0) ? '승' : '패'
        : our > their ? '승' : our === their ? '무' : '패')
    : null;
  const resultColor = result === '승' ? 'text-futsal-deep' : result === '패' ? 'text-red-400' : 'text-text-tertiary';

  return (
    <div className="bg-surface-secondary rounded-2xl p-3.5 space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {m.label && (
            <span className="text-[10px] font-bold text-white bg-futsal-deep px-2 py-0.5 rounded-full">
              {m.label}
            </span>
          )}
          {result && (
            <span className={`text-xs font-bold ${resultColor}`}>
              {result} {m.finalOur}:{m.finalTheir}
              {m.hasPK && ` (PK ${m.pkOur}:${m.pkTheir})`}
            </span>
          )}
        </div>
        {canRemove && (
          <button onClick={onRemove} className="text-xs text-text-tertiary">삭제</button>
        )}
      </div>

      {/* 상대팀 */}
      <input type="text" value={m.opponent}
        onChange={(e) => onUpdate({ opponent: e.target.value })}
        placeholder={`경기 ${idx + 1} 상대팀`}
        className="w-full bg-white rounded-xl px-3.5 py-2.5 text-sm text-text-primary outline-none border border-transparent focus:border-futsal-mid placeholder:text-text-tertiary"
      />

      {/* 영상 링크 */}
      {m.videoLink && (
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <input type="text" value={m.videoLink}
            onChange={(e) => onUpdate({ videoLink: e.target.value })}
            className="flex-1 text-xs text-text-secondary outline-none bg-transparent"
          />
        </div>
      )}
      {!m.videoLink && (
        <input type="text" value={m.videoLink}
          onChange={(e) => onUpdate({ videoLink: e.target.value })}
          placeholder="경기 영상 링크 (선택)"
          className="w-full bg-white rounded-xl px-3.5 py-2 text-xs text-text-secondary outline-none border border-transparent focus:border-futsal-mid placeholder:text-text-tertiary"
        />
      )}

      {/* 쿼터 (친선경기) */}
      {withQuarters && (
        <div>
          <p className="text-[10px] text-text-tertiary mb-2">쿼터별 스코어</p>
          <div className="space-y-1.5 mb-2">
            {m.quarters.map((q, qIdx) => (
              <div key={qIdx} className="flex items-center gap-2 bg-white rounded-lg p-2">
                <span className="text-xs text-text-tertiary w-6 text-center">Q{q.quarter}</span>
                <input type="number" min={0} value={q.our}
                  onChange={(e) => onUpdateQuarter(qIdx, 'our', parseInt(e.target.value) || 0)}
                  className="w-12 text-center rounded-md py-1 text-sm font-medium border border-border outline-none focus:border-futsal-mid"
                />
                <span className="text-text-tertiary text-xs">:</span>
                <input type="number" min={0} value={q.their}
                  onChange={(e) => onUpdateQuarter(qIdx, 'their', parseInt(e.target.value) || 0)}
                  className="w-12 text-center rounded-md py-1 text-sm font-medium border border-border outline-none focus:border-futsal-mid"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            <button onClick={onAddQuarter} className="flex-1 py-1.5 text-[11px] font-medium text-futsal-deep bg-futsal-light rounded-lg">+ 쿼터 추가</button>
            {m.quarters.length > 1 && (
              <button onClick={onRemoveQuarter} className="flex-1 py-1.5 text-[11px] font-medium text-text-tertiary bg-white rounded-lg">− 제거</button>
            )}
          </div>
        </div>
      )}

      {/* ── 최종 스코어 */}
      <div>
        <p className="text-[10px] text-text-tertiary mb-1.5 font-medium">최종 스코어</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-futsal-deep">NOVA</span>
            <input type="number" min={0} value={m.finalOur}
              onChange={(e) => onUpdate({ finalOur: e.target.value })}
              placeholder="0"
              className="w-full text-center bg-white rounded-xl py-3 text-xl font-bold border border-futsal-mid/40 outline-none focus:border-futsal-mid"
            />
          </div>
          <span className="text-text-tertiary font-bold text-lg mt-4">:</span>
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-text-tertiary">{m.opponent || '상대'}</span>
            <input type="number" min={0} value={m.finalTheir}
              onChange={(e) => onUpdate({ finalTheir: e.target.value })}
              placeholder="0"
              className="w-full text-center bg-white rounded-xl py-3 text-xl font-bold border border-border outline-none focus:border-futsal-mid"
            />
          </div>
        </div>
      </div>

      {/* ── 승부차기 */}
      <div>
        <button
          onClick={() => onUpdate({ hasPK: !m.hasPK, pkOur: '', pkTheir: '' })}
          className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
            m.hasPK ? 'bg-amber-100 text-amber-800' : 'bg-white text-text-tertiary'
          }`}
        >
          <span className="text-base leading-none">🎯</span>
          승부차기
          {m.hasPK && ' ✓'}
        </button>
        {m.hasPK && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-futsal-deep">NOVA PK</span>
              <input type="number" min={0} value={m.pkOur}
                onChange={(e) => onUpdate({ pkOur: e.target.value })}
                placeholder="0"
                className="w-full text-center bg-white rounded-xl py-2 text-base font-bold border border-amber-200 outline-none focus:border-amber-400"
              />
            </div>
            <span className="text-text-tertiary font-bold mt-4">:</span>
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-medium text-text-tertiary">{m.opponent || '상대'} PK</span>
              <input type="number" min={0} value={m.pkTheir}
                onChange={(e) => onUpdate({ pkTheir: e.target.value })}
                placeholder="0"
                className="w-full text-center bg-white rounded-xl py-2 text-base font-bold border border-amber-200 outline-none focus:border-amber-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── 득점자 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-text-tertiary font-medium">득점자</p>
          <button onClick={onAddScorer} className="text-[11px] text-futsal-deep font-medium flex items-center gap-0.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            득점자 추가
          </button>
        </div>
        {m.scorers.length === 0 && (
          <p className="text-[11px] text-text-tertiary text-center py-1.5">득점자 없음 또는 미입력</p>
        )}
        <div className="space-y-1.5">
          {m.scorers.map((s) => (
            <div key={s.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2">
              <input
                type="text"
                value={s.name}
                onChange={(e) => onUpdateScorer(s.id, { name: e.target.value })}
                placeholder="이름"
                className="flex-1 text-sm outline-none bg-transparent text-text-primary placeholder:text-text-tertiary"
              />
              <div className="flex items-center gap-1.5">
                <button onClick={() => onUpdateScorer(s.id, { goals: Math.max(1, s.goals - 1) })}
                  className="w-6 h-6 rounded-lg bg-futsal-light text-futsal-deep flex items-center justify-center text-sm font-bold"
                >−</button>
                <span className="text-sm font-bold text-futsal-deep w-4 text-center tabular-nums">{s.goals}</span>
                <button onClick={() => onUpdateScorer(s.id, { goals: s.goals + 1 })}
                  className="w-6 h-6 rounded-lg bg-futsal-light text-futsal-deep flex items-center justify-center text-sm font-bold"
                >+</button>
                <span className="text-[10px] text-text-tertiary ml-0.5">골</span>
              </div>
              <button onClick={() => onRemoveScorer(s.id)} className="text-text-tertiary ml-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── 아이두 기록 (골 + 어시) */}
      <div>
        <p className="text-[10px] text-text-tertiary font-medium mb-2">내 기록 (아이두)</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-xl px-2 py-2">
            <p className="text-[10px] text-text-tertiary mb-1 text-center">⚽ 골</p>
            <div className="flex items-center justify-between">
              <StepBtn onClick={() => onUpdate({ myGoals: Math.max(0, m.myGoals - 1) })} icon="minus" color="futsal" />
              <span className="text-base font-bold text-text-primary tabular-nums">{m.myGoals}</span>
              <StepBtn onClick={() => onUpdate({ myGoals: m.myGoals + 1 })} icon="plus" color="futsal" />
            </div>
          </div>
          <div className="bg-white rounded-xl px-2 py-2">
            <p className="text-[10px] text-text-tertiary mb-1 text-center">🅰️ 어시스트</p>
            <div className="flex items-center justify-between">
              <StepBtn onClick={() => onUpdate({ myAssists: Math.max(0, m.myAssists - 1) })} icon="minus" color="futsal" />
              <span className="text-base font-bold text-text-primary tabular-nums">{m.myAssists}</span>
              <StepBtn onClick={() => onUpdate({ myAssists: m.myAssists + 1 })} icon="plus" color="futsal" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 발레 폼 ──────────────────────────────────────────────
function BalletForm({
  onSaved,
  addEvent,
}: {
  onSaved: () => void;
  addEvent: (e: import('@/types').WorkoutEvent) => void;
}) {
  const [studio, setStudio] = useState('');
  const [customStudio, setCustomStudio] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [place, setPlace] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [balletType, setBalletType] = useState<BalletType>('수업');
  const [classType, setClassType] = useState('');
  const [bodyCondition, setBodyCondition] = useState<BodyCondition | ''>('');
  const [difficulty, setDifficulty] = useState(3);
  const [memo, setMemo] = useState('');

  const handleSave = () => {
    const id = `ballet-${Date.now()}`;
    const event: BalletSession = {
      id,
      category: 'ballet',
      studio: studio as import('@/types').BalletStudio,
      customStudio: studio === '기타' ? customStudio : undefined,
      date,
      place,
      startTime,
      endTime,
      type: balletType,
      classType,
      bodyCondition: (bodyCondition || '보통') as BodyCondition,
      difficulty,
      memo: memo || undefined,
    };
    addEvent(event);
    onSaved();
    setStudio(''); setPlace(''); setMemo(''); setClassType('');
  };

  return (
    <div className="space-y-4">
      <SelectField label="스튜디오" value={studio} onChange={setStudio} options={BALLET_STUDIOS as unknown as string[]} placeholder="스튜디오 선택" />
      {studio === '기타' && <InputField label="스튜디오 이름" value={customStudio} onChange={setCustomStudio} placeholder="스튜디오 이름 입력" />}
      <InputField label="날짜" type="date" value={date} onChange={setDate} />
      <InputField label="장소" value={place} onChange={setPlace} placeholder="장소 입력" />
      <div className="grid grid-cols-2 gap-3">
        <InputField label="시작" type="time" value={startTime} onChange={setStartTime} />
        <InputField label="종료" type="time" value={endTime} onChange={setEndTime} />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">유형</label>
        <div className="flex gap-2">
          {BALLET_TYPES.map((t) => (
            <button key={t} onClick={() => setBalletType(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                balletType === t ? 'bg-ballet text-white' : 'bg-surface-secondary text-text-secondary'
              }`}
            >
              <span className="text-base leading-none">{balletTypeEmoji(t)}</span>{t}
            </button>
          ))}
        </div>
      </div>
      <InputField label="수업 유형" value={classType} onChange={setClassType} placeholder="바리에이션, 기초, 포인트 등" />
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">컨디션</label>
        <div className="flex gap-2">
          {BODY_CONDITIONS.map((c) => (
            <button key={c} onClick={() => setBodyCondition(c)}
              className={`flex-1 py-3 rounded-xl text-2xl transition-all flex flex-col items-center gap-0.5 ${
                bodyCondition === c ? 'bg-ballet-light border-2 border-ballet scale-105' : 'bg-surface-secondary border-2 border-transparent grayscale opacity-60'
              }`}
            >
              <span className="leading-none">{conditionEmoji(c)}</span>
              <span className={`text-[9px] font-medium ${bodyCondition === c ? 'text-ballet' : 'text-text-tertiary'}`}>{c}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">난이도</label>
        <div className="flex gap-1">
          {[1,2,3,4,5].map((s) => (
            <button key={s} onClick={() => setDifficulty(s)}
              className={`text-2xl transition-transform active:scale-90 ${s <= difficulty ? 'text-ballet' : 'text-gray-200'}`}
            >★</button>
          ))}
        </div>
      </div>
      <DiaryMemo value={memo} onChange={setMemo} />
      <button onClick={handleSave}
        className="w-full py-3.5 bg-ballet text-white font-semibold rounded-2xl text-sm active:scale-[0.98] transition-transform mt-2"
      >
        저장하기
      </button>
    </div>
  );
}

// ── 공용 컴포넌트 ──────────────────────────────────────────

function StepBtn({ onClick, icon, color }: { onClick: () => void; icon: 'plus' | 'minus'; color: string }) {
  return (
    <button onClick={onClick} className={`w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-transform ${
      color === 'futsal' ? 'bg-futsal-light text-futsal-deep' : 'bg-ballet-light text-ballet'
    }`}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        {icon === 'minus'
          ? <line x1="5" y1="12" x2="19" y2="12"/>
          : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}
      </svg>
    </button>
  );
}

function DiaryMemo({ value, onChange, type }: { value: string; onChange: (v: string) => void; type?: FutsalType }) {
  const placeholder =
    type === '대회' ? '오늘 대회 어땠어? 기억에 남는 순간을 적어보자'
    : type === '친선경기' ? '경기 흐름이나 느낀 점을 짧게 남겨보자'
    : type === '훈련' ? '훈련 중 컨디션, 새로 배운 점, 다음에 보완할 부분'
    : '오늘 어땠어? 느낀 점을 적어보자';
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        <label className="text-xs font-medium text-amber-700">오늘의 메모</label>
      </div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4}
        className="w-full bg-gradient-to-br from-amber-50 to-white rounded-xl px-3.5 py-3 text-sm text-text-primary outline-none border border-amber-100 focus:border-amber-300 placeholder:text-text-tertiary resize-none leading-relaxed"
      />
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-surface-secondary rounded-xl px-3.5 py-3 text-sm text-text-primary outline-none border border-transparent focus:border-border-strong placeholder:text-text-tertiary"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-surface-secondary rounded-xl px-3.5 py-3 text-sm outline-none border border-transparent focus:border-border-strong appearance-none ${value ? 'text-text-primary' : 'text-text-tertiary'}`}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function CounterField({ label, value, onChange, color }: {
  label: string; value: number; onChange: (v: number) => void; color: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1.5">{label}</label>
      <div className="flex items-center justify-between bg-surface-secondary rounded-xl px-3 py-2">
        <StepBtn onClick={() => onChange(Math.max(0, value - 1))} icon="minus" color={color} />
        <span className="text-xl font-bold text-text-primary tabular-nums">{value}</span>
        <StepBtn onClick={() => onChange(value + 1)} icon="plus" color={color} />
      </div>
    </div>
  );
}
