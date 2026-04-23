export type BotRole = 'owner' | 'admin' | 'member';

export interface AppContext {
  startedAt: number;
  env: 'development' | 'production';
}
