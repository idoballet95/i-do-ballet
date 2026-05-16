'use client';

import { useState } from 'react';
import { FUTSAL_TEAMS, BALLET_STUDIOS } from '@/data/mock';
import { BALLET_TYPES, BODY_CONDITIONS, conditionEmoji, balletTypeEmoji } from '@/lib/ballet';
import type { FutsalType, QuarterResult, BalletType, BodyCondition } from '@/types';
import Avatar from '@/components/Avatar';

type Tab = 'futsal' | 'ballet';

const MAX_VIDEO_LINKS = 5;

interface MatchInput {
  id: string;
  opponent: string;
  finalOur: string;
  finalTheir: string;
  myGoals: number;
  myAssists: number;
  quarters: QuarterResult[]; // only used for 친선경기
}

function newMatch(withQuarters: boolean): MatchInput {
  return {
    id: Math.random().toString(36).slice(2),
    opponent: '',
    finalOur: '',
    finalTheir: '',
    myGoals: 0,
    myAssists: 0,
    quarters: withQuarters
      ? [
          { quarter: 1, our: 0, their: 0 },
          { quarter: 2, our: 0, their: 0 },
        ]
      : [],
  };
}

export default function QuickAddPage() {
  const [tab, setTab] = useState<Tab>('futsal');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

        {tab === 'futsal' ? <FutsalForm onSave={handleSave} /> : <BalletForm onSave={handleSave} />}
      </div>

      {saved && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-text-primary text-white px-5 py-3 rounded-2xl text-sm font-medium shadow-lg">
            저장되었습니다
          </div>
        </div>
      )}
    </div>
  );
}

