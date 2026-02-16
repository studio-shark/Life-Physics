
import React, { useState, useRef, useEffect } from 'react';
import { Task, Project } from '../types.ts';

interface ChecklistItemProps {
  task: Task;
  project?: Project;
  commentCount: number;
  reminderCount: number;
  completedCount: number; // New prop to track global progression
  onToggle: () => { xp: number, coins: number, critical: boolean } | void;
  onTogglePrereq?: (prereqId: string) => { xp: number, coins: number, critical: boolean } | void;
  onUpdatePrereqLabel?: (taskId: string, pid: string, label: string) => void;
  onAddPrereq?: (taskId: string) => void;
  onSelectSkill?: (taskId: string, skill: string) => void;
  onAddCalendar?: (title: string, desc: string) => void;
}

interface XpPopup {
  id: number;
  xpAmount: number;
  coinAmount: number;
  critical: boolean;
  type: 'task' | 'prereq';
  prereqId?: string;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ 
  task, 
  completedCount,
  onToggle,
  onTogglePrereq,
  onUpdatePrereqLabel,
  onAddPrereq,
  onAddCalendar
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [popups, setPopups] = useState<XpPopup[]>([]);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const prevPrereqCount = useRef(task.prerequisites?.length || 0);
  
  useEffect(() => {
    const currentCount = task.prerequisites?.length || 0;
    if (currentCount > prevPrereqCount.current) {
      const active = task.prerequisites?.filter(p => !p.completed) || [];
      if (active.length > 0) {
        const lastTask = active[active.length - 1];
        setTimeout(() => {
          inputRefs.current[lastTask.id]?.focus();
        }, 50);
      }
    }
    prevPrereqCount.current = currentCount;
  }, [task.prerequisites?.length]);

