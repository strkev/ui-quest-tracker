import React, { useState, useRef } from 'react';
import { Settings, Download, Upload, User, LogOut, FileJson } from 'lucide-react';
import { DataService } from '../services/DataService';

export const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    await DataService.exportData();
    setIsOpen(false);
  };

  const handleImportClick = () => {
    // Klick auf das versteckte Input-Feld weiterleiten
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (confirm("WARNUNG: Dies wird deine aktuellen Daten überschreiben! Bist du sicher?")) {
      const success = await DataService.importData(file);
      if (success) {
        alert("Daten erfolgreich importiert! Die App wird neu geladen.");
        window.location.reload(); // Reload erzwingen, um UI zu aktualisieren
      }
    }
    // Reset input value damit man die gleiche Datei nochmal wählen kann wenn nötig
    event.target.value = '';
    setIsOpen(false);
  };

  return (
    <div className="relative z-50">
      {/* Avatar Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-600 hover:border-accent hover:text-accent transition-all overflow-hidden shadow-lg"
        title="User Menu & Settings"
      >
        <User size={20} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay zum Schließen beim Klicken außerhalb */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          
          <div className="absolute right-0 top-12 w-56 pixel-card bg-slate-800 p-2 z-50 border-slate-600 shadow-2xl animate-in slide-in-from-top-2 duration-200">
            <div className="px-3 py-2 border-b border-slate-700 mb-2">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daten & Einstellungen</span>
            </div>

            <button 
              onClick={handleExport}
              className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-300 hover:bg-slate-700 hover:text-white rounded transition-colors"
            >
              <Download size={16} /> Backup erstellen
            </button>

            <button 
              onClick={handleImportClick}
              className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-300 hover:bg-slate-700 hover:text-white rounded transition-colors"
            >
              <Upload size={16} /> Backup laden
            </button>

            {/* Hidden Input für Datei-Auswahl */}
            <input 
               type="file" 
               accept=".json" 
               ref={fileInputRef} 
               onChange={handleFileChange} 
               className="hidden" 
            />

            <div className="h-px bg-slate-700 my-2"></div>
            
            <div className="px-3 py-2 text-[10px] text-slate-500 text-center">
               Version 1.1 • Local Storage
            </div>
          </div>
        </>
      )}
    </div>
  );
};