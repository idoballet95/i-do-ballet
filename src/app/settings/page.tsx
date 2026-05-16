'use client';

import { useState } from 'react';
import { defaultSettings } from '@/data/mock';
import Avatar, { PROFILE_NAME } from '@/components/Avatar';

export default function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [newFutsalTeam, setNewFutsalTeam] = useState('');
  const [newBalletStudio, setNewBalletStudio] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addFutsalTeam = () => {
    if (newFutsalTeam.trim() && !settings.futsalTeams.includes(newFutsalTeam.trim())) {
      setSettings({ ...settings, futsalTeams: [...settings.futsalTeams, newFutsalTeam.trim()] });
      setNewFutsalTeam('');
    }
  };

  const removeFutsalTeam = (team: string) => {
    setSettings({ ...settings, futsalTeams: settings.futsalTeams.filter((t) => t !== team) });
  };

  const addBalletStudio = () => {
    if (newBalletStudio.trim() && !settings.balletStudios.includes(newBalletStudio.trim())) {
      setSettings({ ...settings, balletStudios: [...settings.balletStudios, newBalletStudio.trim()] });
      setNewBalletStudio('');
    }
  };

  const removeBalletStudio = (studio: string) => {
    setSettings({ ...settings, balletStudios: settings.balletStudios.filter((s) => s !== studio) });
  };

  return (
    <div className="animate-fade-in-up">
      <div className="px-5 pt-14 pb-8">
        <div className="flex items-center gap-3 mb-5">
          <Avatar size={44} />
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight leading-tight">설정</h1>
            <p className="text-xs text-text-tertiary mt-0.5">앱 환경 설정</p>
          </div>
        </div>

        {/* Profile card */}
        <div className="bg-gradient-to-br from-nova-light via-ballet-light to-futsal-light rounded-3xl p-5 mb-6 flex items-center gap-4 shadow-sm">
          <Avatar size={64} />
          <div>
            <p className="text-base font-bold text-text-primary">{PROFILE_NAME}</p>
            <p className="text-xs text-text-secondary mt-0.5">⚽ 풋살 · 🩰 발레 트래커</p>
          </div>
        </div>

        {/* Goals */}
        <Section title="목표 설정">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">주간 목표 (회)</label>
              <input
                type="number"
                min={1}
                max={14}
                value={settings.weeklyGoal}
                onChange={(e) => setSettings({ ...settings, weeklyGoal: parseInt(e.target.value) || 1 })}
                className="w-full bg-surface-secondary rounded-xl px-3.5 py-3 text-sm text-text-primary outline-none border border-transparent focus:border-border-strong text-center font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">월간 목표 (회)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={settings.monthlyGoal}
                onChange={(e) => setSettings({ ...settings, monthlyGoal: parseInt(e.target.value) || 1 })}
                className="w-full bg-surface-secondary rounded-xl px-3.5 py-3 text-sm text-text-primary outline-none border border-transparent focus:border-border-strong text-center font-semibold"
              />
            </div>
          </div>
        </Section>

        {/* Futsal teams */}
        <Section title="풋살 팀">
          <div className="flex flex-wrap gap-2 mb-3">
            {settings.futsalTeams.map((team) => (
              <span
                key={team}
                className="inline-flex items-center gap-1.5 bg-futsal-light text-futsal px-3 py-1.5 rounded-full text-sm font-medium"
              >
                {team}
                <button onClick={() => removeFutsalTeam(team)} className="active:scale-90 transition-transform">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newFutsalTeam}
              onChange={(e) => setNewFutsalTeam(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addFutsalTeam()}
              placeholder="새 팀 추가"
              className="flex-1 bg-surface-secondary rounded-xl px-3.5 py-2.5 text-sm text-text-primary outline-none border border-transparent focus:border-futsal-mid placeholder:text-text-tertiary"
            />
            <button
              onClick={addFutsalTeam}
              className="px-4 py-2.5 bg-futsal text-white rounded-xl text-sm font-medium active:scale-95 transition-transform"
            >
              추가
            </button>
          </div>
        </Section>

        {/* Ballet studios */}
        <Section title="발레 스튜디오">
          <div className="flex flex-wrap gap-2 mb-3">
            {settings.balletStudios.map((studio) => (
              <span
                key={studio}
                className="inline-flex items-center gap-1.5 bg-ballet-light text-ballet px-3 py-1.5 rounded-full text-sm font-medium"
              >
                {studio}
                <button onClick={() => removeBalletStudio(studio)} className="active:scale-90 transition-transform">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newBalletStudio}
              onChange={(e) => setNewBalletStudio(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addBalletStudio()}
              placeholder="새 스튜디오 추가"
              className="flex-1 bg-surface-secondary rounded-xl px-3.5 py-2.5 text-sm text-text-primary outline-none border border-transparent focus:border-ballet-mid placeholder:text-text-tertiary"
            />
            <button
              onClick={addBalletStudio}
              className="px-4 py-2.5 bg-ballet text-white rounded-xl text-sm font-medium active:scale-95 transition-transform"
            >
              추가
            </button>
          </div>
        </Section>

        {/* App info */}
        <Section title="앱 정보">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">버전</span>
              <span className="text-sm text-text-primary font-medium">0.1.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">데이터</span>
              <span className="text-sm text-text-tertiary">로컬 (mock)</span>
            </div>
          </div>
        </Section>

        <button
          onClick={handleSave}
          className="w-full py-3.5 bg-accent text-white font-semibold rounded-2xl text-sm active:scale-[0.98] transition-transform mt-4"
        >
          저장하기
        </button>
      </div>

      {saved && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-text-primary text-white px-5 py-3 rounded-2xl text-sm font-medium shadow-lg">
            설정이 저장되었습니다
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-medium text-text-tertiary mb-3 tracking-wide">{title}</h2>
      {children}
    </div>
  );
}
