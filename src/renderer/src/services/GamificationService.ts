import { db } from '../db/db';

export const GamificationService = {
  
  calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
  },

  calculateModuleReward(cp: number, grade: number): number {
    const gradeFactor = Math.max(1, 5 - grade); 
    const baseXP = cp * 50; 
    return Math.floor(baseXP * gradeFactor);
  },

  async addXP(amount: number): Promise<{ newLevel: number, levelUp: boolean }> {
    const user = await db.userProfile.get('main_user');
    if (!user) return { newLevel: 1, levelUp: false };

    const newXP = user.xp + amount;
    const oldLevel = user.level;
    const newLevel = this.calculateLevel(newXP);
    
    await db.userProfile.update('main_user', {
      xp: newXP,
      level: newLevel,
      coins: user.coins + Math.floor(amount / 10)
    });

    return { newLevel, levelUp: newLevel > oldLevel };
  },

  // NEU: Funktion zum Abziehen von XP
  async removeXP(amount: number): Promise<void> {
    const user = await db.userProfile.get('main_user');
    if (!user) return;

    // XP dürfen nicht unter 0 fallen
    const newXP = Math.max(0, user.xp - amount);
    const newLevel = this.calculateLevel(newXP);
    
    // Wir ziehen auch die Coins wieder ab (optional)
    const coinsToDeduct = Math.floor(amount / 10);
    const newCoins = Math.max(0, user.coins - coinsToDeduct);

    await db.userProfile.update('main_user', {
      xp: newXP,
      level: newLevel,
      coins: newCoins
    });
  },

  async checkStreak(): Promise<void> {
    const user = await db.userProfile.get('main_user');
    if (!user) return;

    const today = new Date();
    const lastLogin = new Date(user.lastLogin);
    today.setHours(0,0,0,0);
    const lastLoginDate = new Date(lastLogin);
    lastLoginDate.setHours(0,0,0,0);

    const diffTime = Math.abs(today.getTime() - lastLoginDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    let newStreak = user.streak;

    if (diffDays === 1) newStreak += 1;
    else if (diffDays > 1) newStreak = 1;

    await db.userProfile.update('main_user', {
      lastLogin: new Date(),
      streak: newStreak
    });
  }
};