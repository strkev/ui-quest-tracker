import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { X, Lock, ShoppingBag, Palette, MessageSquare } from 'lucide-react';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHOP_ITEMS = [
  // THEMEN
  { id: 'theme-default', name: 'Standard Blue', price: 0, type: 'theme', desc: 'Der klassische Look für dein Abenteuer.', previewClass: 'bg-blue-600/20', iconClass: 'text-blue-500' },
  { id: 'theme-forest', name: 'Forest Green', price: 500, type: 'theme', desc: 'Konzentration durch Naturtöne.', previewClass: 'bg-green-600/20', iconClass: 'text-green-500' },
  { id: 'theme-cyber', name: 'Cyberpunk Pink', price: 1200, type: 'theme', desc: 'High Tech Akzente für Hacker.', previewClass: 'bg-pink-600/20', iconClass: 'text-pink-500' },
  { id: 'theme-gold', name: 'Royal Gold', price: 5000, type: 'theme', desc: 'Nur für echte Lern-Legenden.', previewClass: 'bg-amber-600/20', iconClass: 'text-amber-500' },
  
  // PERSONAS (Chat-Stile)
  { id: 'persona-default', name: 'Netter Tutor', price: 0, type: 'persona', desc: 'Immer höflich und sehr motivierend.', previewClass: 'bg-emerald-600/20', iconClass: 'text-emerald-500' },
  { id: 'persona-french', name: 'Monsieur Grumpy', price: 800, type: 'persona', desc: 'Fachlich brillant, aber oft genervt.', previewClass: 'bg-red-600/20', iconClass: 'text-red-500' },
  { id: 'persona-robot', name: 'Einheit 734', price: 1500, type: 'persona', desc: 'Rein logische Analyse ohne Emotionen.', previewClass: 'bg-slate-600/20', iconClass: 'text-slate-400' },
];

export const ShopModal: React.FC<ShopModalProps> = ({ isOpen, onClose }) => {
  const user = useLiveQuery(() => db.userProfile.get('main_user'));

  if (!isOpen || !user) return null;

  const handleBuyOrEquip = async (item: typeof SHOP_ITEMS[0]) => {
    const isUnlocked = user.unlockedItems?.includes(item.id);
    const updateKey = item.type === 'theme' ? 'activeTheme' : 'activePersona';

    if (isUnlocked) {
      // Cast auf any löst den TypeScript-Error bei dynamischen Keys
      await db.userProfile.update('main_user', { [updateKey]: item.id } as any);
    } else {
      if (user.coins >= item.price) {
        if(confirm(`${item.name} für ${item.price} Coins kaufen?`)) {
            await db.userProfile.update('main_user', {
                coins: user.coins - item.price,
                unlockedItems: [...(user.unlockedItems || []), item.id],
                [updateKey]: item.id
            } as any);
        }
      } else {
        alert("Nicht genug Coins! Lern mehr!");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 font-sans animate-in fade-in duration-200">
      <div className="pixel-card bg-slate-800 w-full max-w-5xl h-[90vh] sm:h-[80vh] relative p-0 border-slate-600 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900/50 p-4 sm:p-6 border-b-2 border-slate-700 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-3">
               <ShoppingBag className="text-accent" size={24} /> Item Shop
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">Passe dein Interface und deinen Mentor an.</p>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
             <div className="text-right">
                <span className="block text-[10px] uppercase text-slate-500 font-bold">Vermögen</span>
                <span className="text-lg sm:text-xl font-black text-amber-400 whitespace-nowrap">{user.coins} Coins</span>
             </div>
             <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
               <X size={28} />
             </button>
          </div>
        </div>

        {/* Grid Area */}
        <div className="p-4 sm:p-8 overflow-y-auto custom-scrollbar flex-grow bg-slate-900/20">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {SHOP_ITEMS.map(item => {
                const isUnlocked = user.unlockedItems?.includes(item.id);
                const isEquipped = item.type === 'theme' 
                  ? user.activeTheme === item.id 
                  : user.activePersona === item.id;
                const canAfford = user.coins >= item.price;
                const Icon = item.type === 'theme' ? Palette : MessageSquare;

                return (
                  <div key={item.id} className={`pixel-card p-0 overflow-hidden flex flex-col transition-all duration-200 hover:border-slate-400 ${isEquipped ? 'ring-2 ring-accent border-accent' : 'border-slate-700'}`}>
                     {/* Preview mit verbessertem Padding */}
                     <div className={`h-28 sm:h-32 ${item.previewClass} flex items-center justify-center relative p-4`}>
                        {isEquipped && (
                          <div className="absolute top-2 right-2 bg-accent text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-lg border border-white/20 z-10">
                            AKTIV
                          </div>
                        )}
                        <Icon size={48} className={`${isEquipped ? 'text-accent' : item.iconClass} transition-transform duration-300 group-hover:scale-110`} />
                        <span className="absolute bottom-2 left-2 text-[8px] uppercase font-black opacity-20 tracking-widest">{item.type}</span>
                     </div>
                     
                     {/* Content Bereich mit Min-Height gegen Verspringen */}
                     <div className="p-4 sm:p-5 flex-grow flex flex-col justify-between bg-slate-800/80">
                        <div className="mb-4">
                           <h3 className="font-bold text-white text-base sm:text-lg truncate" title={item.name}>
                             {item.name}
                           </h3>
                           <p className="text-slate-400 text-xs mt-1.5 leading-relaxed min-h-[32px]">
                             {item.desc}
                           </p>
                        </div>
                        
                        <div>
                           {isUnlocked ? (
                               <button 
                                   onClick={() => handleBuyOrEquip(item)}
                                   className={`w-full py-2.5 rounded font-bold text-xs uppercase tracking-wider border-2 transition-all ${
                                     isEquipped 
                                     ? 'bg-slate-700/50 border-slate-600 text-slate-500 cursor-default' 
                                     : 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700 hover:border-slate-500 active:scale-95'
                                   }`}
                                   disabled={isEquipped}
                               >
                                   {isEquipped ? 'Ausgerüstet' : 'Ausrüsten'}
                               </button>
                           ) : (
                               <button 
                                   onClick={() => handleBuyOrEquip(item)}
                                   disabled={!canAfford}
                                   className={`w-full py-2.5 rounded font-bold text-xs uppercase tracking-wider border-b-4 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 ${
                                     canAfford 
                                     ? 'bg-amber-500 border-amber-700 text-amber-950 hover:bg-amber-400' 
                                     : 'bg-slate-700 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                                   }`}
                               >
                                   {item.price === 0 ? 'Gratis' : `${item.price} Coins`}
                                   {!canAfford && <Lock size={14} />}
                               </button>
                           )}
                        </div>
                     </div>
                  </div>
                );
              })}
           </div>
        </div>
      </div>
    </div>
  );
};