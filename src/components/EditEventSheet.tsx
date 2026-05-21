'use client';

import { useState, useEffect } from 'react';
import { FUTSAL_TEAMS, BALLET_STUDIOS } from '@/data/mock';
import { BALLET_TYPES, BODY_CONDITIONS, conditionEmoji, balletTypeEmoji } from '@/lib/ballet';
import { useEvents } from '@/lib/events-store';
import type {
  WorkoutEvent, FutsalSession, BalletSession,
  FutsalType, FutsalTeam, BalletType, BodyCondition, QuarterResult,
} from '@/types';

// ── 공통 인터페이스 ─────────────────────────────────────────
export interface ScorerInput {
  id: string;
  name: string;
  goals: number;
}

export interface MatchInput {
  id: string;
  label: string;
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

function newScorer(): ScorerInput {
  return { id: Math.random().toString(36).slice(2), name: '', goals: 1 };
}

// ── FutsalSession → MatchInput 변환 ────────────────────────
function sessionToMatchInputs(session: FutsalSession): MatchInput[] {
  return (session.matches ?? []).map((m) => ({
    id: m.id,
    label: m.label ?? '',
    opponent: m.opponent,
    finalOur: m.finalOur !== undefined ? String(m.finalOur) : '',
    finalTheir: m.finalTheir !== undefined ? String(m.finalTheir) : '',
    hasPK: !!(m.pkOur !== undefined || m.pkTheir !== undefined),
    pkOur: m.pkOur !== undefined ? String(m.pkOur) : '',
    pkTheir: m.pkTheir !== undefined ? String(m.pkTheir) : '',
    scorers: (m.scorers ?? []).map((s) => ({
      id: Math.random().toString(36).slice(2),
      name: s.name,
      goals: s.goals,
    })),
    myGoals: m.myGoals,
    myAssists: m.myAssists,
    videoLink: m.videoLink ?? '',
    quarters: m.quarterResults ?? [],
  }));
}

// ── EditEventSheet ──────────────────────────────────────────
interface Props {
  event: WorkoutEvent;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditEventSheet({ event, onClose, onSaved }: Props) {
  const { updateEvent } = useEvents();

  if (event.category === 'futsal') {
    return (
      <EditFutsalForm
        session={event as FutsalSession}
        onClose={onClose}
        onSave={(updated) => { updateEvent(updated); onSaved(); }}
      />
    );
  }
  return (
    <EditBalletForm
      session={event as BalletSession}
      onClose={onClose}
      onSave={(updated) => { updateEvent(updated); onSaved(); }}
    />
  );
}

// ── 풋살 수정 폼 ────────────────────────────────────────────
function EditFutsalForm({
  session,
  onClose,
  onSave,
}: {
  session: FutsalSession;
  onClose: () => void;
  onSave: (e: FutsalSession) => void;
}) {
  const [team, setTeam] = useState<string>(session.customTeam ? '기타' : session.team);
  const [customTeam, setCustomTeam] = useState(session.customTeam ?? '');
  const [date, setDate] = useState(session.date);
  const [place, setPlace] = useState(session.place);
  const [startTime, setStartTime] = useState(session.startTime);
  const [endTime, setEndTime] = useState(session.endTime);
  const [type, setType] = useState<FutsalType>(session.type);
  const [finalRank, setFinalRank] = useState(session.finalRank ? String(session.finalRank) : '');
  const [matches, setMatches] = useState<MatchInput[]>(sessionToMatchInputs(session));
  const [memo, setMemo] = useState(session.memo ?? '');

  const withQuarters = type === '친선경기';

  const updateMatch = (id: string, patch: Partial<MatchInput>) =>
    setMatches((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const updateScorer = (matchId: string, scorerId: string, patch: Partial<ScorerInput>) =>
    setMatches((prev) =>
      prev.map((m) =>
        m.id !== matchId ? m : { ...m, scorers: m.scorers.map((s) => s.id === scorerId ? { ...s, ...patch } : s) }
      )
    );
  const addScorer = (matchId: string) =>
    setMatches((prev) => prev.map((m) => m.id !== matchId ? m : { ...m, scorers: [...m.scorers, newScorer()] }));
  const removeScorer = (matchId: string, scorerId: string) =>
    setMatches((prev) => prev.map((m) => m.id !== matchId ? m : { ...m, scorers: m.scorers.filter((s) => s.id !== scorerId) }));

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
      prev.map((m) => m.id !== matchId ? m : {
        ...m, quarters: [...m.quarters, { quarter: m.quarters.length + 1, our: 0, their: 0 }]
      })
    );
  const removeQuarter = (matchId: string) =>
    setMatches((prev) =>
      prev.map((m) =>
        m.id !== matchId || m.quarters.length <= 1 ? m :
        { ...m, quarters: m.quarters.slice(0, -1).map((q, i) => ({ ...q, quarter: i + 1 })) }
      )
    );
  const addMatch = () =>
    setMatches((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), label: '', opponent: '', finalOur: '', finalTheir: '', hasPK: false, pkOur: '', pkTheir: '', scorers: [], myGoals: 0, myAssists: 0, videoLink: '', quarters: [] },
    ]);
  const removeMatch = (id: string) => setMatches((prev) => prev.filter((m) => m.id !== id));

