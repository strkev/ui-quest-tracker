import Dexie, { type EntityTable } from 'dexie';

// Typen definieren
export interface Module {
  id: string;
  title: string;
  status: 'locked' | 'active' | 'completed';
  grade?: number;
  cp: number;
  contentSummary?: string; // Für die AI
}

export interface Quest {
  id: string;
  text: string;
  isCompleted: boolean;
  xpReward: number;
  createdAt: Date;
}

// Datenbank initialisieren
const db = new Dexie('UniQuestDB') as Dexie & {
  modules: EntityTable<Module, 'id'>;
  quests: EntityTable<Quest, 'id'>;
};

// Schema definieren (nur indexierte Felder nötig)
db.version(1).stores({
  modules: 'id, status',
  quests: 'id, isCompleted'
});

export { db };