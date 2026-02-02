import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Module } from '../db/db';
import { ModuleItem } from './modules/ModuleItem';
import { ModuleModal } from './modules/ModuleModal';
import { QuestGenerator } from '../services/QuestGenerator';
import { Plus, Zap, CheckSquare, Loader2, Trophy, Book, GraduationCap, History }from 'lucide-react';
import { QuestArchiveModal } from './quests/QuestArchiveModal';

export const Dashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false);
  // Daten laden
  const modules = useLiveQuery(() => db.modules.toArray()) || [];
  const quests = useLiveQuery(() => db.quests.filter(q => !q.isCompleted).toArray());
  const user = useLiveQuery(() => db.userProfile.get('main_user'));

  // --- LOGIK & BERECHNUNGEN ---
  const activeModules = modules.filter(m => m.status === 'active' || m.status === 'locked');
  const completedModules = modules.filter(m => m.status === 'completed');

  const totalCP = modules.reduce((sum, m) => sum + (m.status === 'completed' ? m.cp : 0), 0);
  const totalModules = modules.length;
  const finishedCount = completedModules.length;

  // Gesamtnote berechnen (Gewichtet nach CP)
  let weightedGradeSum = 0;
  let gradedCP = 0;

  completedModules.forEach(m => {
    if (m.grade && m.grade > 0) {
      weightedGradeSum += m.grade * m.cp;
      gradedCP += m.cp;
    }
  });

  const averageGrade = gradedCP > 0 ? (weightedGradeSum / gradedCP).toFixed(2) : '—';

  const handleEdit = (mod: Module) => { setEditingModule(mod); setIsModalOpen(true); };
  const handleAdd = () => { setEditingModule(null); setIsModalOpen(true); };

  const handlePdfUpload = async (moduleId: string) => {
    try {
      const filePath = await window.api.selectPdf();
      if (!filePath) return;
      const res = await window.api.parsePdf(filePath);
      if (res.success && res.text && res.text.length > 50) {
        await db.modules.update(moduleId, { pdfPath: filePath, extractedContent: res.text });
      } else { alert("Warnung: PDF leer."); }
    } catch (e) { alert("Upload Fehler: " + e); }
  };

  const handleGenerateQuests = async () => {
    setIsGenerating(true);
    try { await QuestGenerator.generate(); } 
    catch (e: any) { alert("Fehler: " + e.message); } 
    finally { setIsGenerating(false); }
  };

  const completeQuest = async (id: string, xp: number) => {
    await db.quests.update(id, { isCompleted: true });
    if (user) await db.userProfile.update('main_user', { xp: user.xp + xp });
  };

