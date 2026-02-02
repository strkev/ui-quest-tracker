import React, { useState } from 'react';
import { db } from '../../db/db';

interface AddModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddModuleModal: React.FC<AddModuleModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  // State kann nun auch Kommazahlen halten
  const [cp, setCp] = useState<string>('5'); // Als String speichern für bessere Input-Kontrolle

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.modules.add({
        id: crypto.randomUUID(),
        title,
        cp: parseFloat(cp), // Hier wandeln wir den String in eine Zahl (Float) um
        status: 'active',
      });
      setTitle('');
      setCp('5');
      onClose();
    } catch (error) {
      console.error("Failed to add module:", error);
    }
  };

return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
      {/* Wir nutzen auch hier unsere neue .pixel-card Klasse */}
      <div className="pixel-card bg-slate-800 max-w-md w-full relative p-6 border-slate-600">
        <h2 className="text-2xl font-extrabold mb-6 text-white flex items-center gap-2">
            <span className="text-blue-400">+</span> New Module
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="title_field" className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Module Title</label>
            {/* NES Input is-dark passt hier gut */}
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
            <button type="submit" className="nes-btn is-primary">
              Create Module
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};