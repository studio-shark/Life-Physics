
import React, { useState, useEffect } from 'react';

interface AvatarShopProps {
  coins: number;
  ownedAvatarIds: string[];
  selectedAvatarId: string;
  onBuy: (id: string, price: number) => boolean;
  onSelect: (id: string) => boolean;
}

const AvatarShop: React.FC<AvatarShopProps> = ({ 
  coins, 
  ownedAvatarIds = [], 
  selectedAvatarId, 
  onBuy, 
  onSelect 
}) => {
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [avatars, setAvatars] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Simulate network latency for catalog retrieval
    const timer = setTimeout(() => {
      try {
        const generatedAvatars = Array.from({ length: 100 }, (_, i) => {
          const id = `shell-${i}`;
          const price = (i + 1) * 500;
          const seed = `quantum-shell-${i}`;
          const url = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${seed}`;
          return { id, price, url, name: `Shell v${i + 1}.0` };
        });

        const allAvatars = [
          { id: 'default', price: 0, url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=default', name: 'Origin Shell' },
          ...generatedAvatars
        ];
        setAvatars(allAvatars);
      } catch (err) {
        setError("Failed to load neural shell catalog.");
      } finally {
        setIsLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleBuy = (id: string, price: number) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const success = onBuy(id, price);
      if (success) {
        setSuccessMsg("Neural Shell Acquired Successfully");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError("Transaction Declined: Insufficient Funds");
        setTimeout(() => setError(null), 3000);
      }
    } catch (e) {
      setError("System Malfunction: Transaction Error");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSelect = (id: string) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const success = onSelect(id);
      if (success) {
        setSuccessMsg("Identity Matrix Updated");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError("Synchronization Failed: Ownership Verification Error");
        setTimeout(() => setError(null), 3000);
      }
    } catch (e) {
      setError("System Malfunction: Selection Error");
      setTimeout(() => setError(null), 3000);
    }
  };

  if (error && avatars.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 border-2 border-rose-900/30 rounded-[3rem] bg-[#1a1a1e]">
        <div className="w-16 h-16 bg-rose-900/20 rounded-full flex items-center justify-center mb-4">
           <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h3 className="text-xl font-black text-rose-500 uppercase tracking-widest mb-2">Vault Locked</h3>
        <p className="text-slate-500 text-sm font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700 relative">
      {/* Toast Notifications */}
      {(error || successMsg) && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl border-2 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-300 flex items-center gap-3 ${error ? 'bg-rose-950/80 border-rose-500/50 text-rose-200' : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'}`}>
          <div className={`w-2 h-2 rounded-full ${error ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
          <span className="text-xs font-black uppercase tracking-widest">{error || successMsg}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Neural Shell Vault</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Upgrade your synaptic identity across the hardware network</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-900/50 border border-amber-500/20 px-6 py-3 rounded-2xl">
          <span className="text-amber-500 font-black text-xl tracking-tight">{coins}</span>
          <div className="w-6 h-6 bg-gradient-to-tr from-amber-600 to-yellow-300 rounded-full flex items-center justify-center text-[10px] font-black text-amber-900 shadow-[0_0_15px_rgba(245,158,11,0.4)]">₵</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {isLoading ? (
          // Skeleton Loading State
          Array.from({ length: 10 }).map((_, i) => (
            <div 
              key={`skeleton-${i}`} 
              className="bg-[#1a1a1e] border border-slate-800 rounded-[2rem] p-6 flex flex-col items-center animate-pulse"
            >
              <div className="w-24 h-24 rounded-2xl bg-slate-800 mb-6"></div>
              <div className="h-3 w-20 bg-slate-800 rounded-full mb-4"></div>
              <div className="w-full h-10 bg-slate-800 rounded-xl"></div>
            </div>
          ))
        ) : (
          avatars.map((avatar) => {
            const isOwned = ownedAvatarIds.includes(avatar.id);
            const isSelected = selectedAvatarId === avatar.id;
            const canAfford = coins >= avatar.price;

            return (
              <div 
                key={avatar.id} 
                className={`relative bg-[#1a1a1e] border-2 rounded-[2rem] p-6 flex flex-col items-center transition-all duration-300 group ${isSelected ? 'border-amber-500 shadow-2xl shadow-amber-500/10 scale-105' : isOwned ? 'border-emerald-500/30 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10' : 'border-slate-800 hover:border-slate-700'}`}
              >
                {isSelected && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest z-10">
                    Active
                  </div>
                )}

                <div className="relative mb-6">
                  <div className={`w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all ${isSelected ? 'border-amber-400 bg-amber-400/5' : isOwned ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-slate-800 bg-slate-800/20 opacity-40 group-hover:opacity-100'}`}>
                    <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover" />
                  </div>
                  {!isOwned && (
                     <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-slate-700 w-8 h-8 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                     </div>
                  )}
                </div>

                <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 transition-colors ${isSelected ? 'text-amber-500' : isOwned ? 'text-emerald-500' : 'text-slate-500'}`}>
                  {avatar.name}
                </h3>

                {isOwned ? (
                  <button 
                    onClick={() => handleSelect(avatar.id)}
                    disabled={isSelected}
                    className={`w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isSelected ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-500 hover:scale-105 active:scale-95 shadow-lg shadow-emerald-900/20'}`}
                  >
                    {isSelected ? 'Equipped' : 'Equip Shell'}
                  </button>
                ) : (
                  <button 
                    onClick={() => handleBuy(avatar.id, avatar.price)}
                    disabled={!canAfford}
                    className={`w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${canAfford ? 'bg-slate-100 text-black hover:bg-white hover:scale-105 active:scale-95 shadow-lg shadow-white/10' : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'}`}
                  >
                    <span>{avatar.price}</span>
                    <div className={`w-3 h-3 rounded-full flex items-center justify-center text-[6px] font-black ${canAfford ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-500'}`}>₵</div>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AvatarShop;