  const spawnPopup = (xpAmount: number, coinAmount: number, critical: boolean, type: 'task' | 'prereq', prereqId?: string) => {
    if (xpAmount === 0 && coinAmount === 0) return;
    const id = Date.now() + Math.random();
    setPopups(prev => [...prev, { id, xpAmount, coinAmount, critical, type, prereqId }]);
    setTimeout(() => {
      setPopups(prev => prev.filter(p => p.id !== id));
    }, 3000); 
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.prerequisites && task.prerequisites.length > 0 && task.status !== 'completed') {
      setIsExpanded(!isExpanded);
      return;
    }
    const res = onToggle() as any;
    if (res && (res.xp !== 0 || res.coins !== 0)) spawnPopup(res.xp, res.coins, res.critical, 'task');
  };

  const handlePrereqToggle = (e: React.MouseEvent, pid: string) => {
    e.stopPropagation();
    const prereq = task.prerequisites?.find(p => p.id === pid);
    if (!prereq || prereq.label.trim() === '') return;

    const res = onTogglePrereq?.(pid) as any;
    if (res && (res.xp !== 0 || res.coins !== 0)) {
      spawnPopup(res.xp, res.coins, res.critical, 'prereq', pid);
    }
  };

  const handleAddRequest = (currentLabel?: string) => {
    if (currentLabel !== undefined && currentLabel.trim() === '') {
      return;
    }
    onAddPrereq?.(task.id);
  };

  const handleCalendarRequest = (label: string) => {
    if (label.trim() === '') return;
    onAddCalendar?.(label, task.description);
  };

  /**
   * Dynamically determines the difficulty label based on global completed tasks.
   * Only affects 'Some Weight' difficulty as requested.
   */
  const getDisplayedDifficulty = () => {
    if (task.difficulty !== 'Some Weight') return task.difficulty;
    
    if (completedCount >= 1 && completedCount <= 4) return "1-4 Finished Tasks";
    if (completedCount >= 5 && completedCount <= 9) return "5-9 Finished Tasks";
    if (completedCount >= 10 && completedCount <= 14) return "10-14 Finished Tasks";
    if (completedCount > 14) return "14+ Finished Tasks";
    
    return "Some Weight"; // Baseline
  };

  const getDifficultyColor = (diffValue: string) => {
    if (task.status === 'completed') return 'bg-slate-800 text-slate-500 border-slate-700';
    
    switch(task.difficulty) {
      case 'Easy Start': return 'bg-emerald-900/20 text-emerald-400 border-emerald-900/30';
      case 'Some Weight': 
        if (completedCount > 14) return 'bg-orange-600 text-white border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.3)]';
        if (completedCount >= 10) return 'bg-orange-700/40 text-orange-200 border-orange-500/50';
        if (completedCount >= 5) return 'bg-orange-800/30 text-orange-300 border-orange-600/40';
        return 'bg-orange-900/20 text-orange-400 border-orange-900/30';
      case 'Heavy Weight': return 'bg-red-900/20 text-red-400 border-red-900/30';
      default: return 'bg-slate-800 text-slate-500 border-slate-700';
    }
  };

  const activePrereqs = task.prerequisites?.filter(p => !p.completed) || [];
  const completedPrereqs = [...(task.prerequisites?.filter(p => p.completed) || [])].reverse();

  return (
    <div className={`group rounded-[2rem] border transition-all duration-500 overflow-visible relative ${task.status === 'completed' ? 'bg-[#0e0e11] border-slate-800/60' : 'bg-[#111214] border-slate-800 hover:border-emerald-500/30 shadow-2xl shadow-black/20'}`}>
      
      <div className="p-7 flex items-start gap-6 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div 
          onClick={handleToggle}
          className={`relative flex-shrink-0 w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 ${task.status === 'completed' ? 'bg-emerald-900/20 border-emerald-700/50' : 'border-slate-700 bg-black group-hover:border-emerald-500 shadow-xl shadow-black/40'}`}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible z-50">
            {popups.filter(p => p.type === 'task').map(p => (
              <div 
                key={p.id} 
                className={`absolute font-black animate-float-up pointer-events-none whitespace-nowrap flex flex-col items-center gap-1 ${p.xpAmount > 0 ? (p.critical ? 'text-orange-400 drop-shadow-[0_0_20px_rgba(251,146,60,0.8)]' : 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]') : 'text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]'} ${p.critical ? 'text-5xl' : 'text-3xl'}`}
              >
                <div>{p.xpAmount > 0 ? `+${p.xpAmount}` : p.xpAmount} XP</div>
                {p.coinAmount !== 0 && (
                  <div className="text-amber-400 text-sm font-black flex items-center gap-1">
                    {p.coinAmount > 0 ? `+${p.coinAmount}` : p.coinAmount} ₵
                  </div>
                )}
              </div>
            ))}
          </div>

          {task.status === 'completed' ? (
            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-emerald-500/50 uppercase leading-none">Quest</span>
              {task.prerequisites && task.prerequisites.length > 0 && <span className="text-[8px] font-black text-blue-500/50 uppercase leading-none mt-0.5">Chain</span>}
            </div>
          )}
        </div>

        <div className="flex-1 relative">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h3 className={`font-black text-xl tracking-tight transition-all uppercase ${task.status === 'completed' ? 'text-slate-400 decoration-slate-600/50' : 'text-slate-100'}`}>
              {task.title}
            </h3>
            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all duration-700 ${getDifficultyColor(task.difficulty)}`}>
              {getDisplayedDifficulty()}
            </span>
          </div>
          <p className={`text-sm font-bold leading-relaxed ${task.status === 'completed' ? 'text-slate-600' : 'text-slate-500'}`}>{task.description}</p>
        </div>
      </div>

      {isExpanded && (
        <div className="px-7 pb-6 animate-in slide-in-from-top-4 duration-300">
          <div className="space-y-4">
            <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] px-2 mb-2">Observation Streams</h4>
            
            {activePrereqs.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-4 relative overflow-visible group/item">
                <div 
                  onClick={(e) => handlePrereqToggle(e, p.id)}
                  className={`relative flex-shrink-0 w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${p.label.trim() === '' ? 'border-slate-800 bg-slate-900/50 cursor-not-allowed opacity-30' : 'cursor-pointer border-slate-700 bg-black group-hover/item:border-emerald-500/50'}`}
                >
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible z-50">
                    {popups.filter(pop => pop.type === 'prereq' && pop.prereqId === p.id).map(pop => (
                      <div 
                        key={pop.id} 
                        className={`absolute font-black animate-float-up pointer-events-none whitespace-nowrap flex flex-col items-center gap-1 ${pop.xpAmount > 0 ? (pop.critical ? 'text-orange-400 drop-shadow-[0_0_20px_rgba(251,146,60,0.8)]' : 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]') : 'text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]'} ${pop.critical ? 'text-4xl' : 'text-2xl'}`}
                      >
                        <div>+{pop.xpAmount} XP</div>
                        <div className="text-amber-400 text-[10px] font-black flex items-center gap-1">+{pop.coinAmount} ₵</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex-1 flex items-center gap-2">
                  <input 
                    ref={el => { inputRefs.current[p.id] = el; }}
                    type="text"
                    value={p.label}
                    placeholder={idx === 0 ? "Identify habit mass..." : "Describe habit weight..."}
                    onChange={(e) => onUpdatePrereqLabel?.(task.id, p.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddRequest(p.label);
                      }
                    }}
                    className="flex-1 bg-transparent border-b border-slate-800 focus:border-emerald-500 outline-none text-xs font-bold py-2 text-slate-300 placeholder:text-slate-700 transition-colors"
                  />
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleAddRequest(p.label)}
                      className={`p-2.5 rounded-xl transition-all shadow-lg ${p.label.trim() === '' ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-400 hover:scale-105 active:scale-95'}`}
                      disabled={p.label.trim() === ''}
                      title="Add Task"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                    </button>

                    <button 
                      onClick={() => handleCalendarRequest(p.label)}
                      className={`p-2.5 rounded-xl transition-all shadow-lg ${p.label.trim() === '' ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-500 hover:scale-105 active:scale-95'}`}
                      disabled={p.label.trim() === ''}
                      title="Add Google Calendar Reminder"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {activePrereqs.length === 0 && task.status !== 'completed' && (
              <div className="flex gap-2">
                <button 
                  onClick={() => handleAddRequest()}
                  className="flex-1 py-4 bg-emerald-600 border border-emerald-400 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-emerald-500 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-emerald-900/20"
                >
                  + New Task
                </button>
                <button 
                  onClick={() => onAddCalendar?.(task.title, task.description)}
                  className="px-6 py-4 bg-indigo-600 border border-indigo-400 rounded-2xl text-white hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/20 flex items-center justify-center"
                  title="Schedule Quest"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            )}

            {completedPrereqs.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-800/50 space-y-3">
                <h5 className="text-[8px] font-black text-slate-700 uppercase tracking-[0.2em] px-2 mb-2">Recently Finished</h5>
                {completedPrereqs.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-4 px-4 py-3 bg-black/40 rounded-2xl border border-slate-800/50 hover:border-emerald-500/30 transition-all relative overflow-visible">
                    <span className="text-xs font-bold text-slate-600 line-through truncate max-w-[200px]">{p.label || "Unnamed Energy"}</span>
                    <button 
                      onClick={(e) => handlePrereqToggle(e, p.id)}
                      className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-900/20"
                      title="Restore Task"
                    >
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible z-50">
                        {popups.filter(pop => pop.type === 'prereq' && pop.prereqId === p.id).map(pop => (
                          <div 
                            key={pop.id} 
                            className={`absolute font-black animate-float-up pointer-events-none whitespace-nowrap flex flex-col items-center gap-1 ${pop.xpAmount > 0 ? (pop.critical ? 'text-orange-400 drop-shadow-[0_0_20px_rgba(251,146,60,0.8)]' : 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]') : 'text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]'} ${pop.critical ? 'text-4xl' : 'text-2xl'}`}
                          >
                            <div>{pop.xpAmount > 0 ? `+${pop.xpAmount}` : pop.xpAmount} XP</div>
                            <div className="text-amber-400 text-[10px] font-black flex items-center gap-1">{pop.coinAmount > 0 ? `+${pop.coinAmount}` : pop.coinAmount} ₵</div>
                          </div>
                        ))}
                      </div>

                      <span className="text-[9px] font-black uppercase tracking-tighter">Restore</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0) scale(0.5); opacity: 0; filter: blur(4px); }
          10% { opacity: 1; filter: blur(0); }
          15% { transform: translateY(-20px) scale(1.1); opacity: 1; }
          40% { transform: translateY(-50px) scale(1); opacity: 1; }
          100% { transform: translateY(-200px) scale(0.8); opacity: 0; filter: blur(2px); }
        }
        .animate-float-up {
          animation: float-up 3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default ChecklistItem;
