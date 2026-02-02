import Dexie, { type EntityTable } from 'dexie';

// --- Types & Interfaces ---

export type ModuleStatus = 'locked' | 'active' | 'completed';

export interface Module {
  id: string;
  title: string;
  cp: number; // Credit Points
  grade?: number; // Note (1.0 - 5.0)
  status: ModuleStatus;
  
  // PDF & AI Context Fields
  pdfPath?: string; // Lokaler Pfad zur Datei (für Electron)
  extractedContent?: string; // Der rohe Text aus der PDF für RAG (Retrieval Augmented Generation)
}

export type QuestType = 'review' | 'learning' | 'prep';

export interface Quest {
  id: string;
  content: string; // Der Aufgabentext
  type: QuestType;
  isCompleted: boolean;
  xpReward: number;
  generatedAt: Date; // Wichtig für Weekly-Reset Logik
}

export interface UserProfile {
  id: string; // Wir nutzen hier einen festen Key, z.B. "user_main"
  xp: number;
  level: number;
  coins: number;
  streak: number;
  lastLogin: Date;
}

// --- Database Configuration ---

const db = new Dexie('UniQuestDB') as Dexie & {
  modules: EntityTable<Module, 'id'>;
  quests: EntityTable<Quest, 'id'>;
  userProfile: EntityTable<UserProfile, 'id'>;
};

// Schema Definition
// Hinweis: Wir indizieren nur Felder, die wir für WHERE-Clauses benötigen.
db.version(2).stores({
  modules: 'id, status', // Status wichtig für: "Gib mir alle Active Module für Kontext"
  quests: 'id, isCompleted, generatedAt', // Wichtig für: "Zeige offene Quests"
  userProfile: 'id'
});

// Optional: Ein Hook, der beim Starten prüft, ob ein User-Profil existiert
db.on('populate', () => {
  db.userProfile.add({
    id: 'main_user',
    xp: 0,
    level: 1,
    coins: 0,
    streak: 0,
    lastLogin: new Date()
  });
});

export { db };