import React from 'react';
import { Module } from '../../db/db';
import { BookOpen, CheckCircle, Lock, Upload, Pencil } from 'lucide-react'; // <--- Pencil importiert

interface ModuleItemProps {
  module: Module;
  onUploadClick: (id: string) => void;
  onEditClick: (module: Module) => void; // <--- Neue Prop
}

export const ModuleItem: React.FC<ModuleItemProps> = ({ module, onUploadClick, onEditClick }) => {
  const isLocked = module.status === 'locked';
  const isCompleted = module.status === 'completed';
  const isActive = module.status === 'active';
  const hasContent = !!module.extractedContent;

  const displayCP = module.cp % 1 !== 0 ? module.cp.toFixed(1) : module.cp;

  let cardClasses = "pixel-card relative h-72 flex flex-col p-5 overflow-hidden group";
  let bgGlow = "";

  if (isLocked) {
    cardClasses += " opacity-60 grayscale bg-slate-900";
  } else if (isActive) {
    bgGlow = "absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity";
    cardClasses += " border-blue-500/50 shadow-[4px_4px_0px_0px_rgba(59,130,246,0.4)] hover:shadow-[2px_2px_0px_0px_rgba(59,130,246,0.6)]";
  } else if (isCompleted) {
    cardClasses += " border-emerald-600/50 bg-slate-800/80";
  }

  return (
    <div className={cardClasses}>
        {bgGlow && <div className={bgGlow}></div>}

        {/* --- EDIT BUTTON (Oben Rechts) --- */}
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Verhindert Klicks auf die Karte darunter
            onEditClick(module);
          }}
          className="absolute top-2 right-2 z-20 p-2 text-slate-500 hover:text-white bg-slate-900/50 hover:bg-slate-700 rounded transition-colors opacity-0 group-hover:opacity-100"
          title="Edit Module"
        >
          <Pencil size={14} />
        </button>
        
      {/* Header */}
      <div className="relative z-10 flex justify-between items-start mb-4 pr-8"> {/* pr-8 damit Text nicht unter Edit Button rutscht */}
        <h3 className={`text-xl font-bold leading-tight line-clamp-2 ${isCompleted ? 'text-emerald-300' : 'text-white'}`}>
          {module.title}
        </h3>
        
        <span className="shrink-0 ml-2 px-3 py-1 bg-amber-400 text-amber-950 text-sm font-extrabold rounded border-2 border-amber-600 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
          {displayCP} CP
        </span>
      </div>

      {/* Center Icon */}
      <div className="flex-grow flex items-center justify-center relative z-10 my-4 text-slate-300">
        {isLocked && <Lock size={64} className="text-slate-600" />}
        {isCompleted && (
          <div className="text-center text-emerald-400 flex flex-col items-center">
            <CheckCircle size={64} className="mb-2 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
            <span className="text-3xl font-black tracking-tighter">Grade: {module.grade}</span>
          </div>
        )}
        {isActive && (
           <div className="text-center flex flex-col items-center">
             <div className={`p-3 rounded-full mb-2 ${hasContent ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-500 animate-pulse'}`}>
                <BookOpen size={48} />
             </div>
             <p className="text-sm font-semibold uppercase tracking-wider text-blue-300">
                {hasContent ? 'Lernbereit' : 'Warte auf PDF...'}
             </p>
           </div>
        )}
      </div>

      {/* Footer Button */}
      {isActive && (
        <button 
          onClick={() => onUploadClick(module.id)}
          className={`nes-btn w-full flex items-center justify-center gap-2 text-sm font-bold relative z-10 ${hasContent ? 'is-primary' : ''}`}
        >
          <Upload size={16} /> {hasContent ? 'Update PDF' : 'Upload PDF'}
        </button>
      )}
    </div>
  );
};