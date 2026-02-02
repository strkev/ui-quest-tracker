import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Module } from '../db/db';
import { ModuleItem } from './modules/ModuleItem';
import { ModuleModal } from './modules/ModuleModal';
import { QuestGenerator } from '../services/QuestGenerator';
import { Plus, Zap, CheckSquare, Loader2 } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isGenerating, setIsGenerating] = useState(false); // Ladezustand für KI

  // Live Data aus DB
  const modules = useLiveQuery(() => db.modules.toArray());
  const quests = useLiveQuery(() => db.quests.filter(q => !q.isCompleted).toArray());
  const user = useLiveQuery(() => db.userProfile.get('main_user')); // Annahme: User existiert (siehe db.ts)

  // -- Handlers --

  const handleEdit = (mod: Module) => {
    setEditingModule(mod);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingModule(null);
    setIsModalOpen(true);
  };

const handlePdfUpload = async (moduleId: string) => {
    try {
      const filePath = await window.api.selectPdf();
      if (!filePath) return;

      console.log(`Processing PDF for Module ${moduleId}: ${filePath}`);
      const result = await window.api.parsePdf(filePath);
      
      if (result.success && result.text && result.text.length > 50) {
        // Update in der Datenbank
        await db.modules.update(moduleId, {
          pdfPath: filePath,
          extractedContent: result.text,
        });
        
        // Kleiner visueller Feedback-Hack (optional, da Dexie auto-updated)
        console.log("PDF Saved!"); 
      } else {
        alert('Warnung: Das PDF konnte nicht als Text gelesen werden. (Ist es vielleicht ein gescanntes Bild?)');
      }

    } catch (err) {
      console.error(err);
      alert('Fehler beim Upload: ' + err);
    }
  };

  const handleGenerateQuests = async () => {
    setIsGenerating(true);
    try {
      await QuestGenerator.generate();
    } catch (e: any) {
      alert("Fehler: " + e.message + "\n(Läuft Ollama?)");
    } finally {
      setIsGenerating(false);
    }
  };

  const completeQuest = async (id: string, xp: number) => {
    await db.quests.update(id, { isCompleted: true });
    // XP gutschreiben
    if (user) {
      await db.userProfile.update('main_user', { xp: user.xp + xp });
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto text-slate-100 pb-20">
      
      {/* --- HEADER --- */}
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-white flex items-center gap-3">
            <i className="nes-icon trophy is-medium"></i> Skill Tree
          </h1>
          <p className="text-slate-400 mt-1">Level {user?.level || 1} • {user?.xp || 0} XP</p>
        </div>
        
        {/* Generate Quest Button */}
        <button 
          onClick={handleGenerateQuests} 
          disabled={isGenerating}
          className={`nes-btn ${isGenerating ? 'is-disabled' : 'is-warning'} flex items-center gap-2`}
        >
          {isGenerating ? <Loader2 className="animate-spin" /> : <Zap fill="currentColor" />}
          {isGenerating ? 'Thinking...' : 'Start Weekly Quest'}
        </button>
      </header>

      {/* --- QUESTS SECTION (Wenn Quests da sind) --- */}
      {quests && quests.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-300">
            <span className="animate-pulse">●</span> Active Quests
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quests.map(q => (
              <div key={q.id} className="pixel-card bg-slate-800 p-4 flex gap-4 items-start border-l-4 border-l-blue-500">
                <button 
                  onClick={() => completeQuest(q.id, q.xpReward)}
                  className="mt-1 text-slate-500 hover:text-emerald-400 transition-colors"
                >
                  <CheckSquare size={24} />
                </button>
                <div>
                  <div className="badge is-primary text-[10px] mb-1">{q.type}</div>
                  <p className="font-bold text-sm leading-relaxed">{q.content}</p>
                  <span className="text-xs text-amber-400 font-bold mt-2 block">+{q.xpReward} XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- MODULE GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {modules?.map((mod) => (
          <ModuleItem 
            key={mod.id} 
            module={mod} 
            onUploadClick={handlePdfUpload}
            onEditClick={handleEdit}
          />
        ))}

        {/* Add Button */}
        <button 
          onClick={handleAdd}
          className="pixel-card border-dashed border-4 border-slate-600 bg-slate-800/30 text-slate-500 flex flex-col items-center justify-center h-72 hover:bg-slate-800 hover:text-slate-300 hover:border-slate-500 transition-all cursor-pointer group"
        >
          <Plus size={48} className="mb-4 group-hover:scale-110 transition-transform" />
          <span className="font-bold">Add Module</span>
        </button>
      </div>

      {/* --- MODAL --- */}
      <ModuleModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialModule={editingModule} 
      />
    </div>
  );
};