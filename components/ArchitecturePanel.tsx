
import React, { useEffect } from 'react';

interface ArchitecturePanelProps {
  selectedPhase: 'The Beginning' | 'Building Habits' | 'Finding Balance';
  advice: string;
  isLoading: boolean;
  onPhaseChange: (phase: 'The Beginning' | 'Building Habits' | 'Finding Balance') => void;
}

const ArchitecturePanel: React.FC<ArchitecturePanelProps> = ({ 
  selectedPhase, 
  advice, 
  isLoading, 
  onPhaseChange 
}) => {
  useEffect(() => {
    if (!advice && !isLoading) {
      onPhaseChange(selectedPhase);
    }
  }, []);

  const phases = [
    { name: 'The Beginning', icon: '🐣', desc: 'Understanding your early experiences and starting fresh.' },
    { name: 'Building Habits', icon: '🧱', desc: 'Creating better routines and clearing mental clutter.' },
    { name: 'Finding Balance', icon: '⚖️', desc: 'Achieving inner peace and making clear choices.' }
  ] as const;

  return (
    <div className="space-y-12 pb-24">
      <div className="grid md:grid-cols-3 gap-8">
        {phases.map(p => (
          <button
            key={p.name}
            onClick={() => onPhaseChange(p.name)}
            className={`p-10 rounded-[3rem] border-2 text-left transition-all duration-700 relative overflow-hidden group ${selectedPhase === p.name ? 'bg-emerald-600 border-emerald-600 text-white shadow-3xl shadow-emerald-900/40 scale-105' : 'bg-[#141417] border-slate-800 text-slate-400 hover:border-emerald-500/50'}`}
          >
            <div className="text-5xl mb-6">{p.icon}</div>
            <h3 className="font-black text-2xl tracking-tighter uppercase">{p.name}</h3>
            <p className={`text-sm mt-3 font-bold leading-relaxed ${selectedPhase === p.name ? 'text-emerald-100' : 'text-slate-500'}`}>{p.desc}</p>
            {selectedPhase === p.name && <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>}
          </button>
        ))}
      </div>

      <div className="bg-[#141417] border-2 border-slate-800 rounded-[4rem] shadow-2xl shadow-black/50 overflow-hidden min-h-[500px] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
        <div className="bg-black/40 px-12 py-8 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
             <span className="font-black text-slate-500 uppercase tracking-[0.4em] text-[10px]">Your Growth Guide: {selectedPhase}</span>
          </div>
        </div>
        
        <div className="p-12">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-8">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin shadow-[0_0_20px_rgba(16,185,129,0.3)]"></div>
              </div>
              <p className="text-slate-500 font-black tracking-[0.3em] uppercase text-xs animate-pulse">Consulting the Guide...</p>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-slate-400 leading-loose font-bold text-xl">
                {advice || "Select a phase to see your custom growth strategy."}
              </div>
            </div>
          )}
        </div>

        <div className="bg-black/40 p-10 m-12 rounded-[3rem] border-2 border-slate-800">
           <h4 className="text-slate-100 font-black text-xs uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
              <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Key Energy Strategy: {selectedPhase}
           </h4>
           <div className="grid grid-cols-2 gap-8">
              <div className="bg-[#1a1a1e] p-7 rounded-[2rem] border border-slate-800 shadow-xl group hover:border-emerald-500/30 transition-colors">
                <span className="block font-black text-emerald-500 text-[10px] uppercase tracking-widest mb-2">Clutter Level</span>
                <p className="text-lg font-black text-white tracking-tight uppercase">
                  {selectedPhase === 'The Beginning' ? 'High Chaos' : selectedPhase === 'Building Habits' ? 'Clearing Out' : 'Balanced'}
                </p>
              </div>
              <div className="bg-[#1a1a1e] p-7 rounded-[2rem] border border-slate-800 shadow-xl group hover:border-emerald-500/30 transition-colors">
                <span className="block font-black text-emerald-500 text-[10px] uppercase tracking-widest mb-2">Feeling Stuck?</span>
                <p className="text-lg font-black text-white tracking-tight uppercase">
                  {selectedPhase === 'The Beginning' ? 'Very Stuck' : selectedPhase === 'Building Habits' ? 'Moving Better' : 'Flowing'}
                </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitecturePanel;
