import React, { useState, useEffect } from 'react';
import { db, Module } from '../../db/db';

interface ModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialModule?: Module | null; // Wenn gesetzt, sind wir im "Edit Mode"
}

export const ModuleModal: React.FC<ModuleModalProps> = ({ isOpen, onClose, initialModule }) => {
  const [title, setTitle] = useState('');
  const [cp, setCp] = useState<string>('5');
  
  // Prüfen: Sind wir im Edit-Mode?
  const isEditMode = !!initialModule;

  // Wenn sich das Modal öffnet oder das Module ändert, Felder füllen
  useEffect(() => {
    if (isOpen && initialModule) {
      setTitle(initialModule.title);
      setCp(initialModule.cp.toString());
    } else if (isOpen && !initialModule) {
      // Reset für "Add Mode"
      setTitle('');
      setCp('5');
    }
  }, [isOpen, initialModule]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && initialModule) {
        // --- EDIT LOGIK ---
        await db.modules.update(initialModule.id, {
          title,
          cp: parseFloat(cp)
        });
      } else {
        // --- CREATE LOGIK ---
        await db.modules.add({
          id: crypto.randomUUID(),
          title,
          cp: parseFloat(cp),
          status: 'active', // Default
        });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save module:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
      <div className="pixel-card bg-slate-800 max-w-md w-full relative p-6 border-slate-600 shadow-2xl">
        <h2 className="text-2xl font-extrabold mb-6 text-white flex items-center gap-2">
            {isEditMode ? (
              <span className="text-amber-400">✎ Edit Module</span>
            ) : (
              <>
                <span className="text-blue-400">+</span> New Module
              </>
            )}
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="title_field" className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Module Title</label>
            <input 
              type="text" 
              id="title_field" 
              className="nes-input is-dark w-full text-white bg-slate-900 border-slate-700 focus:border-blue-500" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Advanced Algorithms"
              required
            />
          </div>

          <div>
            <label htmlFor="cp_field" className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Credit Points</label>
            <input 
              type="number" 
              id="cp_field" 
              className="nes-input is-dark w-full text-white bg-slate-900 border-slate-700 focus:border-blue-500" 
              value={cp}
              step="0.5"
              min="0.5"
              onChange={(e) => setCp(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button type="button" className="nes-btn is-error" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={`nes-btn ${isEditMode ? 'is-warning' : 'is-primary'}`}>
              {isEditMode ? 'Save Changes' : 'Create Module'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};