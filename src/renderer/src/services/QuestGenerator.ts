import { db, Quest } from '../db/db';

const MODEL = 'llama3'; // Dein Modell

export const QuestGenerator = {
  async generate(): Promise<Quest[]> {
    // 1. Kontext sammeln
    const activeModules = await db.modules.where('status').equals('active').toArray();
    const completedModules = await db.modules.where('status').equals('completed').toArray();
    
    let context = "LERN-KONTEXT:\n";
    let hasContent = false;
    
    // Active Material
    activeModules.forEach(m => {
      if(m.extractedContent && m.extractedContent.length > 50) {
        context += `MODUL (Aktuell): ${m.title}\nAUSZUG: ${m.extractedContent.substring(0, 1500).replace(/\n/g, ' ')}\n\n`;
        hasContent = true;
      }
    });

    // Spaced Repetition Material
    if (completedModules.length > 0) {
      const randomMod = completedModules[Math.floor(Math.random() * completedModules.length)];
      if(randomMod.extractedContent && randomMod.extractedContent.length > 50) {
        context += `MODUL (Wiederholung): ${randomMod.title}\nAUSZUG: ${randomMod.extractedContent.substring(0, 1000)}\n\n`;
        hasContent = true;
      }
    }

    if (!hasContent) {
      throw new Error("Keine PDF-Inhalte gefunden! Bitte lade erst Skripte hoch.");
    }

    // 2. Prompt erstellen
    const prompt = `
      Du bist ein RPG Quest-Master für einen Studenten.
      Erstelle basierend auf dem Kontext 3 kurze Aufgaben (Quests).
      
      ${context}
      
      FORMAT: Antworte NUR als JSON Array.
      Beispiel: [{"content": "Erkläre den Begriff...", "type": "learning", "xp": 100}]
      Types: 'learning' (für Aktuelles), 'review' (für Wiederholung).
    `;

    console.log("Sende Anfrage an Electron Backend...");
    
    const result = await window.api.generateAI(MODEL, prompt);

    if (!result.success || !result.data) {
      throw new Error(result.error || "Unbekannter KI Fehler (Backend)");
    }

    // --- FIX: Robustes Parsing ---
    let questsRaw: any;
    try {
        // Schritt A: Rohdaten normalisieren
        let rawJson = result.data;
        
        // Falls Ollama das JSON im "response" String verpackt hat (Standard bei stream:false)
        if (rawJson.response && typeof rawJson.response === 'string') {
           rawJson = JSON.parse(rawJson.response);
        } 
        // Falls Ollama direkt das Objekt zurückgibt (manchmal bei format:'json')
        else if (result.data && !result.data.response) {
           rawJson = result.data;
        }

        questsRaw = rawJson;

    } catch (e) {
        console.error("JSON Parse Fehler:", e);
        throw new Error("Die KI hat kein gültiges JSON geliefert.");
    }

    // Schritt B: Array extrahieren (Hier lag der Fehler!)
    // Wenn die KI { "quests": [...] } statt [...] geschickt hat:
    if (!Array.isArray(questsRaw) && typeof questsRaw === 'object' && questsRaw !== null) {
        if (Array.isArray(questsRaw.quests)) {
            questsRaw = questsRaw.quests;
        } else if (Array.isArray(questsRaw.tasks)) {
            questsRaw = questsRaw.tasks;
        } else if (Array.isArray(questsRaw.data)) {
            questsRaw = questsRaw.data;
        }
    }

    // Schritt C: Letzter Check
    if (!Array.isArray(questsRaw)) {
         console.error("KI Antwort Struktur:", questsRaw);
         throw new Error("Konnte kein Quest-Array in der Antwort finden. (Siehe Console für Details)");
    }

    // 3. Speichern in DB
    const newQuests: Quest[] = questsRaw.map((q: any) => ({
      id: crypto.randomUUID(),
      content: q.content,
      type: q.type || 'learning',
      xpReward: q.xp || 50,
      isCompleted: false,
      generatedAt: new Date()
    }));

    await db.quests.bulkAdd(newQuests);
    return newQuests;
  }
};