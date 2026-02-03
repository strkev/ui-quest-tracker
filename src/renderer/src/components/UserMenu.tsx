import React, { useState, useRef } from 'react';
import { Download, Upload, User, Trash2, RotateCcw, ShieldAlert } from 'lucide-react';
import { DataService } from '../services/DataService';
import { db } from '../db/db';

export const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- EXISTIERENDE EXPORT/IMPORT LOGIK ---
  const handleExport = async () => {
    await DataService.exportData();
    setIsOpen(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (confirm("WARNUNG: Dies wird deine aktuellen Daten überschreiben! Bist du sicher?")) {
      const success = await DataService.importData(file);
      if (success) {
        alert("Daten erfolgreich importiert! Die App wird neu geladen.");
        window.location.reload();
      }
    }
    event.target.value = '';
    setIsOpen(false);
  };

  // --- NEUE RESET FUNKTIONEN ---

  const handleResetQuests = async () => {
    if (confirm("Bist du sicher? Alle Quests (offen & erledigt) werden unwiderruflich gelöscht.")) {
      try {
        await db.quests.clear();
        alert("Quest-Log wurde erfolgreich geleert.");
      } catch (e) {
        console.error(e);
        alert("Fehler beim Löschen der Quests.");
      }
      setIsOpen(false);
    }
  };

  const handleResetHallOfFame = async () => {
    if (confirm("Möchtest du alle Module aus der Hall of Fame zurücksetzen? Sie werden wieder 'Active' und verlieren ihre Note.")) {
      try {
        // Finde alle abgeschlossenen Module
        const completedModules = await db.modules.where('status').equals('completed').toArray();
        
        if (completedModules.length === 0) {
           alert("Keine abgeschlossenen Module gefunden.");
           setIsOpen(false);
           return;
        }

        // Führe das Update in einer Transaktion durch
        await db.transaction('rw', db.modules, async () => {
           for (const mod of completedModules) {
               await db.modules.update(mod.id, {
                   status: 'active',
                   grade: undefined, // Note entfernen
                   // xpAwarded lassen wir ggf. bestehen oder entfernen es auch, 
                   // je nachdem ob man XP "doppelt" farmen darf. 
                   // Hier entfernen wir es nicht explizit, damit der User nicht bestraft wird.
               });
           }
        });
        
        alert(`${completedModules.length} Module wurden zu 'Active Studies' zurückverschoben.`);
      } catch (e) {
        console.error(e);
        alert("Fehler beim Zurücksetzen.");
      }
      setIsOpen(false);
    }
  };

  return (
    <div className="relative z-50">
      {/* Button zum Öffnen */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-600 hover:border-accent hover:text-accent transition-all overflow-hidden shadow-lg"
        title="User Menü & Einstellungen"
      >
        <User size={20} />
      </button>

      {/* Dropdown Menü */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          
          <div className="absolute right-0 top-12 w-64 pixel-card bg-slate-800 p-2 z-50 border-slate-600 shadow-2xl animate-in slide-in-from-top-2 duration-200">
            
            {/* SEKTION: DATEN */}
            <div className="px-3 py-2 border-b border-slate-700 mb-1">
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Daten & Backup</span>
            </div>

            <button 
              onClick={handleExport}
              className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-300 hover:bg-slate-700 hover:text-white rounded transition-colors"
            >
              <Download size={16} className="text-blue-400" /> Backup erstellen
            </button>

            <button 
              onClick={handleImportClick}
              className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-300 hover:bg-slate-700 hover:text-white rounded transition-colors"
            >
              <Upload size={16} className="text-emerald-400" /> Backup laden
            </button>

            {/* SEKTION: RESET AREA */}
            <div className="px-3 py-2 border-b border-slate-700 mt-3 mb-1">
               <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                 <ShieldAlert size={10} /> Reset Area
               </span>
            </div>

            <button 
              onClick={handleResetQuests}
              className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-300 hover:bg-red-900/30 hover:text-red-400 rounded transition-colors group"
            >
              <Trash2 size={16} className="text-slate-500 group-hover:text-red-500 transition-colors" /> 
              Quests löschen
            </button>

            <button 
              onClick={handleResetHallOfFame}
              className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-300 hover:bg-red-900/30 hover:text-red-400 rounded transition-colors group"
            >
              <RotateCcw size={16} className="text-slate-500 group-hover:text-red-500 transition-colors" /> 
              Hall of Fame Reset
            </button>

            {/* Hidden File Input */}
            <input 
               type="file" 
               accept=".json" 
               ref={fileInputRef} 
               onChange={handleFileChange} 
               className="hidden" 
            />

            <div className="h-px bg-slate-700 my-2"></div>
            
            <div className="px-3 py-1 text-[10px] text-slate-600 text-center font-mono">
               v1.2 • Local Storage
            </div>
          </div>
        </>
      )}
    </div>
  );
};