
import React from 'react';
import { Task } from '../types.ts';

interface WidgetSystemProps {
  level: number;
  xp: number;
  xpToNextLevel: number;
  tasks: Task[];
  onAddTask?: (taskId: string) => void;
}

const WidgetSystem: React.FC<WidgetSystemProps> = ({ level, xp, xpToNextLevel, tasks }) => {
  const pendingTasks = tasks.filter(t => t.status === 'pending').slice(0, 3);
  const progressPercent = Math.min(100, (xp / xpToNextLevel) * 100);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="mb-10">
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Android Widgets</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Standardized Glance UI for Home Screen Integration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* Widget 1: Status Glance (Material You Rounded Box) */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4">Glance Progress (2x2)</p>
          <div className="bg-[#1f2128] rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-1">Architect Level</span>
                <h3 className="text-5xl font-black text-white">{level}</h3>
              </div>
              <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-900/50">
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                 </svg>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase">
                <span>Memory Flow</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-4 bg-black/40 rounded-full overflow-hidden p-1 border border-slate-800">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(16,185,129,0.5)]" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl pointer-events-none"></div>
          </div>
        </div>

        {/* Widget 2: List Glance (Task Hub) */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4">Active Quests (4x2)</p>
          <div className="bg-[#1a1c22] rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl space-y-5">
            <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Pending Streams</h4>
            <div className="space-y-3">
              {pendingTasks.map(task => (
                <div key={task.id} className="flex items-center gap-4 bg-black/30 p-4 rounded-2xl border border-slate-800/50 group hover:border-blue-500/30 transition-all">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  <span className="flex-1 text-xs font-bold text-slate-300 uppercase truncate">{task.title}</span>
                  <div className="text-[8px] font-black text-slate-600 uppercase border border-slate-800 px-2 py-1 rounded-md">{task.difficulty}</div>
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <div className="text-center py-6 text-slate-600 font-bold text-[10px] uppercase tracking-widest">System Aligned</div>
              )}
            </div>
          </div>
        </div>

        {/* Widget 3: Quick Add (Compact Entry) */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4">Quick Entry (4x1)</p>
          <div className="bg-[#1f2128] rounded-[2.5rem] p-6 border border-slate-800 shadow-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-black border border-slate-700 flex items-center justify-center text-slate-500">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
               </svg>
            </div>
            <div className="flex-1">
               <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">New Observation</p>
               <input 
                 type="text" 
                 placeholder="Fast input..." 
                 className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-100 placeholder:text-slate-700"
               />
            </div>
            <button className="bg-emerald-600 p-3 rounded-xl text-white shadow-lg shadow-emerald-900/40 hover:scale-105 active:scale-95 transition-all">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
               </svg>
            </button>
          </div>
        </div>

        {/* Widget 4: Strategy Pulse (Gemini Insight Glance) */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4">Strategic Pulse (2x2)</p>
          <div className="bg-[#1a1c22] rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between h-full min-h-[180px]">
            <div className="relative z-10">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block mb-3">Chaos Level</span>
              <p className="text-xl font-black text-white uppercase tracking-tighter leading-tight">High Entropy Detected in Recent Habits</p>
            </div>
            <div className="relative z-10 flex items-center gap-2 mt-4">
               <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Request Adjustment</span>
            </div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-500/5 blur-[60px] pointer-events-none"></div>
          </div>
        </div>

      </div>

      {/* Android Shortcut Instructions */}
      <div className="mt-16 bg-blue-500/5 border border-blue-500/20 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-8">
        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-900/40 shrink-0">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-black text-white uppercase mb-2">Native Android Integration</h3>
          <p className="text-sm text-slate-400 font-bold leading-relaxed mb-4">
            To use these widgets on your home screen:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <li className="flex gap-3 text-xs text-slate-500 font-bold">
              <span className="text-blue-400 font-black">01.</span>
              <span>Long-press on your phone's home screen.</span>
            </li>
            <li className="flex gap-3 text-xs text-slate-500 font-bold">
              <span className="text-blue-400 font-black">02.</span>
              <span>Select "Widgets" and find "Chrome" or "LifePhysics".</span>
            </li>
            <li className="flex gap-3 text-xs text-slate-500 font-bold">
              <span className="text-blue-400 font-black">03.</span>
              <span>Drag the "Shortcut" widget to your screen.</span>
            </li>
            <li className="flex gap-3 text-xs text-slate-500 font-bold">
              <span className="text-blue-400 font-black">04.</span>
              <span>Select "Quest Flow" to link it directly.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WidgetSystem;
