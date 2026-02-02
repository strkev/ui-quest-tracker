import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Module } from '../db/db';
import { ModuleItem } from './modules/ModuleItem';
import { ModuleModal } from './modules/ModuleModal';
import { QuestGenerator } from '../services/QuestGenerator';
import { GamificationService } from '../services/GamificationService';
import { 
  Plus, Zap, CheckSquare, Loader2, Trophy, Book, GraduationCap, 
  History, Flame, ShoppingBag, Search, ArrowDownAZ, ArrowUpAZ, 
  ArrowDown01, ArrowUp01, Filter 
} from 'lucide-react';
import { QuestArchiveModal } from './quests/QuestArchiveModal';
import { ShopModal } from './shop/ShopModal';

type SortOption = 'date' | 'title' | 'grade';
type SortDirection = 'asc' | 'desc';

export const Dashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- NEU: STATE FÜR FILTER & SORTIERUNG ---
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('grade'); // Default: Nach Note sortiert
  const [sortDir, setSortDir] = useState<SortDirection>('asc'); // Default: Beste Note (1.0) zuerst

  // Daten laden
  const modules = useLiveQuery(() => db.modules.toArray()) || [];
  const quests = useLiveQuery(() => db.quests.filter(q => !q.isCompleted).toArray());
  const user = useLiveQuery(() => db.userProfile.get('main_user'));

  useEffect(() => {
    GamificationService.checkStreak();
  }, []);

  // --- LOGIK & BERECHNUNGEN ---
  const activeModules = modules.filter(m => m.status === 'active' || m.status === 'locked');
  
  // Rohdaten für Completed (noch unsortiert)
  const rawCompletedModules = modules.filter(m => m.status === 'completed');

  // --- NEU: SORTIER- & FILTER-LOGIK (useMemo für Performance) ---
  const completedModules = useMemo(() => {
    let result = [...rawCompletedModules];

    // 1. Filtern (Suche)
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(m => m.title.toLowerCase().includes(lowerTerm));
    }

    // 2. Sortieren
    result.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'grade') {
        // Module ohne Note kommen ans Ende
        const gradeA = a.grade || 99;
        const gradeB = b.grade || 99;
        comparison = gradeA - gradeB;
      }

      // Richtung umkehren bei 'desc'
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [rawCompletedModules, searchTerm, sortBy, sortDir]);

  // Stats berechnen
  const totalCP = modules.reduce((sum, m) => sum + (m.status === 'completed' ? m.cp : 0), 0);
  const totalModules = modules.length;
  const finishedCount = rawCompletedModules.length;

  let weightedGradeSum = 0;
  let gradedCP = 0;
  rawCompletedModules.forEach(m => {
    if (m.grade && m.grade > 0) {
      weightedGradeSum += m.grade * m.cp;
      gradedCP += m.cp;
    }
  });
  const averageGrade = gradedCP > 0 ? (weightedGradeSum / gradedCP).toFixed(2) : '—';

  // --- HANDLERS ---
  const handleEdit = (mod: Module) => { setEditingModule(mod); setIsModalOpen(true); };
  const handleAdd = () => { setEditingModule(null); setIsModalOpen(true); };

  const toggleSort = (field: SortOption) => {
    if (sortBy === field) {
      // Wenn gleiches Feld: Richtung toggeln
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Wenn neues Feld: Standard 'asc' (A-Z oder 1.0->5.0)
      setSortBy(field);
      setSortDir('asc');
    }
  };

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
      
      {/* --- HEADER --- */}
      <header className="mb-10">
        <div className="flex justify-between items-start mb-8">
          {/* Titel & Stats Container - Jetzt aligned! */}
          <div className="flex items-center gap-6">
            {/* Icon steht links vom Text-Block */}
            <i className="nes-icon trophy is-large"></i>
            
            <div className="flex flex-col">
              <h1 className="text-4xl font-extrabold text-white tracking-tight">
                Skill Tree
              </h1>
              
              {/* Stats Row - Jetzt exakt unter dem Titel */}
              <div className="flex items-center gap-4 mt-2 text-slate-400">
                 <span className="badge is-warning text-xs shadow-sm">Level {user?.level || 1}</span>
                 <span className="text-sm font-bold opacity-80">{user?.xp || 0} XP Total</span>
                 
                 <div className="flex items-center gap-1 text-orange-400 font-bold ml-2 animate-pulse" title="Daily Login Streak">
                    <Flame size={16} fill="currentColor" />
                    <span>{user?.streak || 0} Tage Streak</span>
                 </div>

                 <button 
                    onClick={() => setIsShopOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-600 hover:border-accent hover:text-accent transition-all text-xs font-bold cursor-pointer ml-2 hover:scale-105"
                 >
                    <ShoppingBag size={14} />
                    <span>Shop</span>
                 </button>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleGenerateQuests} 
            disabled={isGenerating}
            className={`nes-btn ${isGenerating ? 'is-disabled' : 'is-warning'} flex items-center gap-2 shadow-lg self-center`}
          >
            {isGenerating ? <Loader2 className="animate-spin" /> : <Zap fill="currentColor" />}
            {isGenerating ? 'Analysiere...' : 'Start Weekly Quest'}
          </button>
        </div>

        {/* --- STATS CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="pixel-card bg-slate-800 p-6 md:col-span-2 flex flex-col justify-center shadow-lg border-slate-700">
                <div className="flex justify-between text-xs mb-3 text-slate-400 font-bold uppercase tracking-wider">
                    <span>Semester Progress</span>
                    <span>{finishedCount} / {totalModules} Modules</span>
                </div>
                <progress className="nes-progress is-primary h-6 w-full" value={finishedCount} max={Math.max(totalModules, 1)}></progress>
            </div>

            <div className="pixel-card bg-slate-800 p-4 flex justify-around items-center divide-x divide-slate-700 shadow-lg border-slate-700">
                <div className="flex flex-col items-center px-4 w-1/2">
                    <span className="text-3xl font-black text-amber-400 drop-shadow-sm">{totalCP}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Total CP</span>
                </div>
                <div className="flex flex-col items-center px-4 w-1/2">
                    <div className="flex items-center gap-2 text-accent">
                        <GraduationCap size={28} />
                        <span className="text-3xl font-black">{averageGrade}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Ø Note (GPA)</span>
                </div>
            </div>
        </div>
      </header>

      {/* --- WEEKLY QUESTS --- */}
      <div className="mb-12 animate-in slide-in-from-top-4 duration-500 delay-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-200">
                <span className="text-accent animate-pulse">●</span> Current Weekly Quests
            </h2>
            <button 
              onClick={() => setIsQuestLogOpen(true)}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
            >
              <History size={14} /> Quest Log
            </button>
          </div>

          {quests && quests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {quests.map(q => (
                  <div key={q.id} className="pixel-card bg-slate-800/80 p-5 flex gap-4 items-start border-l-4 border-l-accent hover:bg-slate-800 transition-all hover:-translate-y-1 shadow-md group">
                    <button onClick={() => completeQuest(q.id, q.xpReward)} className="mt-1 text-slate-500 hover:text-emerald-400 transition-colors hover:scale-110 transform">
                      <CheckSquare size={24} />
                    </button>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <span className="badge is-primary text-[9px] scale-90 origin-left opacity-90">{q.type}</span>
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-900/20 px-2 py-0.5 rounded border border-amber-500/30">+{q.xpReward} XP</span>
                      </div>
                      <p className="font-bold text-sm leading-relaxed text-slate-300 group-hover:text-white transition-colors">{q.content}</p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="pixel-card bg-slate-800/30 p-8 border-dashed border-2 border-slate-700 text-center text-slate-500 rounded-xl">
                <p className="font-bold mb-2">Keine aktiven Quests.</p>
                <p className="text-xs opacity-70">Klicke oben auf "Start Weekly Quest", um neue Aufgaben zu erhalten.</p>
            </div>
          )}
      </div>

      {/* --- ACTIVE MODULES --- */}
      <div className="mb-12">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-white">
          <Book className="text-accent" size={24} /> Active Studies
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

          <button 
            onClick={handleAdd}
            className="pixel-card border-dashed border-4 border-slate-700/50 bg-slate-800/20 text-slate-500 flex flex-col items-center justify-center h-72 hover:bg-slate-800 hover:text-accent hover:border-accent/50 transition-all cursor-pointer group rounded-xl"
          >
            <div className="p-4 rounded-full bg-slate-800 group-hover:bg-accent/10 transition-colors mb-4">
                <Plus size={40} className="group-hover:scale-110 transition-transform" />
            </div>
            <span className="font-bold text-sm uppercase tracking-wider">Add Module</span>
          </button>
        </div>
      </div>

      {/* --- HALL OF FAME (COMPLETED) --- */}
      {rawCompletedModules.length > 0 && (
        <div className="mb-12">
          {/* Header mit Suchleiste und Filtern */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
             <h2 className="text-xl font-bold flex items-center gap-3 text-slate-400 shrink-0">
               <Trophy className="text-amber-500" size={24} /> Hall of Fame
             </h2>
             
             {/* Modern Filter Toolbar */}
             <div className="flex items-center gap-3 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50 w-full md:w-auto backdrop-blur-sm">
                {/* Search Input - Modern Style */}
                <div className="relative flex-grow md:w-64 group">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent transition-colors" size={16} />
                   <input 
                      type="text" 
                      placeholder="Suche..." 
                      className="bg-slate-900/50 border border-transparent rounded-lg text-sm text-white pl-10 pr-3 py-2 w-full focus:outline-none focus:border-accent/50 focus:bg-slate-900 transition-all placeholder:text-slate-600"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>
                
                <div className="w-px h-6 bg-slate-700 mx-1"></div>

                {/* Sort Button: Name */}
                <button 
                   onClick={() => toggleSort('title')}
                   className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                       sortBy === 'title' 
                       ? 'bg-accent text-white shadow-lg shadow-accent/20' 
                       : 'text-slate-500 hover:text-slate-200 hover:bg-slate-700/50'
                   }`}
                   title="Sort by Name"
                >
                   {sortBy === 'title' && sortDir === 'desc' ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />}
                   <span className="hidden sm:inline">Name</span>
                </button>

                {/* Sort Button: Grade */}
                <button 
                   onClick={() => toggleSort('grade')}
                   className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                       sortBy === 'grade' 
                       ? 'bg-accent text-white shadow-lg shadow-accent/20'
                       : 'text-slate-500 hover:text-slate-200 hover:bg-slate-700/50'
                   }`}
                   title="Sort by Grade"
                >
                   {sortBy === 'grade' && sortDir === 'desc' ? <ArrowDown01 size={14} /> : <ArrowUp01 size={14} />}
                   <span className="hidden sm:inline">Note</span>
                </button>
             </div>
          </div>

          {/* Die Liste (gefiltert) */}
          {completedModules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-80 hover:opacity-100 transition-opacity">
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
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl text-slate-600">
               <Filter className="mx-auto mb-2 opacity-50" size={32} />
               <p>Keine Module gefunden.</p>
            </div>
          )}
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

      <ShopModal 
        isOpen={isShopOpen} 
        onClose={() => setIsShopOpen(false)} 
      />
      
    </div>
  );
};