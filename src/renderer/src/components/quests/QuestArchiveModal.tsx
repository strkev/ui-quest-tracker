import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { X, Calendar, MessageSquare, CheckCircle2, Search, ChevronDown, ChevronUp, User, Bot } from 'lucide-react';

interface QuestArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuestArchiveModal: React.FC<QuestArchiveModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const completedQuests = useLiveQuery(async () => {
    // FIX: Statt .where('isCompleted').equals(true) nutzen wir den Datums-Index
    // Das umgeht den TypeScript-Fehler und sortiert direkt richtig.
    const quests = await db.quests
      .orderBy('generatedAt')
      .reverse() // Neueste zuerst
      .filter(q => q.isCompleted) // Filterung auf JS-Ebene (sehr schnell hier)
      .toArray();
      
    if (!searchTerm) return quests;
    
    return quests.filter(q => 
      q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.userAnswer && q.userAnswer.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm]);

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans animate-in fade-in duration-200">
      <div 
        className="pixel-card w-full max-w-2xl bg-slate-900 border-slate-700 shadow-2xl flex flex-col max-h-[85vh] rounded-2xl overflow-hidden"
        style={{ borderColor: 'var(--theme-primary)' }}
      >
        
        {/* HEADER */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/95 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
              <span className="text-slate-400"><MessageSquare size={24} /></span>
              Quest Log
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-bold uppercase tracking-wider">
               Vergangene Erfolge & Wissen
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-800">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Suche in Fragen & Antworten..." 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-accent focus:outline-none transition-all placeholder:text-slate-600"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        
        {/* LISTE */}
        <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-950/30">
           {!completedQuests || completedQuests.length === 0 ? (
             <div className="text-center py-12 text-slate-500 opacity-60">
                <p>Noch keine Quests abgeschlossen.</p>
             </div>
           ) : (
             completedQuests.map(quest => {
                const isExpanded = expandedId === quest.id;
                const hasDetails = !!quest.userAnswer;

                return (
                  <div 
                    key={quest.id} 
                    className={`bg-slate-800/80 border transition-all duration-300 rounded-xl overflow-hidden ${
                        isExpanded ? 'border-accent shadow-[0_0_20px_rgba(0,0,0,0.3)]' : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {/* CARD HEADER (Clickable) */}
                    <div 
                        onClick={() => toggleExpand(quest.id)}
                        className="p-4 cursor-pointer flex gap-4 items-start group"
                    >
                        <div className={`mt-1 ${isExpanded ? 'text-accent' : 'text-emerald-500 opacity-70 group-hover:opacity-100'}`}>
                            <CheckCircle2 size={20} />
                        </div>
                        
                        <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                   <Calendar size={10} /> 
                                   {quest.generatedAt ? new Date(quest.generatedAt).toLocaleDateString() : 'Unbekannt'}
                                   <span className="text-slate-600">•</span>
                                   <span className={quest.type === 'review' ? 'text-amber-500' : 'text-blue-400'}>{quest.type}</span>
                                </span>
                                {hasDetails && !isExpanded && (
                                    <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600 flex items-center gap-1">
                                        <MessageSquare size={8} /> Mit Antwort
                                    </span>
                                )}
                            </div>
                            
                            <p className={`text-sm font-bold text-slate-200 transition-colors ${isExpanded ? 'text-white' : ''}`}>
                                {quest.content}
                            </p>
                        </div>

                        <div className="text-slate-600 group-hover:text-white transition-colors self-center">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                    </div>

                    {/* EXPANDED DETAILS (Antwort & KI Feedback) */}
                    {isExpanded && (
                        <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                            {hasDetails ? (
                                <div className="space-y-3 mt-2 border-t border-slate-700/50 pt-3">
                                    
                                    {/* USER ANSWER */}
                                    <div className="flex gap-3">
                                        <div className="shrink-0 mt-0.5">
                                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 border border-slate-600">
                                                <User size={12} />
                                            </div>
                                        </div>
                                        <div className="bg-slate-700/30 rounded-lg p-3 rounded-tl-none border border-slate-700 w-full">
                                            <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Deine Antwort</p>
                                            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{quest.userAnswer}</p>
                                        </div>
                                    </div>

                                    {/* AI FEEDBACK */}
                                    {quest.aiFeedback && (
                                        <div className="flex gap-3">
                                            <div className="shrink-0 mt-0.5">
                                                <div className="w-6 h-6 rounded-full bg-emerald-900/50 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                                                    <Bot size={14} />
                                                </div>
                                            </div>
                                            <div className="bg-emerald-950/20 rounded-lg p-3 rounded-tl-none border border-emerald-500/20 w-full relative overflow-hidden">
                                                {/* Deko-Glow */}
                                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/50 to-transparent opacity-50"></div>
                                                
                                                <p className="text-xs font-bold text-emerald-500 mb-1 uppercase tracking-wider flex items-center gap-2">
                                                    KI Tutor Feedback
                                                </p>
                                                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{quest.aiFeedback}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-2 p-3 text-center border-t border-slate-700/50 pt-4">
                                    <p className="text-xs text-slate-500 italic">Diese Quest wurde direkt abgehakt (ohne Texteingabe).</p>
                                </div>
                            )}
                        </div>
                    )}
                  </div>
                );
             })
           )}
        </div>
      </div>
    </div>
  );
};