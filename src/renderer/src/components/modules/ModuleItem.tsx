import React from 'react';
import { Module } from '../../db/db';
import { BookOpen, CheckCircle, Lock, Upload, Pencil, FileText } from 'lucide-react';

interface ModuleItemProps {
  module: Module;
  variant?: 'default' | 'compact';
  onUploadClick: (id: string) => void;
  onEditClick: (module: Module) => void;
}

export const ModuleItem: React.FC<ModuleItemProps> = ({ module, variant = 'default', onUploadClick, onEditClick }) => {
  const isLocked = module.status === 'locked';
  const isCompleted = module.status === 'completed';
  const isActive = module.status === 'active';
  const hasContent = !!module.extractedContent;

  // --- COMPACT VIEW (Completed) ---
  if (variant === 'compact') {
    return (
      <div className="pixel-card group relative flex items-center justify-between p-4 bg-slate-800/50 border-slate-700 hover:bg-slate-800 transition-colors h-20">
        <div className="flex items-center gap-4 overflow-hidden">
          <div className={`shrink-0 w-10 h-10 rounded flex items-center justify-center border-2 ${isCompleted ? 'bg-emerald-900/50 border-emerald-500/50 text-emerald-400' : 'bg-slate-700 border-slate-600 text-slate-500'}`}>
             {isCompleted ? <CheckCircle size={20} /> : <Lock size={20} />}
          </div>
          <div className="min-w-0">
             <h3 className="text-sm font-bold text-slate-200 truncate pr-4">{module.title}</h3>
             <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-mono text-amber-500">{module.cp} CP</span>
                {isCompleted && module.grade && (
                  <span className="text-emerald-400 font-bold">• Grade: {module.grade}</span>
                )}
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
           <button 
             onClick={(e) => { e.stopPropagation(); onEditClick(module); }}
             className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded transition-colors opacity-0 group-hover:opacity-100"
           >
             <Pencil size={14} />
           </button>
           
           <button 
             onClick={() => onUploadClick(module.id)}
             className={`p-2 rounded border-2 transition-all ${hasContent ? 'border-blue-500/30 text-blue-400 hover:bg-blue-500/20' : 'border-slate-600 text-slate-500 hover:bg-slate-700'}`}
             title="PDF Context"
           >
             <FileText size={16} />
           </button>
        </div>
      </div>
    );
  }

  let cardClasses = "pixel-card relative h-72 flex flex-col p-5 overflow-hidden group transition-all";
  
  if (isLocked) cardClasses += " opacity-60 grayscale bg-slate-900";
  else if (isActive) cardClasses += " border-accent/50"; 
  else if (isCompleted) cardClasses += " border-emerald-600/50 bg-slate-800/80";

  return (
    <div className={cardClasses}>
      
      {/* Header Row (Titel + CP + Edit) */}
      <div className="relative z-10 flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold leading-tight line-clamp-2 text-white min-h-[3rem] pr-2">
          {module.title}
        </h3>
        
        <div className="flex flex-col items-end gap-2 shrink-0">
            {/* CP Badge */}
            <span className="px-2 py-1 bg-amber-400 text-amber-950 text-xs font-black rounded border-2 border-amber-600 shadow-sm">
            {module.cp} CP
            </span>
            
            {/* FIX: Edit Button jetzt aligned unter CP oder daneben, sauber positioniert */}
            <button 
                onClick={(e) => { e.stopPropagation(); onEditClick(module); }}
                className="p-1.5 text-slate-500 hover:text-white bg-slate-900/50 hover:bg-slate-700 rounded transition-all opacity-0 group-hover:opacity-100"
                title="Edit Module"
            >
                <Pencil size={14} />
            </button>
        </div>
      </div>

      {/* Center Content */}
      <div className="flex-grow flex flex-col items-center justify-center relative z-10 text-slate-300 gap-2">
        {isLocked && <Lock size={48} />}

        {isActive && (
           <div className={`p-4 rounded-full mb-1 transition-colors ${hasContent ? 'bg-accent/20 text-accent' : 'bg-slate-700 text-slate-500'}`}>
              <BookOpen size={40} />
           </div>
        )}

        {!isLocked && (
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${hasContent ? 'bg-accent/10 text-accent border border-accent/30' : 'bg-slate-700/50 text-slate-500 border border-slate-600'}`}>
            <FileText size={10} />
            {hasContent ? 'AI Ready' : 'No PDF'}
          </div>
        )}
      </div>

      {/* Footer Button */}
      {!isLocked && (
        <button 
          onClick={() => onUploadClick(module.id)}
          className={`nes-btn is-small w-full flex items-center justify-center gap-2 text-xs mt-3 ${hasContent ? (isActive ? 'is-primary' : '') : (isActive ? 'is-warning' : '')}`}
        >
          <Upload size={12} /> {hasContent ? 'Update' : 'Upload'}
        </button>
      )}
    </div>
  );
};