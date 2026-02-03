import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Module } from '../db/db';
import { GamificationService } from '../services/GamificationService';
import { QuestGenerator } from '../services/QuestGenerator';
import { Plus, Zap, Loader2, Book, History, Flame, ShoppingBag } from 'lucide-react';

// Components
import { UserMenu } from './UserMenu';
import { QuestArchiveModal } from './quests/QuestArchiveModal';
import { ShopModal } from './shop/ShopModal';
import { QuestItem } from './quests/QuestItem';
import { ModuleItem } from './modules/ModuleItem';
import { ModuleModal } from './modules/ModuleModal';

// Sub-Components
import { StatsOverview } from './modules/StatsOverview';
import { HallOfFame } from './modules/HallOfFame';

export const Dashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Data
  const modules = useLiveQuery(() => db.modules.toArray()) || [];
  const quests = useLiveQuery(() => db.quests.filter(q => !q.isCompleted).toArray());
  const user = useLiveQuery(() => db.userProfile.get('main_user'));

  useEffect(() => {
    GamificationService.checkStreak();
  }, []);

  // Filtered Data & Stats Logic
  const activeModules = modules.filter(m => m.status === 'active' || m.status === 'locked');
  const completedModules = modules.filter(m => m.status === 'completed');
  
  const stats = useMemo(() => {
    const totalCP = modules.reduce((sum, m) => sum + (m.status === 'completed' ? m.cp : 0), 0);
    let weightedGradeSum = 0;
    let gradedCP = 0;
    
    completedModules.forEach(m => {
      if (m.grade && m.grade > 0) {
        weightedGradeSum += m.grade * m.cp;
        gradedCP += m.cp;
      }
    });

    return {
      totalCP,
      finishedCount: completedModules.length,
      averageGrade: gradedCP > 0 ? (weightedGradeSum / gradedCP).toFixed(2) : '—'
    };
  }, [modules, completedModules]);

  // Handlers
  const handleEdit = (mod: Module) => { setEditingModule(mod); setIsModalOpen(true); };
  const handleAdd = () => { setEditingModule(null); setIsModalOpen(true); };

  const handlePdfUpload = async (moduleId: string) => {
    try {
      const filePath = await window.api.selectPdf();
      if (!filePath) return;
      const res = await window.api.parsePdf(filePath);
      if (res.success && res.text) {
        await db.modules.update(moduleId, { pdfPath: filePath, extractedContent: res.text });
      }
    } catch (e) { alert("Fehler: " + e); }
  };

  const handleGenerateQuests = async () => {
    setIsGenerating(true);
    try { await QuestGenerator.generate(); } 
    catch (e: any) { alert(e.message); } 
    finally { setIsGenerating(false); }
  };

  const completeQuest = async (id: string, xp: number) => {
    await db.quests.update(id, { isCompleted: true });
    if (user) await db.userProfile.update('main_user', { xp: user.xp + xp });
  };

  return (
    <div className="p-8 h-full overflow-y-auto text-slate-100 pb-32 custom-scrollbar">
      
      {/* HEADER */}
      <header className="mb-10 flex justify-between items-start">
        <div className="flex items-center gap-6">
          <i className="nes-icon trophy is-large"></i>
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Skill Tree</h1>
            <div className="flex items-center gap-4 mt-2 text-slate-400">
               <span className="badge is-warning text-xs">Level {user?.level || 1}</span>
               <span className="text-sm font-bold opacity-80">{user?.xp || 0} XP Total</span>
               <div className="flex items-center gap-1 text-orange-400 font-bold ml-2 animate-pulse">
                  <Flame size={16} fill="currentColor" />
                  <span>{user?.streak || 0} Tage Streak</span>
               </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-3">
           <div className="flex items-center gap-3">
              <button onClick={() => setIsShopOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-600 hover:border-pink-500 hover:text-pink-400 transition-all text-xs font-bold">
                  <ShoppingBag size={16} /> Shop
              </button>
              <UserMenu />
           </div>
           <button onClick={handleGenerateQuests} disabled={isGenerating} className={`nes-btn ${isGenerating ? 'is-disabled' : 'is-warning'} flex items-center gap-2 scale-90 origin-right`}>
              {isGenerating ? <Loader2 className="animate-spin" /> : <Zap fill="currentColor" />}
              {isGenerating ? 'Analysiere...' : 'Start Weekly Quest'}
           </button>
        </div>
      </header>

      {/* STATS OVERVIEW */}
      <StatsOverview 
        finishedCount={stats.finishedCount} 
        totalModules={modules.length} 
        totalCP={stats.totalCP} 
        averageGrade={stats.averageGrade} 
      />

      {/* WEEKLY QUESTS SECTION */}
      <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-200">
                <span className="text-accent animate-pulse">●</span> Current Weekly Quests
            </h2>
            <button onClick={() => setIsQuestLogOpen(true)} className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700">
              <History size={14} /> Quest Log
            </button>
          </div>

          {quests && quests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {quests.map(q => (
                  <QuestItem key={q.id} quest={q} onComplete={(xp) => completeQuest(q.id, xp)} />
                ))}
            </div>
          ) : (
            <div className="pixel-card bg-slate-800/30 p-8 border-dashed border-2 border-slate-700 text-center text-slate-500 rounded-xl">
                <p className="font-bold mb-2">Keine aktiven Quests.</p>
                <p className="text-xs opacity-70">Starte eine neue Weekly Quest oben rechts.</p>
            </div>
          )}
      </section>

      {/* ACTIVE STUDIES SECTION */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-white">
          <Book className="text-accent" size={24} /> Active Studies
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {activeModules.map((mod) => (
            <ModuleItem key={mod.id} module={mod} onUploadClick={handlePdfUpload} onEditClick={handleEdit} />
          ))}
          <button onClick={handleAdd} className="pixel-card border-dashed border-4 border-slate-700/50 bg-slate-800/20 text-slate-500 flex flex-col items-center justify-center h-72 hover:bg-slate-800 hover:text-accent transition-all group rounded-xl">
            <Plus size={40} className="group-hover:scale-110 transition-transform mb-4" />
            <span className="font-bold text-sm uppercase tracking-wider">Add Module</span>
          </button>
        </div>
      </section>

      {/* HALL OF FAME SECTION */}
      {completedModules.length > 0 && (
        <HallOfFame 
          modules={completedModules} 
          onEdit={handleEdit} 
          onUpload={handlePdfUpload} 
        />
      )}

      {/* MODALS */}
      <ModuleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialModule={editingModule} />
      <QuestArchiveModal isOpen={isQuestLogOpen} onClose={() => setIsQuestLogOpen(false)} />
      <ShopModal isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
      
    </div>
  );
};