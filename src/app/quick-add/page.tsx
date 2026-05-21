'use client';

import { useState } from 'react';
import { FUTSAL_TEAMS, BALLET_STUDIOS } from '@/data/mock';
import { BALLET_TYPES, BODY_CONDITIONS, conditionEmoji, balletTypeEmoji } from '@/lib/ballet';
import type { FutsalType, FutsalTeam, QuarterResult, BalletType, BodyCondition, FutsalSession, BalletSession } from '@/types';
import Avatar from '@/components/Avatar';
import { useEvents } from '@/lib/events-store';

type Tab = 'futsal' | 'ballet';

const MAX_VIDEO_LINKS = 5;

interface MatchInput {
  id: string;
  label: string;       // 예선1, 8강 등
  opponent: string;
  finalOur: string;
  finalTheir: string;
  myGoals: number;
  myAssists: number;
  videoLink: string;
  quarters: QuarterResult[];
}

function newMatch(withQuarters: boolean, label = ''): MatchInput {
  return {
    id: Math.random().toString(36).slice(2),
    label,
    opponent: '',
    finalOur: '',
    finalTheir: '',
    myGoals: 0,
    myAssists: 0,
    videoLink: '',
    quarters: withQuarters
      ? [{ quarter: 1, our: 0, their: 0 }, { quarter: 2, our: 0, their: 0 }]
      : [],
  };
}

