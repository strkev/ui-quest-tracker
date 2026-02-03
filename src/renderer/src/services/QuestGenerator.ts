import { db, Quest } from '../db/db';

const MODEL = 'llama3';

// Definition der Persona-Stile
const PERSONA_STYLES: Record<string, string> = {
  'persona-default': "Antworte als freundlicher, motivierender Tutor. Nutze 'Du' und ermutige den Studenten.",
  'persona-french-grumpy': "Antworte mit einem sehr starken französischen Akzent (z.B. 'Sacrebleu', 'Mon Dieu'). Sei ein wenig genervt von Fehlern und wirke arrogant, aber bleibe fachlich korrekt.",
  'persona-robot': "Antworte als kalte, logische KI. Keine Emotionen. Nutze Begriffe wie 'Analyse abgeschlossen', 'Fehlerrate berechnet'. Nur Fakten."
};

export const QuestGenerator = {

  async checkAnswer(questContent: string, userAnswer: string): Promise<string> {
    const user = await db.userProfile.get('main_user');
    const style = PERSONA_STYLES[user?.activePersona || 'persona-default'];

    const prompt = `
      ${style}
      
      AUFGABE: "${questContent}"
      ANTWORT DES STUDENTEN: "${userAnswer}"
      
      BEWERTE:
      1. Korrektheit prüfen.
      2. Verbesserungsvorschläge machen.
      
      REGELN: Max 3 Sätze. Bleib in deiner Rolle!
      
      WICHTIG: Antworte AUSSCHLIESSLICH im JSON-Format. Keine Einleitung, kein "Hier ist das JSON".
      FORMAT: { "feedback": "DEIN_TEXT_HIER" }
    `;

    try {
      const result = await window.api.generateAI(MODEL, prompt); 
      if (!result.success || !result.data) return "Konnte keine Bewertung abrufen.";

      let output = result.data;

      // --- FIX: Erst das response-Feld auspacken, falls es ein API-Objekt ist ---
      if (typeof output === 'object' && output !== null && 'response' in output) {
        output = output.response;
      }
      // --------------------------------------------------------------------------

      // JSON-Extraktions-Logik (sucht nach dem ersten { und letzten })
      if (typeof output === 'string') {
        const start = output.indexOf('{');
        const end = output.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          try {
            const cleaned = output.substring(start, end + 1);
            const parsed = JSON.parse(cleaned);
            return parsed.feedback || cleaned;
          } catch (e) {
            return output; // Fallback auf Rohtext, falls Parsing fehlschlägt
          }
        }
        return output; // Kein JSON gefunden, gib Text zurück
      }

      // Falls es schon ein Objekt war (aber nicht das Ollama-Objekt)
      return (output as any).feedback || JSON.stringify(output);

    } catch (e) {
      console.error(e);
      return "Fehler bei der KI-Analyse.";
    }
  },

  async generate(): Promise<Quest[]> {
    // 1. Alle Module laden, die Text enthalten
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

    // Spaced Repetition (Abgeschlossenes Modul)
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
        // Hier war der Fix für generate() schon vorhanden, den wir oben übernommen haben
        if (rawJson.response && typeof rawJson.response === 'string') {
           rawJson = JSON.parse(rawJson.response);
        } else if (result.data && !result.data.response) {
           rawJson = result.data;
        }
        questsRaw = rawJson;
    } catch (e) {
        throw new Error("Die KI hat kein gültiges JSON geliefert.");
    }

    // Fallback: Manchmal packt die KI das Array in ein Objekt { "quests": [...] }
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