import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { X, Lock, Check, ShoppingBag, Palette } from 'lucide-react';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Unsere Items (könnte man später auch in die DB auslagern)
const SHOP_ITEMS = [
  { id: 'theme-default', name: 'Standard Blue', price: 0, type: 'theme', desc: 'Der klassische Look.', color: 'bg-blue-600' },
  { id: 'theme-forest', name: 'Forest Green', price: 500, type: 'theme', desc: 'Konzentration durch Natur.', color: 'bg-green-600' },
  { id: 'theme-cyber', name: 'Cyberpunk Pink', price: 1200, type: 'theme', desc: 'High Tech Akzente.', color: 'bg-pink-600' },
  { id: 'theme-gold', name: 'Royal Gold', price: 5000, type: 'theme', desc: 'Nur für echte Legenden.', color: 'bg-amber-600' },
];

export const ShopModal: React.FC<ShopModalProps> = ({ isOpen, onClose }) => {
  const user = useLiveQuery(() => db.userProfile.get('main_user'));

  if (!isOpen || !user) return null;

  const handleBuyOrEquip = async (item: typeof SHOP_ITEMS[0]) => {
    const isUnlocked = user.unlockedItems?.includes(item.id);

    if (isUnlocked) {
      // Ausrüsten
      await db.userProfile.update('main_user', { activeTheme: item.id });
    } else {
      // Kaufen
      if (user.coins >= item.price) {
        if(confirm(`${item.name} für ${item.price} Coins kaufen?`)) {
            await db.userProfile.update('main_user', {
                coins: user.coins - item.price,
                unlockedItems: [...(user.unlockedItems || []), item.id],
                activeTheme: item.id // Direkt ausrüsten
            });
        }
      } else {
        alert("Nicht genug Coins! Lern mehr!");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans animate-in fade-in duration-200">
      <div className="pixel-card bg-slate-800 max-w-4xl w-full h-[80vh] relative p-0 border-slate-600 shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900/50 p-6 border-b-2 border-slate-700 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
               <ShoppingBag className="text-pink-400" /> Item Shop
            </h2>
            <p className="text-slate-400 text-sm mt-1">Gönn dir Belohnungen für deine Mühen.</p>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="text-right">
                <span className="block text-[10px] uppercase text-slate-500 font-bold">Dein Vermögen</span>
                <span className="text-xl font-black text-amber-400">{user.coins} Coins</span>
             </div>
             <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
               <X size={24} />
             </button>
          </div>
        </div>

        {/* Grid */}
        <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {SHOP_ITEMS.map(item => {
             const isUnlocked = user.unlockedItems?.includes(item.id);
             const isEquipped = user.activeTheme === item.id;
             const canAfford = user.coins >= item.price;

             return (
               <div key={item.id} className={`pixel-card p-0 overflow-hidden flex flex-col transition-transform hover:-translate-y-1 ${isEquipped ? 'ring-2 ring-accent' : ''}`}>
                  {/* Preview Area */}
                  <div className={`h-24 ${item.color}/20 flex items-center justify-center relative`}>
                     {isEquipped && <div className="absolute top-2 right-2 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full">ACTIVE</div>}
                     <Palette size={32} className={isEquipped ? 'text-accent' : 'text-slate-500'} />
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 flex-grow flex flex-col justify-between bg-slate-800">
                     <div>
                        <h3 className="font-bold text-white text-lg">{item.name}</h3>
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">{item.desc}</p>
                     </div>
                     
                     <div className="mt-4">
                        {isUnlocked ? (
                            <button 
                                onClick={() => handleBuyOrEquip(item)}
                                className={`w-full py-2 rounded font-bold text-sm border-2 ${isEquipped ? 'bg-slate-700 border-slate-500 text-slate-400 cursor-default' : 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700'}`}
                                disabled={isEquipped}
                            >
                                {isEquipped ? 'Ausgerüstet' : 'Ausrüsten'}
                            </button>
                        ) : (
                            <button 
                                onClick={() => handleBuyOrEquip(item)}
                                disabled={!canAfford}
                                className={`w-full py-2 rounded font-bold text-sm border-b-4 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 ${canAfford ? 'bg-amber-500 border-amber-700 text-amber-950 hover:bg-amber-400' : 'bg-slate-700 border-slate-800 text-slate-500 cursor-not-allowed'}`}
                            >
                                {item.price === 0 ? 'Gratis' : `${item.price} Coins`}
                                {!canAfford && <Lock size={12} />}
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
  );
};