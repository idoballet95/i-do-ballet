export type WorkoutCategory = 'futsal' | 'ballet';

export type FutsalType = '훈련' | '대회' | '친선경기';

export type BalletType = '공연' | '리허설' | '수업';

export type BodyCondition = '좋음' | '보통' | '피곤' | '안좋음';

export type FutsalTeam =
  | '버뮤다'
  | 'NOVA'
  | '옥수'
  | '누누'
  | '104FC'
  | '강남FC'
  | '하남풋살'
  | '기타';

export type BalletStudio =
  | 'SWANS'
  | 'W발레'
  | 'PDD'
  | '예종포인트'
  | '기타';

export interface QuarterResult {
  quarter: number;
  our: number;
  their: number;
}

export interface MatchResult {
  id: string;
  opponent: string;
  finalOur: number;
  finalTheir: number;
  myGoals: number;
  myAssists: number;
  // 친선경기만 쿼터 사용. 대회는 쿼터 없음(단판).
  quarterResults?: QuarterResult[];
}

export interface FutsalSession {
  id: string;
  category: 'futsal';
  team: FutsalTeam;
  customTeam?: string;
  date: string;
  place: string;
  startTime: string;
  endTime: string;
  type: FutsalType;
  goals: number;
  assists: number;
  matches?: MatchResult[];
  finalRank?: number;
  videoLinks?: string[];
  memo?: string;
}

export interface BalletSession {
  id: string;
  category: 'ballet';
  studio: BalletStudio;
  customStudio?: string;
  date: string;
  place: string;
  startTime: string;
  endTime: string;
  type: BalletType;
  classType: string;
  bodyCondition: BodyCondition;
  difficulty: number;
  memo?: string;
}

export type WorkoutEvent = FutsalSession | BalletSession;

export interface RecurringSchedule {
  id: string;
  category: WorkoutCategory;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  place: string;
  team?: FutsalTeam;
  studio?: BalletStudio;
  label: string;
}

export interface AppSettings {
  futsalTeams: string[];
  balletStudios: string[];
  weeklyGoal: number;
  monthlyGoal: number;
}
