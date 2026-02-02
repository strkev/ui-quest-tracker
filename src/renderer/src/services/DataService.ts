import { db } from '../db/db';

export const DataService = {
  /**
   * Exportiert die gesamte Datenbank als JSON-Datei
   */
  exportData: async () => {
    try {
      // 1. Alle Daten parallel abrufen
      const [modules, quests, userProfile] = await Promise.all([
        db.modules.toArray(),
        db.quests.toArray(),
        db.userProfile.toArray()
      ]);

      // 2. Backup-Objekt bauen
      const backupData = {
        version: 1,
        timestamp: new Date().toISOString(),
        data: {
          modules,
          quests,
          userProfile
        }
      };

      // 3. Blob erstellen und Download auslösen
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      // Dateiname mit Datum: quest-tracker-backup-2023-10-27.json
      link.download = `quest-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error("Export Error:", error);
      alert("Fehler beim Exportieren der Daten.");
      return false;
    }
  },

  /**
   * Importiert Daten aus einer JSON-Datei und überschreibt die aktuelle DB
   */
  importData: async (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const backup = JSON.parse(content);

          // Einfacher Validierungs-Check
          if (!backup.data || !backup.data.modules || !backup.data.userProfile) {
            throw new Error("Ungültiges Backup-Format");
          }

          // WICHTIG: Transaktion starten (Alles oder nichts)
          await db.transaction('rw', db.modules, db.quests, db.userProfile, async () => {
            // 1. Alte Daten löschen
            await Promise.all([
              db.modules.clear(),
              db.quests.clear(),
              db.userProfile.clear()
            ]);

            // 2. Neue Daten schreiben
            await Promise.all([
              db.modules.bulkAdd(backup.data.modules),
              db.quests.bulkAdd(backup.data.quests),
              db.userProfile.bulkAdd(backup.data.userProfile)
            ]);
          });

          resolve(true);
        } catch (error) {
          console.error("Import Error:", error);
          alert("Fehler beim Importieren: Die Datei scheint beschädigt oder ungültig zu sein.");
          resolve(false);
        }
      };

      reader.readAsText(file);
    });
  }
};