
import React, { useState, useRef, useEffect } from 'react';
import { Task, Project } from '../types.ts';
import { COMMON_SKILLS } from '../constants.tsx';

interface ChecklistItemProps {
  task: Task;
  project?: Project;
  commentCount: number;
  reminderCount: number;
  onToggle: () => { xp: number, critical: boolean } | void;
  onTogglePrereq?: (prereqId: string) => { xp: number, critical: boolean } | void;
  onUpdatePrereqLabel?: (taskId: string, pid: string, label: string) => void;
  onAddPrereq?: (taskId: string) => void;
  onSelectSkill?: (taskId: string, skill: string) => void;
  onAddCalendar?: (title: string, desc: string) => void;
  aiContent?: any;
  isLoadingAI: boolean;
  onFetchAI: () => void;
}

interface XpPopup {
  id: number;
  amount: number;
  critical: boolean;
  type: 'task' | 'prereq';
  prereqId?: string;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ 
  task, 
  onToggle,
  onTogglePrereq,
  onUpdatePrereqLabel,
  onAddPrereq,
  onSelectSkill,
  onAddCalendar,
  aiContent, 
  isLoadingAI, 
  onFetchAI
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [popups, setPopups] = useState<XpPopup[]>([]);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const prevPrereqCount = useRef(task.prerequisites?.length || 0);
  
  // Auto-focus logic for new tasks when the count increases
  useEffect(() => {
    const currentCount = task.prerequisites?.length || 0;
    if (currentCount > prevPrereqCount.current) {
      const active = task.prerequisites?.filter(p => !p.completed) || [];
      if (active.length > 0) {
        // Focus the last added active task
        const lastTask = active[active.length - 1];
        setTimeout(() => {
          inputRefs.current[lastTask.id]?.focus();
        }, 50);
      }
    }
    prevPrereqCount.current = currentCount;
  }, [task.prerequisites?.length]);

