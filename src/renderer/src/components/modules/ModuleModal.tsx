import React, { useState, useEffect } from 'react';
import { db, Module } from '../../db/db';
import { Trash2, Save, X } from 'lucide-react';
import { GamificationService } from '../../services/GamificationService';

interface ModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialModule?: Module | null;
}

export const ModuleModal: React.FC<ModuleModalProps> = ({ isOpen, onClose, initialModule }) => {
  const [title, setTitle] = useState('');
  const [cp, setCp] = useState<string>('5');
  const [grade, setGrade] = useState<string>('');
  const [status, setStatus] = useState<Module['status']>('active');

  const isEditMode = !!initialModule;

  useEffect(() => {
    if (isOpen && initialModule) {
      setTitle(initialModule.title);
      setCp(initialModule.cp.toString());
      setGrade(initialModule.grade ? initialModule.grade.toString() : '');
      setStatus(initialModule.status);
    } else if (isOpen) {
      setTitle('');
      setCp('5');
      setGrade('');
      setStatus('active');
    }
  }, [isOpen, initialModule]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cpValue = parseFloat(cp);
      const gradeValue = grade ? parseFloat(grade) : undefined;
      
      // LOGIK: XP Management
      // Bei Erstellung (initialModule ist null) ist status !== undefined immer true
      const isCompletingNow = status === 'completed' && initialModule?.status !== 'completed';
      const isUnCompleting = initialModule?.status === 'completed' && status !== 'completed';
      const alreadyAwarded = initialModule?.xpAwarded || false;
      
      let newXpAwardedState = alreadyAwarded;

      // Fall 1: Modul wird abgeschlossen (oder direkt als Done erstellt) -> XP geben
      if (isCompletingNow && !alreadyAwarded && gradeValue) {
        const rewardXP = GamificationService.calculateModuleReward(cpValue, gradeValue);
        const { levelUp } = await GamificationService.addXP(rewardXP);
        alert(`Glückwunsch! Du hast ${rewardXP} XP erhalten!${levelUp ? '\nLEVEL UP!' : ''}`);
        newXpAwardedState = true;
      }

      // Fall 2: Modul wird zurückgesetzt -> XP abziehen
      if (isUnCompleting && alreadyAwarded && initialModule?.grade) {
        const xpToDeduct = GamificationService.calculateModuleReward(initialModule.cp, initialModule.grade);
        await GamificationService.removeXP(xpToDeduct);
        alert(`Status geändert: ${xpToDeduct} XP wurden wieder abgezogen.`);
        newXpAwardedState = false;
      }

      const moduleData = {
        title,
        cp: cpValue,
        grade: gradeValue,
        status,
        xpAwarded: newXpAwardedState
      };

      if (isEditMode && initialModule) {
        await db.modules.update(initialModule.id, moduleData);
      } else {
        await db.modules.add({
          id: crypto.randomUUID(),
          ...moduleData,
          // WICHTIG: Hier stand vorher status: 'active'. Das haben wir gelöscht.
          // Jetzt wird moduleData.status genommen (was 'completed' sein kann).
        });
      }
      
      onClose();
    } catch (error) {
      console.error("Failed to save module:", error);
    }
  };

  const handleDelete = async () => {
    if (initialModule && confirm('Willst du dieses Modul wirklich löschen?')) {
      await db.modules.delete(initialModule.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans animate-in fade-in duration-200">
      <div className="pixel-card bg-slate-800 max-w-lg w-full relative p-0 border-slate-600 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900/50 p-6 border-b-2 border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
              {isEditMode ? <span className="text-amber-400">✎ Edit Module</span> : <span className="text-blue-400">+ New Quest</span>}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Modul Name</label>
            <input 
              type="text" 
              className="nes-input is-dark w-full text-lg font-bold" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="z.B. Software Engineering II"
              required 
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Credit Points (CP)</label>
              <div className="relative">
                <input 
                  type="number" step="0.5" 
                  className="nes-input is-dark w-full pr-10" 
                  value={cp} 
                  onChange={e => setCp(e.target.value)} 
                  required 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold pointer-events-none">CP</span>
              </div>
            </div>
            
            <div className={`transition-opacity duration-300 ${status === 'completed' ? 'opacity-100' : 'opacity-30 grayscale'}`}>
               <label className="block text-xs font-bold text-emerald-400 mb-2 uppercase tracking-wider">Note (Grade)</label>
               <input 
                 type="number" step="0.1" min="1.0" max="5.0" 
                 className="nes-input is-success w-full" 
                 value={grade} 
                 onChange={e => setGrade(e.target.value)} 
                 placeholder="-"
                 disabled={status !== 'completed'}
               />
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Status</label>
             <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`flex-1 py-2 px-3 rounded border-2 text-sm font-bold transition-all ${status === 'active' ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                >
                  Running
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('locked')}
                  className={`flex-1 py-2 px-3 rounded border-2 text-sm font-bold transition-all ${status === 'locked' ? 'bg-slate-600 border-slate-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                >
                  Locked
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('completed')}
                  className={`flex-1 py-2 px-3 rounded border-2 text-sm font-bold transition-all ${status === 'completed' ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                >
                  Done
                </button>
             </div>
          </div>

          <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-700">
            {isEditMode ? (
              <button type="button" onClick={handleDelete} className="text-red-500 hover:text-red-400 flex items-center gap-2 text-sm font-bold px-2 py-2 rounded hover:bg-red-500/10 transition-colors">
                <Trash2 size={16} /> Delete
              </button>
            ) : <div></div>}
            
            <div className="flex gap-3">
              <button type="button" className="px-4 py-2 rounded text-slate-400 hover:text-white font-bold transition-colors" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className={`nes-btn ${status === 'completed' ? 'is-success' : 'is-primary'} flex items-center gap-2`}>
                <Save size={16} /> {isEditMode ? 'Save Changes' : 'Create Module'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};