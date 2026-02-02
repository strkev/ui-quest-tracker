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
  const [grade, setGrade] = useState<string>(''); // Neu: Note bearbeiten
  const [status, setStatus] = useState<Module['status']>('active');

  const isEditMode = !!initialModule;

  useEffect(() => {
    if (isOpen && initialModule) {
      // Daten laden für Edit
      setTitle(initialModule.title);
      setCp(initialModule.cp.toString());
      setGrade(initialModule.grade ? initialModule.grade.toString() : '');
      setStatus(initialModule.status);
    } else if (isOpen) {
      // Reset für Create
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
      const moduleData = {
        title,
        cp: parseFloat(cp),
        grade: grade ? parseFloat(grade) : undefined,
        status
      };

      if (isEditMode && initialModule) {
        await db.modules.update(initialModule.id, moduleData);
      } else {
        await db.modules.add({
          id: crypto.randomUUID(),
          ...moduleData,
          status: 'active' // Neue Module starten immer aktiv
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
            {isEditMode ? <span className="text-amber-400">✎ Edit Module</span> : <span className="text-blue-400">+ New Module</span>}
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Titel</label>
            <input type="text" className="nes-input is-dark w-full" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          <div className="flex gap-4">
            {/* CP */}
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">CP</label>
              <input type="number" step="0.5" className="nes-input is-dark w-full" value={cp} onChange={e => setCp(e.target.value)} required />
            </div>
            
            {/* Status (nur im Edit Mode sichtbar) */}
            {isEditMode && (
              <div className="flex-1">
                 <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Status</label>
                 <div className="nes-select is-dark w-full">
                    <select value={status} onChange={(e) => setStatus(e.target.value as any)} required>
                      <option value="active">Active</option>
                      <option value="completed">Done</option>
                      <option value="locked">Locked</option>
                    </select>
                 </div>
              </div>
            )}
          </div>

          {/* Note (nur wenn Status Completed) */}
          {status === 'completed' && (
             <div>
               <label className="block text-xs font-bold text-emerald-400 mb-1 uppercase tracking-wider">Note (Grade)</label>
               <input type="number" step="0.1" min="1.0" max="5.0" className="nes-input is-success w-full" value={grade} onChange={e => setGrade(e.target.value)} placeholder="1.0" />
             </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" className="nes-btn is-error" onClick={onClose}>Cancel</button>
            <button type="submit" className={`nes-btn ${isEditMode ? 'is-warning' : 'is-primary'}`}>
              {isEditMode ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};