function FutsalForm({ onSave }: { onSave: () => void }) {
  const [team, setTeam] = useState('');
  const [customTeam, setCustomTeam] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [place, setPlace] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState<FutsalType>('훈련');
  const [trainingGoals, setTrainingGoals] = useState(0);
  const [trainingAssists, setTrainingAssists] = useState(0);
  const [finalRank, setFinalRank] = useState('');
  const [matches, setMatches] = useState<MatchInput[]>([newMatch(false)]);
  const [videoLinks, setVideoLinks] = useState<string[]>(['']);
  const [memo, setMemo] = useState('');

  const showMatches = type !== '훈련';
  const withQuarters = type === '친선경기';

  // When type changes, rebuild matches accordingly
  const setTypeAndResetMatches = (t: FutsalType) => {
    setType(t);
    if (t === '훈련') {
      setMatches([]);
    } else {
      const wq = t === '친선경기';
      setMatches([newMatch(wq)]);
    }
  };

  const updateMatch = (id: string, patch: Partial<MatchInput>) => {
    setMatches((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const updateQuarter = (matchId: string, qIdx: number, field: 'our' | 'their', value: number) => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;
        const next = [...m.quarters];
        next[qIdx] = { ...next[qIdx], [field]: value };
        return { ...m, quarters: next };
      })
    );
  };

  const addQuarter = (matchId: string) => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;
        return { ...m, quarters: [...m.quarters, { quarter: m.quarters.length + 1, our: 0, their: 0 }] };
      })
    );
  };

  const removeQuarter = (matchId: string) => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId || m.quarters.length <= 1) return m;
        return { ...m, quarters: m.quarters.slice(0, -1).map((q, i) => ({ ...q, quarter: i + 1 })) };
      })
    );
  };

  const addMatch = () => setMatches((prev) => [...prev, newMatch(withQuarters)]);
  const removeMatch = (id: string) => setMatches((prev) => prev.filter((m) => m.id !== id));

  // Video links
  const updateVideoLink = (idx: number, value: string) => {
    setVideoLinks((prev) => prev.map((l, i) => (i === idx ? value : l)));
  };
  const addVideoLink = () => {
    if (videoLinks.length < MAX_VIDEO_LINKS) setVideoLinks((prev) => [...prev, '']);
  };
  const removeVideoLink = (idx: number) => {
    setVideoLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  // Computed totals (for display only)
  const totalGoals = type === '훈련'
    ? trainingGoals
    : matches.reduce((s, m) => s + m.myGoals, 0);
  const totalAssists = type === '훈련'
    ? trainingAssists
    : matches.reduce((s, m) => s + m.myAssists, 0);

  return (
    <div className="space-y-4">
      <SelectField label="팀" value={team} onChange={setTeam} options={FUTSAL_TEAMS as unknown as string[]} placeholder="팀 선택" />
      {team === '기타' && <InputField label="팀 이름" value={customTeam} onChange={setCustomTeam} placeholder="팀 이름 입력" />}
      <InputField label="날짜" type="date" value={date} onChange={setDate} />
      <InputField label="장소" value={place} onChange={setPlace} placeholder="장소 입력" />
      <div className="grid grid-cols-2 gap-3">
        <InputField label="시작" type="time" value={startTime} onChange={setStartTime} />
        <InputField label="종료" type="time" value={endTime} onChange={setEndTime} />
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">유형</label>
        <div className="flex gap-2">
          {(['훈련', '대회', '친선경기'] as FutsalType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeAndResetMatches(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                type === t ? 'bg-futsal text-white' : 'bg-surface-secondary text-text-secondary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Training: simple goals + assists */}
      {type === '훈련' && (
        <div className="grid grid-cols-2 gap-3">
          <CounterField label="골" value={trainingGoals} onChange={setTrainingGoals} color="futsal" />
          <CounterField label="어시스트" value={trainingAssists} onChange={setTrainingAssists} color="futsal" />
        </div>
      )}

      {/* Tournament-only: final rank */}
      {type === '대회' && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">최종 순위</label>
          <div className="flex gap-2 flex-wrap">
            {['1', '2', '3', '4', '8'].map((r) => (
              <button
                key={r}
                onClick={() => setFinalRank(finalRank === r ? '' : r)}
                className={`flex-1 min-w-[58px] py-2 rounded-xl text-sm font-medium transition-all ${
                  finalRank === r ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-surface-secondary text-text-secondary border border-transparent'
                }`}
              >
                {r === '1' ? '🏆 우승' : r === '2' ? '🥈 준우승' : r === '3' ? '🥉 3위' : `${r}위`}
              </button>
            ))}
            <input
              type="number"
              min={1}
              value={!['1', '2', '3', '4', '8'].includes(finalRank) ? finalRank : ''}
              onChange={(e) => setFinalRank(e.target.value)}
              placeholder="기타"
              className="w-16 bg-surface-secondary rounded-xl px-2 py-2 text-sm text-center outline-none border border-transparent focus:border-amber-300 placeholder:text-text-tertiary"
            />
          </div>
        </div>
      )}

      {showMatches && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-medium text-text-secondary">
              {type === '대회' ? `대회 경기 (${matches.length})` : '경기 결과'}
            </label>
            {type === '대회' && (
              <button
                onClick={addMatch}
                className="text-xs font-medium text-futsal-deep flex items-center gap-1 active:scale-95 transition-transform"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                경기 추가
              </button>
            )}
          </div>

          <div className="space-y-3">
            {matches.map((m, idx) => (
              <div key={m.id} className="bg-surface-secondary rounded-2xl p-3.5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-futsal-deep">경기 {idx + 1}</span>
                  {matches.length > 1 && (
                    <button
                      onClick={() => removeMatch(m.id)}
                      className="text-xs text-text-tertiary active:scale-90 transition-transform"
                    >
                      삭제
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={m.opponent}
                  onChange={(e) => updateMatch(m.id, { opponent: e.target.value })}
                  placeholder="상대팀 이름"
                  className="w-full bg-white rounded-xl px-3.5 py-2.5 text-sm text-text-primary outline-none border border-transparent focus:border-futsal-mid placeholder:text-text-tertiary mb-3"
                />

                {/* Quarter results — only for friendly */}
                {withQuarters && (
                  <div className="mb-3">
                    <div className="space-y-2 mb-2">
                      {m.quarters.map((q, qIdx) => (
                        <div key={qIdx} className="flex items-center gap-2 bg-white rounded-lg p-2">
                          <span className="text-xs text-text-tertiary w-8 text-center">Q{q.quarter}</span>
                          <input
                            type="number"
                            min={0}
                            value={q.our}
                            onChange={(e) => updateQuarter(m.id, qIdx, 'our', parseInt(e.target.value) || 0)}
                            className="w-12 text-center rounded-md py-1 text-sm font-medium border border-border outline-none focus:border-futsal-mid"
                          />
                          <span className="text-text-tertiary text-xs">vs</span>
                          <input
                            type="number"
                            min={0}
                            value={q.their}
                            onChange={(e) => updateQuarter(m.id, qIdx, 'their', parseInt(e.target.value) || 0)}
                            className="w-12 text-center rounded-md py-1 text-sm font-medium border border-border outline-none focus:border-futsal-mid"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => addQuarter(m.id)}
                        className="flex-1 py-1.5 text-[11px] font-medium text-futsal-deep bg-futsal-light rounded-lg active:scale-95 transition-transform"
                      >
                        + 쿼터 추가
                      </button>
                      {m.quarters.length > 1 && (
                        <button
                          onClick={() => removeQuarter(m.id)}
                          className="flex-1 py-1.5 text-[11px] font-medium text-text-tertiary bg-white rounded-lg active:scale-95 transition-transform"
                        >
                          − 쿼터 제거
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Final score */}
                <div className={`${withQuarters ? 'pt-3 border-t border-border' : ''}`}>
                  <p className="text-[10px] text-text-tertiary mb-2 tracking-wide">최종 결과</p>
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="number"
                      min={0}
                      value={m.finalOur}
                      onChange={(e) => updateMatch(m.id, { finalOur: e.target.value })}
                      placeholder="0"
                      className="flex-1 text-center bg-white rounded-lg py-2 text-base font-bold border border-border outline-none focus:border-futsal-mid"
                    />
                    <span className="text-text-tertiary font-medium">:</span>
                    <input
                      type="number"
                      min={0}
                      value={m.finalTheir}
                      onChange={(e) => updateMatch(m.id, { finalTheir: e.target.value })}
                      placeholder="0"
                      className="flex-1 text-center bg-white rounded-lg py-2 text-base font-bold border border-border outline-none focus:border-futsal-mid"
                    />
                  </div>
                </div>

                {/* Per-match my stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-xl px-2 py-2">
                    <p className="text-[10px] text-text-tertiary mb-1 text-center">내 골</p>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => updateMatch(m.id, { myGoals: Math.max(0, m.myGoals - 1) })}
                        className="w-7 h-7 rounded-lg bg-futsal-light text-futsal-deep flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                      <span className="text-base font-bold text-text-primary tabular-nums">{m.myGoals}</span>
                      <button
                        onClick={() => updateMatch(m.id, { myGoals: m.myGoals + 1 })}
                        className="w-7 h-7 rounded-lg bg-futsal-light text-futsal-deep flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl px-2 py-2">
                    <p className="text-[10px] text-text-tertiary mb-1 text-center">어시스트</p>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => updateMatch(m.id, { myAssists: Math.max(0, m.myAssists - 1) })}
                        className="w-7 h-7 rounded-lg bg-futsal-light text-futsal-deep flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                      <span className="text-base font-bold text-text-primary tabular-nums">{m.myAssists}</span>
                      <button
                        onClick={() => updateMatch(m.id, { myAssists: m.myAssists + 1 })}
                        className="w-7 h-7 rounded-lg bg-futsal-light text-futsal-deep flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals summary */}
          <div className="mt-3 flex items-center justify-center gap-4 bg-futsal-light rounded-xl py-2.5">
            <span className="text-xs text-futsal-deep">
              총 골 <span className="font-bold">{totalGoals}</span>
            </span>
            <span className="text-text-tertiary">·</span>
            <span className="text-xs text-futsal-deep">
              어시 <span className="font-bold">{totalAssists}</span>
            </span>
          </div>
        </div>
      )}

      {/* Video links */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-text-secondary">
            영상 링크 ({videoLinks.length}/{MAX_VIDEO_LINKS})
          </label>
          {videoLinks.length < MAX_VIDEO_LINKS && (
            <button
              onClick={addVideoLink}
              className="text-xs font-medium text-futsal-deep flex items-center gap-1 active:scale-95 transition-transform"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              추가
            </button>
          )}
        </div>
        <div className="space-y-2">
          {videoLinks.map((link, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={link}
                onChange={(e) => updateVideoLink(idx, e.target.value)}
                placeholder={`영상 ${idx + 1} URL`}
                className="flex-1 bg-surface-secondary rounded-xl px-3.5 py-3 text-sm text-text-primary outline-none border border-transparent focus:border-border-strong placeholder:text-text-tertiary"
              />
              {videoLinks.length > 1 && (
                <button
                  onClick={() => removeVideoLink(idx)}
                  className="w-9 h-9 rounded-xl bg-surface-secondary text-text-tertiary flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <DiaryMemo value={memo} onChange={setMemo} type={type} />

      <button
        onClick={onSave}
        className="w-full py-3.5 bg-futsal text-white font-semibold rounded-2xl text-sm active:scale-[0.98] transition-transform mt-2"
      >
        저장하기
      </button>
    </div>
  );
}

function BalletForm({ onSave }: { onSave: () => void }) {
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
            <button
              key={t}
              onClick={() => setBalletType(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                balletType === t ? 'bg-ballet text-white' : 'bg-surface-secondary text-text-secondary'
              }`}
            >
              <span className="text-base leading-none">{balletTypeEmoji(t)}</span>
              {t}
            </button>
          ))}
        </div>
      </div>

      <InputField label="수업 유형" value={classType} onChange={setClassType} placeholder="바리에이션, 기초, 포인트 등" />

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">컨디션</label>
        <div className="flex gap-2">
          {BODY_CONDITIONS.map((c) => (
            <button
              key={c}
              onClick={() => setBodyCondition(c)}
              className={`flex-1 py-3 rounded-xl text-2xl transition-all flex flex-col items-center gap-0.5 ${
                bodyCondition === c
                  ? 'bg-ballet-light border-2 border-ballet scale-105'
                  : 'bg-surface-secondary border-2 border-transparent grayscale opacity-60'
              }`}
            >
              <span className="leading-none">{conditionEmoji(c)}</span>
              <span className={`text-[9px] font-medium ${bodyCondition === c ? 'text-ballet' : 'text-text-tertiary'}`}>
                {c}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">난이도</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setDifficulty(s)}
              className={`text-2xl transition-transform active:scale-90 ${s <= difficulty ? 'text-ballet' : 'text-gray-200'}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <DiaryMemo value={memo} onChange={setMemo} />

      <button
        onClick={onSave}
        className="w-full py-3.5 bg-ballet text-white font-semibold rounded-2xl text-sm active:scale-[0.98] transition-transform mt-2"
      >
        저장하기
      </button>
    </div>
  );
}

function DiaryMemo({
  value,
  onChange,
  type,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: FutsalType;
}) {
  const placeholder =
    type === '대회'
      ? '오늘 대회 어땠어? 기억에 남는 순간을 적어보자'
      : type === '친선경기'
      ? '경기 흐름이나 느낀 점을 짧게 남겨보자'
      : type === '훈련'
      ? '훈련 중 컨디션, 새로 배운 점, 다음에 보완할 부분'
      : '오늘 어땠어? 느낀 점을 적어보자';

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        <label className="text-xs font-medium text-amber-700">오늘의 메모</label>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full bg-gradient-to-br from-amber-50 to-white rounded-xl px-3.5 py-3 text-sm text-text-primary outline-none border border-amber-100 focus:border-amber-300 placeholder:text-text-tertiary resize-none leading-relaxed"
      />
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface-secondary rounded-xl px-3.5 py-3 text-sm text-text-primary outline-none border border-transparent focus:border-border-strong placeholder:text-text-tertiary"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-surface-secondary rounded-xl px-3.5 py-3 text-sm outline-none border border-transparent focus:border-border-strong appearance-none ${
          value ? 'text-text-primary' : 'text-text-tertiary'
        }`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function CounterField({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1.5">{label}</label>
      <div className="flex items-center justify-between bg-surface-secondary rounded-xl px-3 py-2">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform ${
            color === 'futsal' ? 'bg-futsal-light text-futsal-deep' : 'bg-ballet-light text-ballet'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <span className="text-xl font-bold text-text-primary tabular-nums">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform ${
            color === 'futsal' ? 'bg-futsal-light text-futsal-deep' : 'bg-ballet-light text-ballet'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
