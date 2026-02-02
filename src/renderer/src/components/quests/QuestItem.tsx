import React, { useState } from 'react';
import { Quest, db } from '../../db/db';
import { CheckSquare, Loader2, MessageSquare, ChevronDown, ChevronUp, Save, X, CheckCircle2, RotateCcw } from 'lucide-react';
import { QuestGenerator } from '../../services/QuestGenerator';

interface QuestItemProps {
  quest: Quest;
  onComplete: (xp: number) => void;
}

export const QuestItem: React.FC<QuestItemProps> = ({ quest, onComplete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [answer, setAnswer] = useState(quest.userAnswer || '');
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState(quest.aiFeedback || '');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Nur Speichern (ohne Abschluss/KI)
  const handleSaveDraft = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);
    await db.quests.update(quest.id, { userAnswer: answer });
    setTimeout(() => setIsSaving(false), 500);
  };

  // 2. KI Fragen & Modal öffnen
  const handleCheckClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!answer.trim()) {
      completeQuestDirectly();
      return;
    }

    setIsChecking(true);
    try {
        const aiResponse = await QuestGenerator.checkAnswer(quest.content, answer);
        
        await db.quests.update(quest.id, { 
          userAnswer: answer,
          aiFeedback: aiResponse
        });
        
        setFeedback(aiResponse);
        setIsChecking(false);
        setShowFeedbackModal(true); 
    } catch (error) {
        console.error(error);
        setIsChecking(false);
    }
  };

  // 3. Quest wirklich abschließen
  const handleConfirmCompletion = async () => {
      await db.quests.update(quest.id, { isCompleted: true });
      setShowFeedbackModal(false);
      // Wir lassen isExpanded auf true, damit man das Ergebnis direkt sieht (optional)
      // oder setze es auf false, um direkt Platz zu sparen:
      setIsExpanded(false); 
      onComplete(quest.xpReward);
  };

  // 4. Überarbeiten
  const handleRevise = () => {
      setShowFeedbackModal(false);
      setIsExpanded(true); // Sicherstellen, dass das Eingabefeld offen ist
  };

  const completeQuestDirectly = async () => {
    await db.quests.update(quest.id, { isCompleted: true });
    onComplete(quest.xpReward);
  };

  return (
    <>
      <div className={`pixel-card bg-slate-800/80 p-4 border-l-4 transition-all duration-300 shadow-md group ${
         quest.isCompleted ? 'border-l-emerald-500 opacity-75 hover:opacity-100' : 'border-l-accent'
      }`}>
        
        <div className="flex gap-4 items-start">
          {/* Action Buttons Column */}
          <div className="flex flex-col gap-2 mt-1">
              {/* CHECK BUTTON */}
              <button 
                onClick={handleCheckClick} 
                disabled={isChecking || quest.isCompleted}
                className={`transition-all hover:scale-110 p-1 rounded ${
                   quest.isCompleted 
                   ? 'text-emerald-400 cursor-default' 
                   : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-900/20'
                }`}
                title={quest.isCompleted ? "Erledigt" : (answer.trim() ? "KI Review starten" : "Einfach abhaken")}
              >
                {isChecking ? <Loader2 className="animate-spin" size={24} /> : <CheckSquare size={24} />}
              </button>

              {/* SAVE BUTTON */}
              {!quest.isCompleted && answer.trim().length > 0 && (
                  <button 
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                    className={`transition-all hover:scale-110 p-1 rounded ${
                        isSaving ? 'text-emerald-400' : 'text-slate-500 hover:text-blue-400 hover:bg-blue-900/20'
                    }`}
                    title="Als Entwurf speichern"
                  >
                    {isSaving ? <CheckCircle2 size={20} /> : <Save size={20} />}
                  </button>
              )}
          </div>

          <div className="flex-grow min-w-0">
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
              <span className="badge is-primary text-[9px] scale-90 origin-left opacity-90">{quest.type}</span>
              <div className="flex items-center gap-2">
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-900/30 px-2 py-0.5 rounded border border-amber-500/30">+{quest.xpReward} XP</span>
              </div>
            </div>
            
            {/* Quest Content */}
            <p className="font-bold text-sm leading-relaxed text-slate-200 mb-3 break-words">{quest.content}</p>

            {/* --- TOGGLE BUTTON (Für Active & Completed) --- */}
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-white transition-colors mb-1 focus:outline-none"
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {isExpanded 
                  ? 'Einklappen' 
                  : (quest.isCompleted ? 'Antwort & Feedback anzeigen' : (answer ? 'Antwort bearbeiten' : 'Antwort eingeben'))
              }
            </button>

            {/* --- COLLAPSIBLE CONTENT --- */}
            {isExpanded && (
               <div className="mt-3 animate-in fade-in slide-in-from-top-2 space-y-3">
                  
                  {/* FEEDBACK (Sowohl Draft als auch Completed) */}
                  {feedback && (
                    <div className={`p-3 rounded-lg border text-xs leading-relaxed ${
                        quest.isCompleted 
                        ? 'bg-emerald-900/20 border-emerald-500/30 text-slate-300' 
                        : 'bg-amber-900/10 border-amber-500/30 text-slate-300'
                    }`}>
                        <div className={`flex items-center gap-2 mb-1 font-bold uppercase ${
                            quest.isCompleted ? 'text-emerald-400' : 'text-amber-500'
                        }`}>
                            <MessageSquare size={12} /> {quest.isCompleted ? 'KI Feedback' : 'Letztes Feedback (Entwurf)'}
                        </div>
                        {feedback}
                    </div>
                  )}

                  {/* INPUT AREA (Nur wenn NICHT fertig) */}
                  {!quest.isCompleted && (
                      <textarea
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all resize-y min-h-[80px]"
                        rows={3}
                        placeholder="Deine Antwort hier..."
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        autoFocus
                      />
                  )}
                  
                  {/* READ-ONLY ANSWER (Nur wenn FERTIG) */}
                  {quest.isCompleted && quest.userAnswer && (
                     <div className="text-xs text-slate-500 border-t border-slate-700/50 pt-2">
                        <span className="font-bold block mb-1 uppercase tracking-wider text-[10px]">Deine Antwort</span> 
                        <p className="text-slate-300 leading-relaxed bg-slate-900/30 p-2 rounded border border-slate-800">
                           {quest.userAnswer}
                        </p>
                     </div>
                  )}
               </div>
            )}
          </div>
        </div>
      </div>

      {/* --- FEEDBACK MODAL (Bleibt gleich) --- */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="pixel-card w-full max-w-lg bg-slate-900 border-2 border-accent shadow-2xl overflow-hidden flex flex-col relative">
              <div className="p-4 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center">
                 <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-400" /> Review Ergebnis
                 </h3>
                 <button onClick={handleRevise} className="text-slate-400 hover:text-white">
                    <X size={20} />
                 </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                 <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Deine Antwort</p>
                    <p className="text-slate-300 text-sm italic">"{answer}"</p>
                 </div>
                 <div className="bg-emerald-900/10 p-4 rounded-xl border border-emerald-500/20">
                    <p className="text-xs text-emerald-400 uppercase font-bold mb-2 flex items-center gap-2">
                       <MessageSquare size={14} /> KI Tutor Feedback
                    </p>
                    <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                       {feedback}
                    </p>
                 </div>
              </div>
              <div className="p-4 border-t border-slate-800 bg-slate-900 flex gap-3 justify-end">
                 <button 
                   onClick={handleRevise}
                   className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white text-sm font-bold flex items-center gap-2 transition-colors"
                 >
                    <RotateCcw size={16} /> Überarbeiten
                 </button>
                 <button 
                   onClick={handleConfirmCompletion}
                   className="nes-btn is-primary !m-0 flex items-center gap-2 shadow-lg shadow-accent/20"
                 >
                    <CheckSquare size={16} /> Abschließen (+{quest.xpReward} XP)
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};