// ── 붙여넣기 파서 ──────────────────────────────────────────
// 지원 형식:
//   26.05.17 대회명 경기영상
//   예선1 레드문: https://youtu.be/...
//   -최종: 4:0 승
//   -아이두: 1골
//   -아이두: 1 어시
function parseTournamentText(text: string): {
  date: string;
  place: string;
  matches: MatchInput[];
} {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { date: '', place: '', matches: [] };

  // 첫 줄: "26.05.17 풋투풋 얼티밋컵 경기영상"
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
  let cur: MatchInput | null = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // ── 경기 라인 (URL 포함)
    const urlMatch = line.match(/(https?:\/\/\S+)/);
    if (urlMatch) {
      if (cur) matches.push(cur);
      const videoLink = urlMatch[1];
      const beforeUrl = line.slice(0, line.indexOf(videoLink)).trim().replace(/:?\s*$/, '').trim();
      const labelMatch = beforeUrl.match(/^(예선\s*\d+|8강|16강|4강|준결승|결승|3\.?4위전|3위전|조별리그\s*\d*|\S{1,6})\s+(.+)$/i);
      let label = '';
      let opponent = beforeUrl;
      if (labelMatch) {
        label = labelMatch[1].replace(/\s/g, '');
        opponent = labelMatch[2].trim();
      }
      cur = { id: Math.random().toString(36).slice(2), label, opponent, finalOur: '', finalTheir: '', myGoals: 0, myAssists: 0, videoLink, quarters: [] };
      continue;
    }

    if (!cur) continue;

    // ── 최종 스코어: "-최종: 4:0 승" / "최종: 1:0"
    const scoreMatch = line.match(/최종[:\s]+(\d+)\s*:\s*(\d+)/);
    if (scoreMatch) {
      cur.finalOur = scoreMatch[1];
      cur.finalTheir = scoreMatch[2];
      continue;
    }

    // ── 내 골: "-아이두: 1골" / "-아이두: 1 골"
    const goalMatch = line.match(/아이두[:\s]+(\d+)\s*골/);
    if (goalMatch) {
      cur.myGoals = parseInt(goalMatch[1]);
      continue;
    }

    // ── 내 어시: "-아이두: 1 어시" / "-아이두: 1어시스트"
    const assistMatch = line.match(/아이두[:\s]+(\d+)\s*어시/);
    if (assistMatch) {
      cur.myAssists = parseInt(assistMatch[1]);
      continue;
    }
  }

  if (cur) matches.push(cur);
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

  // 붙여넣기 파싱 UI 상태
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

  const updateMatch = (id: string, patch: Partial<MatchInput>) =>
    setMatches((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

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

  // 붙여넣기 파싱 실행
  const handleParse = () => {
    setParseError('');
    const parsed = parseTournamentText(pasteText);
    if (!parsed.date && parsed.matches.length === 0) {
      setParseError('형식을 인식하지 못했어요. 예: "26.05.17 대회명\n예선1 상대팀: https://..."');
      return;
    }
    if (parsed.date) setDate(parsed.date);
    if (parsed.place) setPlace(parsed.place);
    if (parsed.matches.length > 0) setMatches(parsed.matches);
    setType('대회');
    setPasteMode(false);
    setPasteText('');
  };

  const totalGoals = type === '훈련' ? trainingGoals : matches.reduce((s, m) => s + m.myGoals, 0);
  const totalAssists = type === '훈련' ? trainingAssists : matches.reduce((s, m) => s + m.myAssists, 0);

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
        ? matches.map((m) => ({
            id: m.id,
            opponent: m.opponent,
            finalOur: parseInt(m.finalOur) || 0,
            finalTheir: parseInt(m.finalTheir) || 0,
            myGoals: m.myGoals,
            myAssists: m.myAssists,
            videoLink: m.videoLink || undefined,
            quarterResults: withQuarters ? m.quarters : undefined,
          }))
        : undefined,
      videoLinks: videoLinks.filter((l) => l.trim()),
      memo: memo || undefined,
    };
    addEvent(event);
    onSaved();
    // 폼 초기화
    setTeam(''); setPlace(''); setMemo(''); setFinalRank('');
    setMatches([newMatch(false)]); setVideoLinks(['']);
  };

  return (
    <div className="space-y-4">
      {/* 대회 붙여넣기 모드 토글 */}
      {type === '대회' && !pasteMode && (
        <button
          onClick={() => setPasteMode(true)}
          className="w-full py-2.5 rounded-xl border border-dashed border-futsal text-futsal-deep text-sm font-medium flex items-center justify-center gap-2 hover:bg-futsal-light transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="9" y="2" width="6" height="4" rx="1"/><path d="M8 6H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-2"/>
          </svg>
          📋 대회 텍스트 붙여넣기로 입력
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
            {"26.05.17 대회명 경기영상\n예선1 상대팀: https://..."}
            형식으로 붙여넣으세요
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={"26.05.17 풋투풋 얼티밋컵 경기영상\n\n예선1 레드문: https://youtu.be/...\n8강 상대팀: https://youtu.be/..."}
            rows={8}
            className="w-full bg-white rounded-xl px-3 py-2.5 text-xs text-text-primary outline-none border border-border focus:border-futsal-mid placeholder:text-text-tertiary resize-none font-mono leading-relaxed"
          />
          {parseError && <p className="text-[11px] text-red-400">{parseError}</p>}
          <button
            onClick={handleParse}
            disabled={!pasteText.trim()}
            className="w-full py-2.5 bg-futsal text-white rounded-xl text-sm font-semibold disabled:opacity-40 active:scale-95 transition-transform"
          >
            파싱해서 입력하기
          </button>
        </div>
      )}

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

      {showMatches && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-medium text-text-secondary">
              {type === '대회' ? `경기 목록 (${matches.length})` : '경기 결과'}
            </label>
            {type === '대회' && (
              <button onClick={addMatch} className="text-xs font-medium text-futsal-deep flex items-center gap-1 active:scale-95 transition-transform">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                경기 추가
              </button>
            )}
          </div>

          <div className="space-y-3">
            {matches.map((m, idx) => (
              <div key={m.id} className="bg-surface-secondary rounded-2xl p-3.5">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {m.label && (
                      <span className="text-[10px] font-bold text-white bg-futsal-deep px-2 py-0.5 rounded-full">
                        {m.label}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-futsal-deep">
                      {m.label ? '' : `경기 ${idx + 1}`}
                    </span>
                  </div>
                  {matches.length > 1 && (
                    <button onClick={() => removeMatch(m.id)} className="text-xs text-text-tertiary">삭제</button>
                  )}
                </div>

                <input type="text" value={m.opponent}
                  onChange={(e) => updateMatch(m.id, { opponent: e.target.value })}
                  placeholder="상대팀 이름"
                  className="w-full bg-white rounded-xl px-3.5 py-2.5 text-sm text-text-primary outline-none border border-transparent focus:border-futsal-mid placeholder:text-text-tertiary mb-3"
                />

                {/* 영상 링크 (경기별) */}
                <div className="mb-3">
                  <label className="text-[10px] text-text-tertiary mb-1 block">경기 영상 링크</label>
                  <input type="text" value={m.videoLink}
                    onChange={(e) => updateMatch(m.id, { videoLink: e.target.value })}
                    placeholder="https://youtu.be/..."
                    className="w-full bg-white rounded-xl px-3.5 py-2 text-xs text-text-primary outline-none border border-transparent focus:border-futsal-mid placeholder:text-text-tertiary"
                  />
                </div>

                {/* 쿼터 (친선경기) */}
                {withQuarters && (
                  <div className="mb-3">
                    <div className="space-y-2 mb-2">
                      {m.quarters.map((q, qIdx) => (
                        <div key={qIdx} className="flex items-center gap-2 bg-white rounded-lg p-2">
                          <span className="text-xs text-text-tertiary w-8 text-center">Q{q.quarter}</span>
                          <input type="number" min={0} value={q.our}
                            onChange={(e) => updateQuarter(m.id, qIdx, 'our', parseInt(e.target.value) || 0)}
                            className="w-12 text-center rounded-md py-1 text-sm font-medium border border-border outline-none focus:border-futsal-mid"
                          />
                          <span className="text-text-tertiary text-xs">vs</span>
                          <input type="number" min={0} value={q.their}
                            onChange={(e) => updateQuarter(m.id, qIdx, 'their', parseInt(e.target.value) || 0)}
                            className="w-12 text-center rounded-md py-1 text-sm font-medium border border-border outline-none focus:border-futsal-mid"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => addQuarter(m.id)} className="flex-1 py-1.5 text-[11px] font-medium text-futsal-deep bg-futsal-light rounded-lg active:scale-95 transition-transform">+ 쿼터 추가</button>
                      {m.quarters.length > 1 && (
                        <button onClick={() => removeQuarter(m.id)} className="flex-1 py-1.5 text-[11px] font-medium text-text-tertiary bg-white rounded-lg active:scale-95 transition-transform">− 쿼터 제거</button>
                      )}
                    </div>
                  </div>
                )}

                {/* 최종 스코어 */}
                <div className={withQuarters ? 'pt-3 border-t border-border' : ''}>
                  <p className="text-[10px] text-text-tertiary mb-2 tracking-wide">최종 스코어</p>
                  <div className="flex items-center gap-2 mb-3">
                    <input type="number" min={0} value={m.finalOur}
                      onChange={(e) => updateMatch(m.id, { finalOur: e.target.value })}
                      placeholder="0"
                      className="flex-1 text-center bg-white rounded-lg py-2 text-base font-bold border border-border outline-none focus:border-futsal-mid"
                    />
                    <span className="text-text-tertiary font-medium">:</span>
                    <input type="number" min={0} value={m.finalTheir}
                      onChange={(e) => updateMatch(m.id, { finalTheir: e.target.value })}
                      placeholder="0"
                      className="flex-1 text-center bg-white rounded-lg py-2 text-base font-bold border border-border outline-none focus:border-futsal-mid"
                    />
                  </div>
                </div>

                {/* 내 골 / 어시 */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-xl px-2 py-2">
                    <p className="text-[10px] text-text-tertiary mb-1 text-center">내 골</p>
                    <div className="flex items-center justify-between">
                      <StepBtn onClick={() => updateMatch(m.id, { myGoals: Math.max(0, m.myGoals - 1) })} icon="minus" color="futsal" />
                      <span className="text-base font-bold text-text-primary tabular-nums">{m.myGoals}</span>
                      <StepBtn onClick={() => updateMatch(m.id, { myGoals: m.myGoals + 1 })} icon="plus" color="futsal" />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl px-2 py-2">
                    <p className="text-[10px] text-text-tertiary mb-1 text-center">어시스트</p>
                    <div className="flex items-center justify-between">
                      <StepBtn onClick={() => updateMatch(m.id, { myAssists: Math.max(0, m.myAssists - 1) })} icon="minus" color="futsal" />
                      <span className="text-base font-bold text-text-primary tabular-nums">{m.myAssists}</span>
                      <StepBtn onClick={() => updateMatch(m.id, { myAssists: m.myAssists + 1 })} icon="plus" color="futsal" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-center gap-4 bg-futsal-light rounded-xl py-2.5">
            <span className="text-xs text-futsal-deep">총 골 <span className="font-bold">{totalGoals}</span></span>
            <span className="text-text-tertiary">·</span>
            <span className="text-xs text-futsal-deep">어시 <span className="font-bold">{totalAssists}</span></span>
          </div>
        </div>
      )}

      {/* 세션 영상 링크 (대회 전체) */}
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