  const spawnPopup = (amount: number, critical: boolean, type: 'task' | 'prereq', prereqId?: string) => {
    if (amount === 0) return;
    const id = Date.now() + Math.random();
    setPopups(prev => [...prev, { id, amount, critical, type, prereqId }]);
    setTimeout(() => {
      setPopups(prev => prev.filter(p => p.id !== id));
    }, 3000); 
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.prerequisites && task.prerequisites.length > 0) {
      setIsExpanded(!isExpanded);
      return;
    }
    const res = onToggle() as any;
    if (res && res.xp !== 0) spawnPopup(res.xp, res.critical, 'task');
  };

  const handlePrereqToggle = (e: React.MouseEvent, pid: string) => {
    e.stopPropagation();
    const prereq = task.prerequisites?.find(p => p.id === pid);
    if (!prereq || prereq.label.trim() === '') return;

    const res = onTogglePrereq?.(pid) as any;
    if (res && res.xp !== 0) {
      spawnPopup(res.xp, res.critical, 'prereq', pid);
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

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case 'Easy Start': return 'bg-emerald-900/20 text-emerald-400 border-emerald-900/30';
      case 'Some Weight': return 'bg-orange-900/20 text-orange-400 border-orange-900/30';
      case 'Heavy Weight': return 'bg-red-900/20 text-red-400 border-red-900/30';
      default: return 'bg-slate-800 text-slate-500 border-slate-700';
    }
  };

  const activePrereqs = task.prerequisites?.filter(p => !p.completed) || [];
  // Most recently finished at the top: reverse the array of completed items
  const completedPrereqs = [...(task.prerequisites?.filter(p => p.completed) || [])].reverse();

  return (
    <div className={`group bg-[#1a1a1e] rounded-[2rem] border transition-all duration-500 overflow-visible relative ${task.status === 'completed' ? 'border-emerald-900/30 bg-emerald-900/5 opacity-80' : 'border-slate-800 hover:border-emerald-500/30 shadow-2xl shadow-black/20'}`}>
      
      <div className="p-7 flex items-start gap-6 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div 
          onClick={handleToggle}
          className={`relative flex-shrink-0 w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 ${task.status === 'completed' ? 'bg-emerald-600 border-emerald-600 scale-90 rotate-[360deg]' : 'border-slate-700 bg-black group-hover:border-emerald-500 shadow-xl shadow-black/40'}`}
        >
          {/* Main Task Popups */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible z-50">
            {popups.filter(p => p.type === 'task').map(p => (
              <div 
                key={p.id} 
                className={`absolute font-black animate-float-up pointer-events-none whitespace-nowrap ${p.amount > 0 ? (p.critical ? 'text-orange-400 drop-shadow-[0_0_20px_rgba(251,146,60,0.8)]' : 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]') : 'text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]'} ${p.critical ? 'text-5xl' : 'text-3xl'}`}
              >
                {p.amount > 0 ? `+${p.amount}` : p.amount} XP {p.critical && '!!'}
              </div>
            ))}
          </div>

          {task.status === 'completed' ? (
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-emerald-500/50 uppercase leading-none">Quest</span>
              {task.prerequisites && task.prerequisites.length > 0 && <span className="text-[8px] font-black text-blue-500/50 uppercase leading-none mt-0.5">Chain</span>}
            </div>
          )}
        </div>

        <div className="flex-1 relative">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h3 className={`font-black text-xl tracking-tight transition-all uppercase ${task.status === 'completed' ? 'text-slate-600' : 'text-slate-100'}`}>
              {task.title}
            </h3>
            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getDifficultyColor(task.difficulty)}`}>
              {task.difficulty}
            </span>
          </div>
          <p className="text-sm text-slate-500 font-bold leading-relaxed">{task.description}</p>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onFetchAI(); }}
          className={`p-4 rounded-2xl border transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest ${isLoadingAI ? 'bg-slate-900 border-slate-800 text-slate-700' : aiContent ? 'bg-orange-600/10 text-orange-400 border-orange-600/20' : 'bg-emerald-600/10 text-emerald-400 border-emerald-600/20 hover:bg-emerald-600 hover:text-white'}`}
        >
          {isLoadingAI ? <div className="w-5 h-5 border-2 border-slate-700 border-t-emerald-500 animate-spin rounded-full"></div> : <span>Insight</span>}
        </button>
      </div>

      {isExpanded && (
        <div className="px-7 pb-6 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-black/30 rounded-3xl p-6 border border-slate-800/50 space-y-4">
            <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] px-2 mb-2">Observation Streams</h4>
            
            {activePrereqs.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-4 relative overflow-visible group/item">
                <div 
                  onClick={(e) => handlePrereqToggle(e, p.id)}
                  className={`relative flex-shrink-0 w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${p.label.trim() === '' ? 'border-slate-800 bg-slate-900/50 cursor-not-allowed opacity-30' : 'cursor-pointer border-slate-700 bg-black group-hover/item:border-emerald-500/50'}`}
                >
                  {/* Active Prereq Popups (for completion) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible z-50">
                    {popups.filter(pop => pop.type === 'prereq' && pop.prereqId === p.id).map(pop => (
                      <div 
                        key={pop.id} 
                        className={`absolute font-black animate-float-up pointer-events-none whitespace-nowrap ${pop.amount > 0 ? (pop.critical ? 'text-orange-400 drop-shadow-[0_0_20px_rgba(251,146,60,0.8)]' : 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]') : 'text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]'} ${pop.critical ? 'text-4xl' : 'text-2xl'}`}
                      >
                        {pop.amount > 0 ? `+${pop.amount}` : pop.amount} XP {pop.critical && '!!'}
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

            {activePrereqs.length === 0 && (
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
                      {/* Restoration Popups rendered here while item is in completed state */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible z-50">
                        {popups.filter(pop => pop.type === 'prereq' && pop.prereqId === p.id).map(pop => (
                          <div 
                            key={pop.id} 
                            className={`absolute font-black animate-float-up pointer-events-none whitespace-nowrap ${pop.amount > 0 ? (pop.critical ? 'text-orange-400 drop-shadow-[0_0_20px_rgba(251,146,60,0.8)]' : 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]') : 'text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]'} ${pop.critical ? 'text-4xl' : 'text-2xl'}`}
                          >
                            {pop.amount > 0 ? `+${pop.amount}` : pop.amount} XP {pop.critical && '!!'}
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

      {isExpanded && aiContent && (
        <div className="p-8 border-t border-slate-800 bg-black/40 rounded-b-[2rem] animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Entropy Analysis</h4>
          </div>
          
          <div className="whitespace-pre-wrap text-sm text-slate-400 leading-relaxed font-bold italic mb-6">
            {aiContent.text}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem]">
              <h5 className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2">Strategy</h5>
              <p className="text-xs text-slate-400 font-bold leading-relaxed">{aiContent.proTip}</p>
            </div>
            <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-[2rem]">
              <h5 className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2">Chaos Warning</h5>
              <p className="text-xs text-slate-400 font-bold leading-relaxed">{aiContent.securityWarning}</p>
            </div>
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
