import Dexie, { type EntityTable } from 'dexie';

export type ModuleStatus = 'locked' | 'active' | 'completed';

export interface Module {
  id: string;
  title: string;
  cp: number; 
  grade?: number;
  status: ModuleStatus;
  pdfPath?: string;
  extractedContent?: string;
  xpAwarded?: boolean; 
}

export type QuestType = 'review' | 'learning' | 'prep';

export interface Quest {
  id: string;
  content: string;
  type: QuestType;
  isCompleted: boolean;
  xpReward: number;
  generatedAt: Date;
}

// --- UPDATE HIER ---
export interface UserProfile {
  id: string;
  xp: number;
  level: number;
  coins: number;
  streak: number;
  lastLogin: Date;
  // Neue Felder für den Shop
  activeTheme: string; 
  unlockedItems: string[]; 
}

const db = new Dexie('UniQuestDB') as Dexie & {
  modules: EntityTable<Module, 'id'>;
  quests: EntityTable<Quest, 'id'>;
  userProfile: EntityTable<UserProfile, 'id'>;
};

db.version(2).stores({
  modules: 'id, status',
  quests: 'id, isCompleted, generatedAt',
  userProfile: 'id'
});

db.on('populate', () => {
  db.userProfile.add({
    id: 'main_user',
    xp: 0,
    level: 1,
    coins: 0,
    streak: 0,
    lastLogin: new Date(),
    // Defaults setzen
    activeTheme: 'theme-default',
    unlockedItems: ['theme-default']
  });
});

export { db };