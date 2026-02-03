import React, { useState, useEffect, useRef } from 'react';
import { db, Module } from '../../db/db';
import { Trash2, Save, X, Star, Pencil, Plus, Upload, Eye, FileText } from 'lucide-react';
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
  
  const [extractedContent, setExtractedContent] = useState<string>('');
  const [showContentPreview, setShowContentPreview] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const isEditMode = !!initialModule;
  const loadedModuleIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen && initialModule) {
      if (loadedModuleIdRef.current !== initialModule.id) {
          setTitle(initialModule.title);
          setCp(initialModule.cp.toString());
          setGrade(initialModule.grade ? initialModule.grade.toString() : '');
          setStatus(initialModule.status);
          setExtractedContent(initialModule.extractedContent || '');
          
          loadedModuleIdRef.current = initialModule.id;
      }
    } else if (isOpen && !initialModule) {
      setTitle('');
      setCp('5');
      setGrade('');
      setStatus('active');
      setExtractedContent('');
      loadedModuleIdRef.current = null;
    }
  }, [isOpen, initialModule]);

  const handleSelectFile = async () => {
    if (isParsing) return;

    try {
        // 1. Öffne den nativen Datei-Dialog (ruft IPC 'dialog:openFile' auf)
        const filePath = await window.api.selectPdf();
        
        if (!filePath) return; // Benutzer hat abgebrochen

        setIsParsing(true);
        console.log("Starte Parsing für:", filePath);

        // 2. Sende den Pfad an den Parser (ruft IPC 'pdf:parse' auf)
        const result = await window.api.parsePdf(filePath);
        
        if (result.success && result.text) {
             setExtractedContent(result.text);
             alert('PDF erfolgreich analysiert und Text extrahiert!');
        } else {
             throw new Error(result.error || 'Kein Text gefunden.');
        }

    } catch (error) {
        console.error("Fehler beim PDF Parsen:", error);
        alert("Fehler beim Lesen der PDF: " + (error instanceof Error ? error.message : String(error)));
    } finally {
        setIsParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cpValue = parseFloat(cp);
      const gradeValue = grade ? parseFloat(grade) : undefined;
      
      const isCompletingNow = status === 'completed' && initialModule?.status !== 'completed';
      const isUnCompleting = initialModule?.status === 'completed' && status !== 'completed';
      const alreadyAwarded = initialModule?.xpAwarded || false;
      
      let newXpAwardedState = alreadyAwarded;

      if (isCompletingNow && !alreadyAwarded && gradeValue) {
        const rewardXP = GamificationService.calculateModuleReward(cpValue, gradeValue);
        const { levelUp } = await GamificationService.addXP(rewardXP);
        alert(`Glückwunsch! Du hast ${rewardXP} XP erhalten!${levelUp ? '\nLEVEL UP!' : ''}`);
        newXpAwardedState = true;
      }

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
        xpAwarded: newXpAwardedState,
        extractedContent: extractedContent
      };

      if (isEditMode && initialModule) {
        await db.modules.update(initialModule.id, moduleData);
      } else {
        await db.modules.add({
          id: crypto.randomUUID(),
          ...moduleData,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans animate-in fade-in duration-200">
      
      {/* --- CONTENT PREVIEW MODAL --- */}
      {showContentPreview && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 p-8">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl h-3/4 rounded-xl flex flex-col shadow-2xl">
                  <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800 rounded-t-xl">
                      <h3 className="text-white font-bold flex items-center gap-2">
                          <FileText size={20} className="text-accent"/>
                          Gespeicherter Skript-Inhalt
                      </h3>
                      <button onClick={() => setShowContentPreview(false)} className="text-slate-400 hover:text-white">
                          <X size={24} />
                      </button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 font-mono text-sm text-slate-300 whitespace-pre-wrap">
                      {extractedContent ? extractedContent : <span className="text-slate-500 italic">Kein Inhalt vorhanden.</span>}
                  </div>
              </div>
          </div>
      )}

      {/* Container */}
      <div 
         className="pixel-card w-full max-w-lg relative p-0 overflow-hidden flex flex-col shadow-2xl transition-colors duration-500 rounded-2xl"
         style={{ 
             borderColor: 'var(--theme-primary)', 
             boxShadow: '0 0 40px -20px var(--theme-shadow-color)' 
         }}
      >
        
        {/* HEADER */}
        <div className="bg-slate-900/90 px-6 py-5 border-b border-slate-800 flex justify-between items-center backdrop-blur-md">
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
              {isEditMode ? (
                  <div className="flex items-center gap-3 text-amber-400">
                    <Pencil size={24} />
                    <span>Edit Module</span>
                  </div>
              ) : (
                  <div className="flex items-center gap-3 text-accent drop-shadow-md">
                    <Plus size={28} strokeWidth={3} />
                    <span>New Quest</span>
                  </div>
              )}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full">
            <X size={24} />
          </button>
        </div>
        
        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 bg-slate-950">
          
          {/* --- TITEL --- */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Modul Name</label>
            <textarea 
              rows={2}
              className="w-full p-4 bg-slate-900/80 border border-slate-700 rounded-xl text-lg font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/20 transition-all duration-300 resize-none"
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="z.B. Software Engineering II"
              required 
              autoFocus
            />
          </div>

          {/* --- PDF UPLOAD BEREICH --- */}
          <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 hover:border-accent/50 transition-colors">
              <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex justify-between">
                  <span>Skript / Lernmaterial</span>
                  {extractedContent && <span className="text-emerald-500 text-[10px] flex items-center gap-1">● Daten vorhanden</span>}
              </label>
              
              <div className="flex gap-3">
                  {/* Neuer Button (ohne das alte Div darunter) */}
                  <div className="relative flex-1">
                      <button 
                        type="button"
                        onClick={handleSelectFile}
                        disabled={isParsing}
                        className={`w-full py-3 px-4 rounded-lg border border-slate-600 flex items-center justify-center gap-2 text-sm font-bold transition-all ${isParsing ? 'bg-slate-800 text-slate-500 cursor-wait' : 'bg-slate-800 hover:bg-slate-700 text-white hover:border-accent'}`}
                      >
                        {isParsing ? (
                            <span>Verarbeite PDF...</span>
                        ) : (
                            <>
                              <Upload size={16} />
                              <span>{extractedContent ? 'Andere PDF wählen' : 'PDF auswählen'}</span>
                            </>
                        )}
                      </button>
                  </div>

                  {/* View Content Button */}
                  <button 
                      type="button"
                      onClick={() => setShowContentPreview(true)}
                      disabled={!extractedContent}
                      className={`px-4 rounded-lg border border-slate-600 flex items-center justify-center gap-2 transition-all ${!extractedContent ? 'opacity-50 cursor-not-allowed bg-slate-900 text-slate-600' : 'bg-slate-800 hover:bg-slate-700 text-accent hover:text-white cursor-pointer'}`}
                      title="Gespeicherten Text ansehen"
                  >
                      <Eye size={20} />
                  </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 text-center">
                  Der Text wird lokal in der Datenbank gespeichert.
              </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* CP & Grade Input */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Credit Points</label>
              <div className="relative">
                <input 
                  type="number" step="0.5" min="0" 
                  className="w-full p-4 pr-12 bg-slate-900/80 border border-slate-700 rounded-xl text-xl font-black text-white focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/20 transition-all duration-300"
                  value={cp} 
                  onChange={e => setCp(e.target.value)} 
                  required 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold pointer-events-none">CP</span>
              </div>
            </div>
            
            <div className={`transition-all duration-300 ${status === 'completed' ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
               <label className="block text-xs font-bold text-accent mb-2 uppercase tracking-wider">Note (Grade)</label>
               <div className="relative">
                 <input 
                   type="number" step="0.1" min="0" max="18" 
                   className="w-full p-4 pr-12 bg-slate-900/80 border-2 border-accent/50 rounded-xl text-xl font-black text-accent placeholder:text-slate-700 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/30 transition-all duration-300"
                   value={grade} 
                   onChange={e => setGrade(e.target.value)} 
                   placeholder="-"
                   disabled={status !== 'completed'}
                 />
                 <Star className="absolute right-4 top-1/2 -translate-y-1/2 text-accent/50 pointer-events-none" size={20} />
               </div>
            </div>
          </div>

          {/* --- STATUS --- */}
          <div>
             <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Status</label>
             <div className="flex gap-2 p-1.5 bg-slate-900/80 rounded-xl border border-slate-700">
                <button type="button" onClick={() => setStatus('active')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${status === 'active' ? 'bg-accent text-white shadow-lg shadow-accent/25 scale-[1.02]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}>Running</button>
                <button type="button" onClick={() => setStatus('locked')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${status === 'locked' ? 'bg-slate-700 text-white scale-[1.02]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}>Locked</button>
                <button type="button" onClick={() => setStatus('completed')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${status === 'completed' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 scale-[1.02]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}>Done</button>
             </div>
          </div>

          {/* --- FOOTER --- */}
          <div className="flex justify-between items-center mt-2 pt-6 border-t border-slate-800">
            {isEditMode ? (
              <button type="button" onClick={handleDelete} className="text-red-500 hover:text-red-400 flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors">
                <Trash2 size={16} /> DELETE
              </button>
            ) : <div></div>}
            
            <div className="flex gap-4">
              <button type="button" className="px-5 py-3 rounded-xl text-slate-400 hover:text-white text-sm font-bold transition-colors hover:bg-slate-900" onClick={onClose}>
                Cancel
              </button>
              
              <button type="submit" className="nes-btn is-primary flex items-center gap-2 !rounded-xl !py-3 !px-6 !text-sm shadow-lg shadow-accent/30">
                <Save size={18} /> {isEditMode ? 'Save Changes' : 'Create Quest'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};