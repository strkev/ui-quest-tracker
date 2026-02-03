import { db, Quest } from '../db/db';

const MODEL = 'llama3'; // Dein Modell

export const QuestGenerator = {

async checkAnswer(questContent: string, userAnswer: string): Promise<string> {
    // WIR FORDERN EXPLIZIT JSON - Das ist sicherer für die Verarbeitung
    const prompt = `
      Du bist ein freundlicher Tutor.
      
      AUFGABE: "${questContent}"
      ANTWORT DES STUDENTEN: "${userAnswer}"
      
      Bitte bewerte die Antwort.
      1. Ist sie richtig?
      2. Was fehlt oder könnte präziser sein?
      3. Korrigiere Fehler kurz.
      
      Fasse dich kurz (maximal 3-4 Sätze). Sprich den Studenten direkt an ("Du hast...").
      
      WICHTIG: Antworte NUR als JSON-Objekt in diesem Format:
      { "feedback": "Dein Feedback Text hier..." }
    `;

    try {
      const result = await window.api.generateAI('llama3', prompt); 
      
      if (!result.success || !result.data) {
        return "Konnte keine Bewertung abrufen.";
      }

      let output = result.data;

      // 1. Falls es ein String ist: Nach JSON suchen und parsen
      if (typeof output === 'string') {
        try {
          // Wir suchen gezielt nach {...} um evtl. Texte davor/danach zu ignorieren
          const jsonMatch = output.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
             output = JSON.parse(jsonMatch[0]);
          } else {
             // Keine geschweiften Klammern? Dann ist es wohl reiner Text.
             return output; 
          }
        } catch (e) {
          // Parsing fehlgeschlagen? Dann nehmen wir den Roh-Text.
          return output;
        }
      }

      // 2. Objekt analysieren (Hier holen wir das Feedback raus)
      if (output && typeof output === 'object') {
        // A: Unser gewünschtes Format
        if (output.feedback) return output.feedback;
        
        // B: Fallback Standard-Felder (falls Llama "response" oder "text" nutzt)
        if (output.response) return typeof output.response === 'string' ? output.response : JSON.stringify(output.response);
        if (output.text) return output.text;
        if (output.content) return output.content;

        // C: Dein Spezialfall ("Key ist der Text")
        // Wir suchen den längsten Key, falls das LLM das JSON verhauen hat
        const keys = Object.keys(output);
        if (keys.length > 0) {
            const longestKey = keys.reduce((a, b) => a.length > b.length ? a : b);
            // Wenn der Key wie ein Satz aussieht (> 20 Zeichen), nehmen wir ihn
            if (longestKey.length > 20) {
                return longestKey;
            }
        }
        
        // D: Wenn alles andere fehlschlägt, geben wir das Objekt als String zurück
        return JSON.stringify(output);
      }

      return String(output);

    } catch (e) {
      console.error("AI Check Error:", e);
      return "Fehler bei der KI-Analyse.";
    }
  },

async generate(): Promise<Quest[]> {
    // 1. Alle Module laden, die Text enthalten (unabhängig vom Status 'active'/'completed')
    const allModules = await db.modules.toArray();
    const modulesWithContent = allModules.filter(m => m.extractedContent && m.extractedContent.length > 50);

    if (modulesWithContent.length === 0) {
      throw new Error("Keine PDF-Inhalte gefunden! Bitte lade erst Skripte hoch.");
    }

    let context = "LERN-KONTEXT:\n";
    
    // Aktive Module priorisieren
    const activeWithContent = modulesWithContent.filter(m => m.status === 'active');
    activeWithContent.forEach(m => {
      context += `MODUL (Aktuell): ${m.title}\nAUSZUG: ${m.extractedContent?.substring(0, 1500).replace(/\n/g, ' ')}\n\n`;
    });

    // Falls vorhanden, ein zufälliges abgeschlossenes Modul für Review hinzufügen (Spaced Repetition)
    const completedWithContent = modulesWithContent.filter(m => m.status === 'completed');
    if (completedWithContent.length > 0) {
      const randomMod = completedWithContent[Math.floor(Math.random() * completedWithContent.length)];
      context += `MODUL (Wiederholung): ${randomMod.title}\nAUSZUG: ${randomMod.extractedContent?.substring(0, 1000)}\n\n`;
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

    let questsRaw: any;
    try {
        let rawJson = result.data;
        if (rawJson.response && typeof rawJson.response === 'string') {
           rawJson = JSON.parse(rawJson.response);
        } else if (result.data && !result.data.response) {
           rawJson = result.data;
        }
        questsRaw = rawJson;
    } catch (e) {
        throw new Error("Die KI hat kein gültiges JSON geliefert.");
    }

    if (!Array.isArray(questsRaw) && typeof questsRaw === 'object' && questsRaw !== null) {
        if (Array.isArray(questsRaw.quests)) questsRaw = questsRaw.quests;
        else if (Array.isArray(questsRaw.tasks)) questsRaw = questsRaw.tasks;
    }

    if (!Array.isArray(questsRaw)) {
         throw new Error("Konnte kein Quest-Array in der Antwort finden.");
    }

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