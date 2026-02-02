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

if (variant === 'compact') {
    return (
      <div className="pixel-card group relative flex items-center justify-between p-4 bg-slate-800/50 border-slate-700 hover:border-accent/50 hover:bg-slate-800 transition-all duration-300 h-20">
        <div className="flex items-center gap-4 overflow-hidden">
          {/* Icon Box: Nutzt jetzt accent statt emerald */}
          <div className={`shrink-0 w-10 h-10 rounded flex items-center justify-center border-2 transition-colors duration-300 ${
             isCompleted 
               ? 'bg-accent/20 border-accent/50 text-accent shadow-[0_0_10px_var(--theme-shadow-color)]' 
               : 'bg-slate-700 border-slate-600 text-slate-500'
          }`}>
             {isCompleted ? <CheckCircle size={20} /> : <Lock size={20} />}
          </div>
          
          <div className="min-w-0">
             <h3 className="text-sm font-bold text-slate-200 truncate pr-4 group-hover:text-white transition-colors">
                {module.title}
             </h3>
             <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-mono text-amber-500 font-bold">{module.cp} CP</span>
                
                {/* FIX: Wir prüfen explizit auf !== undefined, damit auch Note 0 angezeigt wird */}
                {isCompleted && module.grade !== undefined && module.grade !== null && (
                  <span className="text-accent font-bold animate-pulse">• Grade: {module.grade}</span>
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
             className={`p-2 rounded border-2 transition-all ${
               hasContent 
                 ? 'border-accent/30 text-accent hover:bg-accent/10' 
                 : 'border-slate-600 text-slate-500 hover:bg-slate-700'
             }`}
             title="PDF Context"
           >
             <FileText size={16} />
           </button>
        </div>
      </div>
    );
  }

  // --- 2. DEFAULT VIEW (Active / Dashboard) ---
  // Dynamische Klassenberechnung für den Theme-Look
  let cardClasses = "pixel-card relative h-72 flex flex-col p-5 overflow-hidden group transition-all duration-300 ";
  
  if (isLocked) {
    cardClasses += " opacity-60 grayscale bg-slate-900 border-slate-700";
  } 
  else if (isActive) {
    // Active: Leichter Accent-Rahmen
    cardClasses += " border-accent/50 hover:border-accent hover:shadow-[0_0_15px_var(--theme-shadow-color)] bg-slate-800"; 
  } 
  else if (isCompleted) {
    // Completed: Subtiler Accent-Hintergrund und Leuchten (statt festes Grün)
    cardClasses += " border-accent/60 bg-accent/5 hover:bg-accent/10 shadow-[inset_0_0_20px_var(--theme-shadow-color)]";
  }

  // --- 2. DEFAULT VIEW (Active / Dashboard) ---
  return (
    <div className={cardClasses}>
      
      {/* Header Row */}
      <div className="relative z-10 flex justify-between items-start mb-4">
        <h3 className={`text-lg font-bold leading-tight line-clamp-2 min-h-[3rem] pr-2 transition-colors ${isCompleted ? 'text-accent-hover' : 'text-white'}`}>
          {module.title}
        </h3>
        
        <div className="flex flex-col items-end gap-2 shrink-0">
            {/* CP Badge */}
            <span className="px-2 py-1 bg-amber-400 text-amber-950 text-xs font-black rounded border-2 border-amber-600 shadow-sm">
              {module.cp} CP
            </span>
            
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

        {(isActive || isCompleted) && (
           <div className={`p-4 rounded-full mb-1 transition-all duration-500 ${
             hasContent 
               ? 'bg-accent/20 text-accent scale-110 shadow-[0_0_15px_var(--theme-shadow-color)]' 
               : 'bg-slate-700/50 text-slate-500'
           }`}>
              {isCompleted ? <CheckCircle size={40} /> : <BookOpen size={40} />}
           </div>
        )}

        {!isLocked && (
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
            hasContent 
               ? 'bg-accent/10 text-accent border border-accent/30' 
               : 'bg-slate-700/50 text-slate-500 border border-slate-600'
          }`}>
            <FileText size={10} />
            {hasContent ? 'AI Ready' : 'No PDF'}
          </div>
        )}
      </div>

      {/* Footer Button */}
      {!isLocked && !isCompleted && (
        <button 
          onClick={() => onUploadClick(module.id)}
          className={`nes-btn is-small w-full flex items-center justify-center gap-2 text-xs mt-3 ${
            hasContent ? 'is-primary' : 'is-warning'
          }`}
        >
          <Upload size={12} /> {hasContent ? 'Update PDF' : 'Upload PDF'}
        </button>
      )}
      
      {/* Footer für Completed State */}
      {isCompleted && (
         <div className="w-full text-center mt-3 py-1 border-t border-accent/20 flex justify-center gap-2">
            <span className="text-xs font-bold text-accent uppercase tracking-widest opacity-80">Quest Complete</span>
            {/* Optional: Auch hier Note anzeigen, falls gewünscht */}
            {module.grade !== undefined && module.grade !== null && (
                <span className="text-xs font-black text-white bg-accent/20 px-1.5 rounded">{module.grade}</span>
            )}
         </div>
      )}
    </div>
  );
};