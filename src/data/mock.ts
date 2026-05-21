import { WorkoutEvent, RecurringSchedule, AppSettings } from '@/types';

export const FUTSAL_TEAMS = [
  '버뮤다',
  'NOVA',
  '옥수',
  '누누',
  '104FC',
  '강남FC',
  '하남풋살',
  '기타',
] as const;

export const BALLET_STUDIOS = [
  'SWANS',
  'W발레',
  'PDD',
  '예종포인트',
  '기타',
] as const;

// ── 실제 경기 기록만 포함 ──────────────────────────────────────────
export const mockEvents: WorkoutEvent[] = [
  {
    id: 'nova-20260517',
    category: 'futsal',
    team: 'NOVA',
    date: '2026-05-17',
    place: '풋투풋 얼티밋컵',
    startTime: '09:00',
    endTime: '20:00',
    type: '대회',
    goals: 5,
    assists: 1,
    finalRank: 3,
    matches: [
      {
        id: 'nova-20260517-m1',
        label: '예선1',
        opponent: '레드문',
        finalOur: 4, finalTheir: 0,
        myGoals: 1, myAssists: 0,
        videoLink: 'https://youtu.be/jLJh7Ey9wKA?si=2JaCGGgLdwklJHE7',
      },
      {
        id: 'nova-20260517-m2',
        label: '예선2',
        opponent: 'MUTANT',
        finalOur: 2, finalTheir: 0,
        myGoals: 1, myAssists: 0,
        videoLink: 'https://youtu.be/Awbi1JtO8Rk?si=8U_8HZfei7zwQleR',
      },
      {
        id: 'nova-20260517-m3',
        label: '예선3',
        opponent: 'UJBWFC',
        finalOur: 2, finalTheir: 0,
        myGoals: 1, myAssists: 0,
        videoLink: 'https://youtu.be/iFIaGrDlhic?si=_IEiqsSxceEzulKb',
      },
      {
        id: 'nova-20260517-m4',
        label: '예선4',
        opponent: 'bucket fc',
        finalOur: 1, finalTheir: 0,
        myGoals: 1, myAssists: 0,
        videoLink: 'https://youtu.be/51G-xIZ0TYs?si=3WlU7mILCf2zvHl9',
      },
      {
        id: 'nova-20260517-m5',
        label: '예선5',
        opponent: 'team ARX',
        finalOur: 1, finalTheir: 0,
        myGoals: 0, myAssists: 1,
        videoLink: 'https://youtu.be/9oAAXH-zpyI?si=Rub4aIlhCXd-Xawr',
      },
      {
        id: 'nova-20260517-m6',
        label: '8강',
        opponent: '레드문 fc',
        finalOur: 4, finalTheir: 1,
        myGoals: 1, myAssists: 0,
        videoLink: 'https://youtu.be/t_RpDA-ZoAA?si=tjlWLCNh4Iim7pgh',
      },
      {
        id: 'nova-20260517-m7',
        label: '4강',
        opponent: 'ARX',
        finalOur: 0, finalTheir: 1,
        myGoals: 0, myAssists: 0,
        videoLink: 'https://youtu.be/t4DZPJfCKnw?si=BHtEXq2Lxk39MGPi',
      },
      {
        id: 'nova-20260517-m8',
        label: '3·4위전',
        opponent: 'PELTA',
        finalOur: 2, finalTheir: 1,
        myGoals: 0, myAssists: 0,
        videoLink: 'https://youtu.be/xcPiR36w8WM?si=k4aKechOo4vZlkSb',
      },
    ],
    memo: '풋투풋 얼티밋컵 2026.05.17 · 3위',
  },
];

export const mockRecurringSchedules: RecurringSchedule[] = [];

export const defaultSettings: AppSettings = {
  futsalTeams: ['버뮤다', 'NOVA', '옥수', '누누', '104FC', '강남FC', '하남풋살'],
  balletStudios: ['SWANS', 'W발레', 'PDD', '예종포인트'],
  weeklyGoal: 4,
  monthlyGoal: 15,
};
