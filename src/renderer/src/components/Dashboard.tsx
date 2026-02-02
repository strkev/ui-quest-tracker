import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { ModuleItem } from './modules/ModuleItem';
import { AddModuleModal } from './modules/AddModuleModal';
import { Plus } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // DEXIE HOOK: Automatische Updates bei Datenbank-Änderungen
  const modules = useLiveQuery(() => db.modules.toArray());

  const handlePdfUpload = async (moduleId: string) => {
    // Hier rufen wir später unsere Electron API auf
    try {
      const filePath = await window.api.selectPdf();
      if (!filePath) return;

      console.log(`Processing PDF for Module ${moduleId}: ${filePath}`);
      
      const result = await window.api.parsePdf(filePath);
      
      if (result.success && result.text) {
        // Speichere den Text in der Datenbank
        await db.modules.update(moduleId, {
          pdfPath: filePath,
          extractedContent: result.text,
          // Optional: Status auf 'completed' setzen oder so lassen?
          // Fürs erste lassen wir es 'active', markieren aber, dass Content da ist.
        });
        alert('PDF Parsed & Saved successfully!');
      } else {
        alert('Error parsing PDF: ' + result.error);
      }

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto text-slate-100">
      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-5xl font-extrabold mb-2 tracking-tight text-white flex items-center gap-3">
             {/* Icon ein bisschen leuchten lassen */}
            <i className="nes-icon trophy is-medium drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]"></i> 
            Skill Tree
          </h1>
          <p className="text-slate-400 text-lg">Dein akademischer Fortschritt</p>
        </div>
        
        {/* Stats Container im neuen Look */}
        <div className="pixel-card px-6 py-3 flex gap-6 bg-slate-800 text-amber-400 font-bold text-xl">
             <div className="flex flex-col items-center">
                <span className="text-xs text-slate-400 uppercase tracking-wider">XP</span>
                <span>1250</span>
             </div>
             <div className="w-px bg-slate-600"></div>
             <div className="flex flex-col items-center">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Level</span>
                <span>3</span>
             </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        
        {modules?.map((mod) => (
          <ModuleItem key={mod.id} module={mod} onUploadClick={handlePdfUpload} />
        ))}

        {/* Der "Add New" Button im neuen Design */}
        <button 
          onClick={() => setIsModalOpen(true)}
          // Wir nutzen hier die neue .pixel-card Klasse, aber mit gestricheltem Rahmen
          className="pixel-card border-dashed border-4 border-slate-600 bg-slate-800/50 text-slate-500 flex flex-col items-center justify-center h-72 hover:bg-slate-800/80 hover:text-slate-300 hover:border-slate-400 cursor-pointer group"
        >
          <Plus size={64} className="mb-4 group-hover:scale-110 transition-transform" />
          <span className="text-xl font-bold">Add Module</span>
        </button>

      </div>

      <AddModuleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};