import type { BodyCondition, BalletType } from '@/types';

export const BALLET_TYPES: BalletType[] = ['수업', '리허설', '공연'];

export const BODY_CONDITIONS: BodyCondition[] = ['좋음', '보통', '피곤', '안좋음'];

export function conditionEmoji(c: BodyCondition | string): string {
  switch (c) {
    case '좋음':
      return '😊';
    case '보통':
      return '😐';
    case '피곤':
      return '😴';
    case '안좋음':
      return '😣';
    default:
      return '';
  }
}

export function balletTypeEmoji(t: BalletType | string): string {
  switch (t) {
    case '공연':
      return '🎭';
    case '리허설':
      return '🩰';
    case '수업':
      return '✨';
    default:
      return '';
  }
}