  const totalGoals = matches.reduce((s, m) => s + m.myGoals, 0);
  const totalAssists = matches.reduce((s, m) => s + m.myAssists, 0);

  const handleSave = () => {
    const updated: FutsalSession = {
      ...session,
      team: team as FutsalTeam,
      customTeam: team === '기타' ? customTeam : undefined,
      date,
      place,
      startTime,
      endTime,
      type,
      goals: type === '훈련' ? session.goals : totalGoals,
      assists: type === '훈련' ? session.assists : totalAssists,
      finalRank: finalRank ? parseInt(finalRank) : undefined,
      matches: matches.map((m) => ({
        id: m.id,
        label: m.label || undefined,
        opponent: m.opponent,
        finalOur: parseInt(m.finalOur) || 0,
        finalTheir: parseInt(m.finalTheir) || 0,
        pkOur: m.hasPK ? (parseInt(m.pkOur) || 0) : undefined,
        pkTheir: m.hasPK ? (parseInt(m.pkTheir) || 0) : undefined,
        myGoals: m.myGoals,
        myAssists: m.myAssists,
        scorers: m.scorers.filter((s) => s.name.trim()).map((s) => ({ name: s.name, goals: s.goals })),
        videoLink: m.videoLink || undefined,
        quarterResults: withQuarters && m.quarters.length > 0 ? m.quarters : undefined,
      })),
      memo: memo || undefined,
    };
    onSave(updated);
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between sticky top-0 bg-white pt-1 pb-3 border-b border-border">
        <button onClick={onClose} className="text-sm text-text-tertiary">취소</button>
        <p className="text-sm font-bold text-text-primary">풋살 기록 수정</p>
        <button onClick={handleSave} className="text-sm font-bold text-futsal-deep">저장</button>
      </div>

      <SelectField label="팀" value={team} onChange={setTeam} options={FUTSAL_TEAMS as unknown as string[]} placeholder="팀 선택" />
      {team === '기타' && <InputField label="팀 이름" value={customTeam} onChange={setCustomTeam} />}
      <InputField label="날짜" type="date" value={date} onChange={setDate} />
      <InputField label="장소 / 대회명" value={place} onChange={setPlace} placeholder="장소 또는 대회 이름" />
      <div className="grid grid-cols-2 gap-3">
        <InputField label="시작" type="time" value={startTime} onChange={setStartTime} />
        <InputField label="종료" type="time" value={endTime} onChange={setEndTime} />
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">유형</label>
        <div className="flex gap-2">
          {(['대회', '친선경기', '훈련'] as FutsalType[]).map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${type === t ? 'bg-futsal text-white' : 'bg-surface-secondary text-text-secondary'}`}
            >{t}</button>
          ))}
        </div>
      </div>

      {type === '대회' && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">최종 순위</label>
          <div className="flex gap-2 flex-wrap">
            {['1', '2', '3', '4', '8'].map((r) => (
              <button key={r} onClick={() => setFinalRank(finalRank === r ? '' : r)}
                className={`flex-1 min-w-[52px] py-2 rounded-xl text-xs font-medium transition-all ${finalRank === r ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-surface-secondary text-text-secondary'}`}
              >
                {r === '1' ? '🏆 우승' : r === '2' ? '🥈 준' : r === '3' ? '🥉 3위' : `${r}위`}
              </button>
            ))}
            <input type="number" min={1}
              value={!['1','2','3','4','8'].includes(finalRank) ? finalRank : ''}
              onChange={(e) => setFinalRank(e.target.value)}
              placeholder="기타"
              className="w-14 bg-surface-secondary rounded-xl px-2 py-2 text-sm text-center outline-none border border-transparent focus:border-amber-300 placeholder:text-text-tertiary"
            />
          </div>
        </div>
      )}

      {/* 경기 목록 */}
      {type !== '훈련' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-text-secondary">경기 ({matches.length})</label>
            <button onClick={addMatch} className="text-xs text-futsal-deep font-medium flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>경기 추가
            </button>
          </div>
          <div className="space-y-3">
            {matches.map((m, idx) => (
              <EditMatchCard
                key={m.id}
                match={m}
                idx={idx}
                withQuarters={withQuarters}
                canRemove={matches.length > 1}
                onRemove={() => removeMatch(m.id)}
                onUpdate={(p) => updateMatch(m.id, p)}
                onUpdateScorer={(sid, p) => updateScorer(m.id, sid, p)}
                onAddScorer={() => addScorer(m.id)}
                onRemoveScorer={(sid) => removeScorer(m.id, sid)}
                onUpdateQuarter={(qi, f, v) => updateQuarter(m.id, qi, f, v)}
                onAddQuarter={() => addQuarter(m.id)}
                onRemoveQuarter={() => removeQuarter(m.id)}
              />
            ))}
          </div>
          {matches.length > 0 && (
            <div className="mt-3 flex items-center justify-center gap-4 bg-futsal-light rounded-xl py-2.5">
              <span className="text-xs text-futsal-deep">총 골 <span className="font-bold">{totalGoals}</span></span>
              <span className="text-text-tertiary">·</span>
              <span className="text-xs text-futsal-deep">어시 <span className="font-bold">{totalAssists}</span></span>
            </div>
          )}
        </div>
      )}

      {/* 메모 */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          <label className="text-xs font-medium text-amber-700">메모</label>
        </div>
        <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3}
          placeholder="오늘 경기 메모..."
          className="w-full bg-gradient-to-br from-amber-50 to-white rounded-xl px-3.5 py-3 text-sm outline-none border border-amber-100 focus:border-amber-300 placeholder:text-text-tertiary resize-none leading-relaxed"
        />
      </div>

      <button onClick={handleSave}
        className="w-full py-3.5 bg-futsal text-white font-semibold rounded-2xl text-sm active:scale-[0.98] transition-transform"
      >
        저장하기
      </button>
    </div>
  );
}