return (
    <div className="p-8 h-full overflow-y-auto text-slate-100 pb-32 custom-scrollbar">
      
      {/* --- HEADER SECTION --- */}
      <header className="mb-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-white flex items-center gap-3">
              <i className="nes-icon trophy is-medium"></i> Skill Tree
            </h1>
            <div className="flex items-center gap-4 mt-3 text-slate-400">
               <span className="badge is-warning text-xs">Level {user?.level || 1}</span>
               <span className="text-sm font-medium">{user?.xp || 0} XP Total</span>
            </div>
          </div>
          
          <button 
            onClick={handleGenerateQuests} 
            disabled={isGenerating}
            className={`nes-btn ${isGenerating ? 'is-disabled' : 'is-warning'} flex items-center gap-2 shadow-lg`}
          >
            {isGenerating ? <Loader2 className="animate-spin" /> : <Zap fill="currentColor" />}
            {isGenerating ? 'Analysiere...' : 'Start Weekly Quest'}
          </button>
        </div>

        {/* --- STATS BAR (Progress & GPA) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. Progress Bar Container */}
            <div className="pixel-card bg-slate-800 p-6 md:col-span-2 flex flex-col justify-center shadow-lg">
                <div className="flex justify-between text-xs mb-3 text-slate-400 font-bold uppercase tracking-wider">
                    <span>Semester Progress</span>
                    <span>{finishedCount} / {totalModules} Modules</span>
                </div>
                <progress className="nes-progress is-primary h-6 w-full" value={finishedCount} max={Math.max(totalModules, 1)}></progress>
            </div>

            {/* 2. Grades & CP Container */}
            <div className="pixel-card bg-slate-800 p-4 flex justify-around items-center divide-x divide-slate-600 shadow-lg">
                <div className="flex flex-col items-center px-4 w-1/2">
                    <span className="text-3xl font-black text-amber-400">{totalCP}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Total CP</span>
                </div>
                <div className="flex flex-col items-center px-4 w-1/2">
                    <div className="flex items-center gap-2 text-emerald-400">
                        <GraduationCap size={28} />
                        <span className="text-3xl font-black">{averageGrade}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Ø Note (GPA)</span>
                </div>
            </div>
        </div>
      </header>

      {/* --- WEEKLY QUESTS SECTION --- */}
      <div className="mb-12 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-blue-300">
                <span className="animate-pulse text-blue-500">●</span> Current Weekly Quests
            </h2>
            
            {/* History Button */}
            <button 
              onClick={() => setIsQuestLogOpen(true)}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-2 px-3 py-1 rounded hover:bg-slate-700 transition-colors border border-transparent hover:border-slate-600"
            >
              <History size={14} /> Quest Log
            </button>
          </div>

          {quests && quests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {quests.map(q => (
                  <div key={q.id} className="pixel-card bg-slate-800/80 p-4 flex gap-4 items-start border-l-4 border-l-blue-500 hover:bg-slate-800 transition-colors shadow-md">
                    <button 
                      onClick={() => completeQuest(q.id, q.xpReward)} 
                      className="mt-1 text-slate-500 hover:text-emerald-400 transition-colors hover:scale-110 transform"
                      title="Complete Quest"
                    >
                      <CheckSquare size={24} />
                    </button>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <span className="badge is-primary text-[9px] scale-90 origin-left opacity-90">{q.type}</span>
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-900/30 px-2 py-0.5 rounded border border-amber-500/30">+{q.xpReward} XP</span>
                      </div>
                      <p className="font-bold text-sm leading-relaxed text-slate-200">{q.content}</p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="pixel-card bg-slate-800/30 p-8 border-dashed border-2 border-slate-700 text-center text-slate-500">
                <p className="font-bold mb-2">Keine aktiven Quests.</p>
                <p className="text-xs">Klicke oben auf "Start Weekly Quest", um neue Aufgaben zu erhalten.</p>
            </div>
          )}
      </div>

      {/* --- SECTION 1: ACTIVE MODULES (Big Grid) --- */}
      <div className="mb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
          <Book className="text-blue-400" size={24} /> Active Studies
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {activeModules.map((mod) => (
            <ModuleItem 
              key={mod.id} 
              module={mod} 
              variant="default" 
              onUploadClick={handlePdfUpload} 
              onEditClick={handleEdit} 
            />
          ))}

          {/* Add Button */}
          <button 
            onClick={handleAdd}
            className="pixel-card border-dashed border-4 border-slate-700 bg-slate-800/30 text-slate-600 flex flex-col items-center justify-center h-72 hover:bg-slate-800 hover:text-blue-400 hover:border-blue-500/50 transition-all cursor-pointer group"
          >
            <Plus size={48} className="mb-4 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm uppercase tracking-wider">Add Module</span>
          </button>
        </div>
      </div>

      {/* --- SECTION 2: COMPLETED ARCHIVE (Compact Grid) --- */}
      {completedModules.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-400">
            <Trophy className="text-amber-500" size={24} /> Hall of Fame (Completed)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 opacity-90 hover:opacity-100 transition-opacity">
            {completedModules.map((mod) => (
              <ModuleItem 
                key={mod.id} 
                module={mod} 
                variant="compact"
                onUploadClick={handlePdfUpload} 
                onEditClick={handleEdit} 
              />
            ))}
          </div>
        </div>
      )}

      {/* --- MODALS --- */}
      <ModuleModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialModule={editingModule} 
      />

      <QuestArchiveModal 
        isOpen={isQuestLogOpen} 
        onClose={() => setIsQuestLogOpen(false)} 
      />
      
    </div>
  );
};