import React from 'react';
import { Module } from '../../db/db';
import { BookOpen, CheckCircle, Lock, Upload, Pencil, FileText } from 'lucide-react';

interface ModuleItemProps {
  module: Module;
  onUploadClick: (id: string) => void;
  onEditClick: (module: Module) => void;
}

export const ModuleItem: React.FC<ModuleItemProps> = ({ module, onUploadClick, onEditClick }) => {
  const isLocked = module.status === 'locked';
  const isCompleted = module.status === 'completed';
  const isActive = module.status === 'active';
  const hasContent = !!module.extractedContent;

  let cardClasses = "pixel-card relative h-80 flex flex-col p-5 overflow-hidden group transition-all hover:-translate-y-1 ";
  
  if (isLocked) {
    cardClasses += " opacity-60 grayscale bg-slate-900";
  } else if (isActive) {
    cardClasses += " border-blue-500/50 shadow-[4px_4px_0px_0px_rgba(59,130,246,0.4)] hover:shadow-[2px_2px_0px_0px_rgba(59,130,246,0.6)]";
  } else if (isCompleted) {
    cardClasses += " border-emerald-600/50 bg-slate-800/80";
  }

  return (
    <div className={cardClasses}>
      {/* Edit Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onEditClick(module); }}
        className="absolute top-2 right-2 z-20 p-2 text-slate-500 hover:text-white bg-slate-900/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Pencil size={14} />
      </button>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-start mb-4 pr-6">
        <h3 className={`text-lg font-bold leading-tight line-clamp-2 ${isCompleted ? 'text-emerald-300' : 'text-white'}`}>
          {module.title}
        </h3>
        <span className="shrink-0 ml-2 px-2 py-1 bg-amber-400 text-amber-950 text-xs font-black rounded border-2 border-amber-600 shadow-sm">
          {module.cp} CP
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col items-center justify-center relative z-10 text-slate-300 gap-2">
        
        {/* Fall 1: Locked */}
        {isLocked && <Lock size={48} />}

        {/* Fall 2: Completed (Zeige Note UND AI Status) */}
        {isCompleted && (
          <div className="flex flex-col items-center mb-2">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
               <CheckCircle size={24} />
               <span className="text-3xl font-black"> {module.grade?.toFixed(1) || '-'}</span>
            </div>
            <span className="text-xs uppercase tracking-widest text-emerald-600 font-bold">Grade</span>
          </div>
        )}

        {/* Fall 3: Active (Großes Icon) */}
        {isActive && (
           <div className={`p-4 rounded-full mb-1 ${hasContent ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-500'}`}>
              <BookOpen size={40} />
           </div>
        )}

        {/* AI Status Badge (Immer sichtbar, außer Locked) */}
        {!isLocked && (
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${hasContent ? 'bg-blue-900/50 text-blue-300 border border-blue-500/30' : 'bg-slate-700/50 text-slate-500 border border-slate-600'}`}>
            <FileText size={10} />
            {hasContent ? 'Lern-Daten verfügbar' : 'Keine Daten'}
          </div>
        )}

      </div>

      {/* Footer: Upload Button (Sichtbar für Active UND Completed) */}
      {!isLocked && (
        <button 
          onClick={() => onUploadClick(module.id)}
          className={`nes-btn is-small w-full flex items-center justify-center gap-2 text-xs mt-2 ${hasContent ? (isActive ? 'is-primary' : '') : (isActive ? 'is-warning' : '')}`}
        >
          <Upload size={12} /> {hasContent ? 'Update PDF' : 'Upload PDF'}
        </button>
      )}
    </div>
  );
};