import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { X, CheckCheck, Calendar } from 'lucide-react';
import { format } from 'date-fns'; // Falls du date-fns hast, sonst nimm natives JS Date

interface QuestArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuestArchiveModal: React.FC<QuestArchiveModalProps> = ({ isOpen, onClose }) => {
  // Wir laden alle erledigten Quests, sortiert nach Datum (neueste oben)
  const archivedQuests = useLiveQuery(() => 
    db.quests
      .filter(q => q.isCompleted)
      .reverse() // Dexie sortiert standardmäßig aufsteigend, wir drehen es um (Trick für einfaches Sortieren ohne Index)
      .toArray()
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans animate-in fade-in duration-200">
      <div className="pixel-card bg-slate-800 max-w-2xl w-full h-[80vh] relative p-0 border-slate-600 shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900/50 p-6 border-b-2 border-slate-700 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
               <span className="text-emerald-400">📜 Quest Log</span>
            </h2>
            <p className="text-slate-400 text-sm mt-1">Deine glorreiche Historie</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        {/* Scrollable List */}
        <div className="p-6 overflow-y-auto flex-grow flex flex-col gap-3 custom-scrollbar">
          {archivedQuests && archivedQuests.length > 0 ? (
            archivedQuests.map(quest => (
              <div key={quest.id} className="pixel-card p-4 bg-slate-800 border-slate-700 flex gap-4 items-center opacity-70 hover:opacity-100 transition-opacity">
                
                {/* Icon Box */}
                <div className="shrink-0 w-10 h-10 rounded bg-emerald-900/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                   <CheckCheck size={20} />
                </div>

                {/* Content */}
                <div className="flex-grow">
                   <div className="flex justify-between items-start mb-1">
                      <span className="badge is-success text-[9px] uppercase">{quest.type}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(quest.generatedAt).toLocaleDateString()}
                      </span>
                   </div>
                   <p className="text-sm font-bold text-slate-300 line-through decoration-slate-500 decoration-2">{quest.content}</p>
                </div>

                {/* XP Reward */}
                <div className="shrink-0 text-right">
                    <span className="text-xs font-black text-amber-500 block">+{quest.xpReward} XP</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 py-10">
               <p>Noch keine Quests erledigt.</p>
               <p className="text-xs mt-2">Geh lernen!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};