// ── 발레 수정 폼 ────────────────────────────────────────────
function EditBalletForm({
  session,
  onClose,
  onSave,
}: {
  session: BalletSession;
  onClose: () => void;
  onSave: (e: BalletSession) => void;
}) {
  const [studio, setStudio] = useState<string>(session.customStudio ? '기타' : session.studio);
  const [customStudio, setCustomStudio] = useState(session.customStudio ?? '');
  const [date, setDate] = useState(session.date);
  const [place, setPlace] = useState(session.place);
  const [startTime, setStartTime] = useState(session.startTime);
  const [endTime, setEndTime] = useState(session.endTime);
  const [balletType, setBalletType] = useState<BalletType>(session.type);
  const [classType, setClassType] = useState(session.classType);
  const [bodyCondition, setBodyCondition] = useState<BodyCondition>(session.bodyCondition);
  const [difficulty, setDifficulty] = useState(session.difficulty);
  const [memo, setMemo] = useState(session.memo ?? '');

  const handleSave = () => {
    onSave({
      ...session,
      studio: studio as import('@/types').BalletStudio,
      customStudio: studio === '기타' ? customStudio : undefined,
      date, place, startTime, endTime,
      type: balletType, classType, bodyCondition, difficulty,
      memo: memo || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between sticky top-0 bg-white pt-1 pb-3 border-b border-border">
        <button onClick={onClose} className="text-sm text-text-tertiary">취소</button>
        <p className="text-sm font-bold text-text-primary">발레 기록 수정</p>
        <button onClick={handleSave} className="text-sm font-bold text-ballet">저장</button>
      </div>

      <SelectField label="스튜디오" value={studio} onChange={setStudio} options={BALLET_STUDIOS as unknown as string[]} placeholder="스튜디오" />
      {studio === '기타' && <InputField label="스튜디오 이름" value={customStudio} onChange={setCustomStudio} />}
      <InputField label="날짜" type="date" value={date} onChange={setDate} />
      <InputField label="장소" value={place} onChange={setPlace} />
      <div className="grid grid-cols-2 gap-3">
        <InputField label="시작" type="time" value={startTime} onChange={setStartTime} />
        <InputField label="종료" type="time" value={endTime} onChange={setEndTime} />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">유형</label>
        <div className="flex gap-2">
          {BALLET_TYPES.map((t) => (
            <button key={t} onClick={() => setBalletType(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1 ${balletType === t ? 'bg-ballet text-white' : 'bg-surface-secondary text-text-secondary'}`}
            >
              <span>{balletTypeEmoji(t)}</span>{t}
            </button>
          ))}
        </div>
      </div>
      <InputField label="수업 유형" value={classType} onChange={setClassType} placeholder="바리에이션, 기초..." />
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">컨디션</label>
        <div className="flex gap-2">
          {BODY_CONDITIONS.map((c) => (
            <button key={c} onClick={() => setBodyCondition(c)}
              className={`flex-1 py-3 rounded-xl text-xl transition-all flex flex-col items-center gap-0.5 ${bodyCondition === c ? 'bg-ballet-light border-2 border-ballet scale-105' : 'bg-surface-secondary border-2 border-transparent grayscale opacity-60'}`}
            >
              <span>{conditionEmoji(c)}</span>
              <span className={`text-[9px] font-medium ${bodyCondition === c ? 'text-ballet' : 'text-text-tertiary'}`}>{c}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">난이도</label>
        <div className="flex gap-1">
          {[1,2,3,4,5].map((s) => (
            <button key={s} onClick={() => setDifficulty(s)} className={`text-2xl transition-transform active:scale-90 ${s <= difficulty ? 'text-ballet' : 'text-gray-200'}`}>★</button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-amber-700 mb-2 block">메모</label>
        <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3}
          className="w-full bg-gradient-to-br from-amber-50 to-white rounded-xl px-3.5 py-3 text-sm outline-none border border-amber-100 focus:border-amber-300 placeholder:text-text-tertiary resize-none"
        />
      </div>
      <button onClick={handleSave}
        className="w-full py-3.5 bg-ballet text-white font-semibold rounded-2xl text-sm active:scale-[0.98] transition-transform"
      >
        저장하기
      </button>
    </div>
  );
}

// ── 경기 카드 (수정용) ──────────────────────────────────────
function EditMatchCard({
  match: m, idx, withQuarters, canRemove,
  onRemove, onUpdate, onUpdateScorer, onAddScorer, onRemoveScorer,
  onUpdateQuarter, onAddQuarter, onRemoveQuarter,
}: {
  match: MatchInput; idx: number; withQuarters: boolean; canRemove: boolean;
  onRemove: () => void; onUpdate: (p: Partial<MatchInput>) => void;
  onUpdateScorer: (id: string, p: Partial<ScorerInput>) => void;
  onAddScorer: () => void; onRemoveScorer: (id: string) => void;
  onUpdateQuarter: (qi: number, f: 'our'|'their', v: number) => void;
  onAddQuarter: () => void; onRemoveQuarter: () => void;
}) {
  const our = parseInt(m.finalOur) || 0;
  const their = parseInt(m.finalTheir) || 0;
  const result = m.finalOur !== '' && m.finalTheir !== ''
    ? (m.hasPK ? ((parseInt(m.pkOur)||0) > (parseInt(m.pkTheir)||0) ? '승' : '패') : our > their ? '승' : our === their ? '무' : '패')
    : null;
  const resultColor = result === '승' ? 'text-futsal-deep' : result === '패' ? 'text-red-400' : 'text-text-tertiary';

  return (
    <div className="bg-surface-secondary rounded-2xl p-3.5 space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {m.label && <span className="text-[10px] font-bold text-white bg-futsal-deep px-2 py-0.5 rounded-full">{m.label}</span>}
          {!m.label && <span className="text-xs font-semibold text-futsal-deep">경기 {idx + 1}</span>}
          {result && <span className={`text-xs font-bold ${resultColor}`}>{result} {m.finalOur}:{m.finalTheir}{m.hasPK ? ` (PK ${m.pkOur}:${m.pkTheir})` : ''}</span>}
        </div>
        {canRemove && <button onClick={onRemove} className="text-xs text-text-tertiary">삭제</button>}
      </div>

      {/* 라운드 라벨 + 상대팀 */}
      <div className="grid grid-cols-3 gap-2">
        <input type="text" value={m.label} onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="라운드" className="bg-white rounded-xl px-3 py-2.5 text-sm outline-none border border-transparent focus:border-futsal-mid placeholder:text-text-tertiary" />
        <input type="text" value={m.opponent} onChange={(e) => onUpdate({ opponent: e.target.value })}
          placeholder="상대팀" className="col-span-2 bg-white rounded-xl px-3 py-2.5 text-sm outline-none border border-transparent focus:border-futsal-mid placeholder:text-text-tertiary" />
      </div>

      {/* 영상 링크 */}
      <input type="text" value={m.videoLink} onChange={(e) => onUpdate({ videoLink: e.target.value })}
        placeholder="영상 링크 (https://youtu.be/...)"
        className="w-full bg-white rounded-xl px-3 py-2 text-xs text-text-secondary outline-none border border-transparent focus:border-futsal-mid placeholder:text-text-tertiary" />

      {/* 쿼터 */}
      {withQuarters && (
        <div>
          <p className="text-[10px] text-text-tertiary mb-1.5">쿼터</p>
          <div className="space-y-1.5 mb-1.5">
            {m.quarters.map((q, qi) => (
              <div key={qi} className="flex items-center gap-2 bg-white rounded-lg p-2">
                <span className="text-xs text-text-tertiary w-6">Q{q.quarter}</span>
                <input type="number" min={0} value={q.our} onChange={(e) => onUpdateQuarter(qi, 'our', parseInt(e.target.value)||0)}
                  className="w-12 text-center rounded-md py-1 text-sm font-medium border border-border outline-none" />
                <span className="text-text-tertiary text-xs">:</span>
                <input type="number" min={0} value={q.their} onChange={(e) => onUpdateQuarter(qi, 'their', parseInt(e.target.value)||0)}
                  className="w-12 text-center rounded-md py-1 text-sm font-medium border border-border outline-none" />
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            <button onClick={onAddQuarter} className="flex-1 py-1.5 text-[11px] text-futsal-deep bg-futsal-light rounded-lg">+ 쿼터</button>
            {m.quarters.length > 1 && <button onClick={onRemoveQuarter} className="flex-1 py-1.5 text-[11px] text-text-tertiary bg-white rounded-lg">− 제거</button>}
          </div>
        </div>
      )}

      {/* 최종 스코어 */}
      <div>
        <p className="text-[10px] text-text-tertiary mb-1.5">최종 스코어</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-futsal-deep">NOVA</span>
            <input type="number" min={0} value={m.finalOur} onChange={(e) => onUpdate({ finalOur: e.target.value })}
              placeholder="0" className="w-full text-center bg-white rounded-xl py-2.5 text-xl font-bold border border-futsal-mid/40 outline-none focus:border-futsal-mid" />
          </div>
          <span className="text-text-tertiary font-bold text-lg mt-4">:</span>
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-text-tertiary">{m.opponent || '상대'}</span>
            <input type="number" min={0} value={m.finalTheir} onChange={(e) => onUpdate({ finalTheir: e.target.value })}
              placeholder="0" className="w-full text-center bg-white rounded-xl py-2.5 text-xl font-bold border border-border outline-none focus:border-futsal-mid" />
          </div>
        </div>
      </div>

      {/* 승부차기 */}
      <div>
        <button onClick={() => onUpdate({ hasPK: !m.hasPK, pkOur: '', pkTheir: '' })}
          className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${m.hasPK ? 'bg-amber-100 text-amber-800' : 'bg-white text-text-tertiary'}`}>
          🎯 승부차기{m.hasPK ? ' ✓' : ''}
        </button>
        {m.hasPK && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-futsal-deep">NOVA PK</span>
              <input type="number" min={0} value={m.pkOur} onChange={(e) => onUpdate({ pkOur: e.target.value })}
                placeholder="0" className="w-full text-center bg-white rounded-xl py-2 text-base font-bold border border-amber-200 outline-none" />
            </div>
            <span className="text-text-tertiary font-bold mt-4">:</span>
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-text-tertiary">{m.opponent || '상대'} PK</span>
              <input type="number" min={0} value={m.pkTheir} onChange={(e) => onUpdate({ pkTheir: e.target.value })}
                placeholder="0" className="w-full text-center bg-white rounded-xl py-2 text-base font-bold border border-amber-200 outline-none" />
            </div>
          </div>
        )}
      </div>

      {/* 득점자 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-text-tertiary font-medium">득점자</p>
          <button onClick={onAddScorer} className="text-[11px] text-futsal-deep font-medium flex items-center gap-0.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>득점자 추가
          </button>
        </div>
        {m.scorers.length === 0 && <p className="text-[11px] text-text-tertiary text-center py-1">득점자 없음</p>}
        <div className="space-y-1.5">
          {m.scorers.map((s) => (
            <div key={s.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2">
              <input type="text" value={s.name} onChange={(e) => onUpdateScorer(s.id, { name: e.target.value })}
                placeholder="이름" className="flex-1 text-sm outline-none bg-transparent placeholder:text-text-tertiary" />
              <button onClick={() => onUpdateScorer(s.id, { goals: Math.max(1, s.goals - 1) })} className="w-6 h-6 rounded-lg bg-futsal-light text-futsal-deep text-sm font-bold flex items-center justify-center">−</button>
              <span className="text-sm font-bold text-futsal-deep w-4 text-center">{s.goals}</span>
              <button onClick={() => onUpdateScorer(s.id, { goals: s.goals + 1 })} className="w-6 h-6 rounded-lg bg-futsal-light text-futsal-deep text-sm font-bold flex items-center justify-center">+</button>
              <span className="text-[10px] text-text-tertiary">골</span>
              <button onClick={() => onRemoveScorer(s.id)} className="text-text-tertiary ml-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 아이두 기록 */}
      <div>
        <p className="text-[10px] text-text-tertiary font-medium mb-2">내 기록 (아이두)</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-xl px-2 py-2">
            <p className="text-[10px] text-text-tertiary mb-1 text-center">⚽ 골</p>
            <div className="flex items-center justify-between">
              <StepBtn onClick={() => onUpdate({ myGoals: Math.max(0, m.myGoals - 1) })} icon="minus" />
              <span className="text-base font-bold tabular-nums">{m.myGoals}</span>
              <StepBtn onClick={() => onUpdate({ myGoals: m.myGoals + 1 })} icon="plus" />
            </div>
          </div>
          <div className="bg-white rounded-xl px-2 py-2">
            <p className="text-[10px] text-text-tertiary mb-1 text-center">🅰️ 어시</p>
            <div className="flex items-center justify-between">
              <StepBtn onClick={() => onUpdate({ myAssists: Math.max(0, m.myAssists - 1) })} icon="minus" />
              <span className="text-base font-bold tabular-nums">{m.myAssists}</span>
              <StepBtn onClick={() => onUpdate({ myAssists: m.myAssists + 1 })} icon="plus" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 공용 UI 컴포넌트 ────────────────────────────────────────
function StepBtn({ onClick, icon }: { onClick: () => void; icon: 'plus' | 'minus' }) {
  return (
    <button onClick={onClick} className="w-7 h-7 rounded-lg bg-futsal-light text-futsal-deep flex items-center justify-center active:scale-90 transition-transform">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        {icon === 'minus' ? <line x1="5" y1="12" x2="19" y2="12"/> : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}
      </svg>
    </button>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-surface-secondary rounded-xl px-3.5 py-3 text-sm outline-none border border-transparent focus:border-border-strong placeholder:text-text-tertiary" />
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
        className={`w-full bg-surface-secondary rounded-xl px-3.5 py-3 text-sm outline-none border border-transparent focus:border-border-strong appearance-none ${value ? 'text-text-primary' : 'text-text-tertiary'}`}>
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
