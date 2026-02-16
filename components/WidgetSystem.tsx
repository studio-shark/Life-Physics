
import React, { useState, useEffect } from 'react';
import { Task } from '../types.ts';
import WidgetPin from '../plugins/widget-pin.ts';

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

  const [canPinWidgets, setCanPinWidgets] = useState(false);
  const [pinningWidget, setPinningWidget] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);

  useEffect(() => {
    WidgetPin.canPinWidgets()
      .then(result => setCanPinWidgets(result.canPin))
      .catch(() => setCanPinWidgets(false));
  }, []);

  const handlePinWidget = async (widgetType: 'status' | 'tasks' | 'quickAdd', widgetName: string) => {
    setPinError(null);
    setPinSuccess(null);
    setPinningWidget(widgetType);

    try {
      await WidgetPin.pinWidget({ widgetType, widgetName });
      setPinSuccess(`${widgetName} widget ready to place!`);
      setTimeout(() => setPinSuccess(null), 5000);
    } catch (error: any) {
      console.error('Failed to pin widget:', error);
      if (error.message?.includes('Android version') || error.message?.includes('Launcher')) {
        setPinError(error.message);
      } else {
        setPinError('Something went wrong. Try again.');
      }
      setTimeout(() => setPinError(null), 5000);
    } finally {
      setPinningWidget(null);
    }
  };

  const showManualInstructions = () => {
    alert(
      'To add widgets manually:\n\n' +
      '1. Long-press your home screen\n' +
      '2. Tap "Widgets"\n' +
      '3. Find "Life Physics Architect"\n' +
      '4. Drag the widget to your home screen'
    );
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="mb-10">
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Native System Sync</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Live Preview of your Home Screen Widgets & Shortcuts</p>
      </div>

      {/* Global Status Messages */}
      {(pinSuccess || pinError) && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-2xl border font-black uppercase text-xs tracking-widest shadow-2xl animate-in slide-in-from-bottom-10 duration-300 ${pinSuccess ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-rose-600 border-rose-400 text-white'}`}>
          {pinSuccess || pinError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* Widget 1: Status Glance */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Glance Progress (2x2)</p>
          </div>
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
            
            <div className="space-y-3 mb-6">
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

            <button 
              onClick={() => canPinWidgets ? handlePinWidget('status', 'Glance Progress') : showManualInstructions()}
              disabled={pinningWidget === 'status'}
              className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {pinningWidget === 'status' ? 'Adding to System...' : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  {canPinWidgets ? 'Add to Home Screen' : 'View Instructions'}
                </>
              )}
            </button>
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl pointer-events-none"></div>
          </div>
        </div>

        {/* Widget 2: List Glance */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4">Active Quests (4x2)</p>
          <div className="bg-[#1a1c22] rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl space-y-5">
            <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Pending Streams</h4>
            <div className="space-y-3 mb-6">
              {pendingTasks.map(task => (
                <div key={task.id} className="flex items-center gap-4 bg-black/30 p-4 rounded-2xl border border-slate-800/50 group hover:border-blue-500/30 transition-all">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  <span className="flex-1 text-xs font-bold text-slate-300 uppercase truncate">{task.title}</span>
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <div className="text-center py-6 text-slate-600 font-bold text-[10px] uppercase tracking-widest">System Aligned</div>
              )}
            </div>

            <button 
              onClick={() => canPinWidgets ? handlePinWidget('tasks', 'Active Quests') : showManualInstructions()}
              disabled={pinningWidget === 'tasks'}
              className="w-full py-4 rounded-2xl bg-slate-800 text-slate-300 font-black uppercase text-[10px] tracking-widest hover:bg-slate-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {pinningWidget === 'tasks' ? 'Adding to System...' : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  {canPinWidgets ? 'Pin to Home' : 'Manual Install'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Widget 3: Command Console */}
        <div className="space-y-4 md:col-span-2">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4">Command Console (4x1)</p>
          <div className="bg-[#1a1c22] rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
             
             {/* Preview Area */}
             <div className="flex-1 w-full relative">
                <div className="absolute inset-0 bg-emerald-500/5 blur-2xl rounded-full"></div>
                <div className="relative bg-[#111214] border border-slate-700/50 rounded-3xl p-4 flex items-center justify-between gap-4 shadow-xl">
                    <div className="flex items-center gap-3 opacity-50">
                       <div className="w-5 h-5 rounded-md border-2 border-slate-600"></div>
                       <div className="h-2 w-24 bg-slate-700 rounded-full"></div>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="h-10 px-4 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/40">
                          <span className="text-white font-black text-lg">+</span>
                       </div>
                       <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/40">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                       </div>
                    </div>
                </div>
                <div className="mt-3 flex justify-center">
                   <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Interactive Home Screen Control</span>
                </div>
             </div>

             {/* Action Button */}
             <div className="w-full md:w-auto">
               <button 
                  onClick={() => canPinWidgets ? handlePinWidget('quickAdd', 'Command Console') : showManualInstructions()}
                  disabled={pinningWidget === 'quickAdd'}
                  className="w-full md:w-56 py-4 rounded-2xl bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-emerald-900/20"
                >
                  {pinningWidget === 'quickAdd' ? 'Syncing...' : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      {canPinWidgets ? 'Add to Home' : 'Manual Install'}
                    </>
                  )}
                </button>
             </div>
          </div>
        </div>

        {/* Shortcut 1: App Menu Simulation */}
        <div className="space-y-4 md:col-span-2">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4">Android Launcher Shortcuts (Long-Press)</p>
          <div className="bg-[#14161a] rounded-[2.5rem] p-6 border border-slate-800/50 flex flex-col md:flex-row gap-4">
             {[
               { icon: '+', label: 'New Quest', type: 'quickAdd' as const },
               { icon: 'Q', label: 'Quest Log', type: 'status' as const }
             ].map((s, i) => (
               <div key={i} className="flex-1 bg-black/40 p-5 rounded-2xl border border-slate-800 flex items-center justify-between hover:border-emerald-500/30 transition-all group">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center font-black text-white">{s.icon}</div>
                    <p className="text-[10px] font-black text-white uppercase tracking-tight">{s.label}</p>
                 </div>
                 <button 
                   onClick={() => canPinWidgets ? handlePinWidget(s.type as any, s.label) : showManualInstructions()}
                   className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                   title="Pin Shortcut"
                 >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                 </button>
               </div>
             ))}
          </div>
        </div>

      </div>

      <div className="mt-16 bg-emerald-500/5 border border-emerald-500/20 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-8">
        <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-emerald-900/40 shrink-0">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-black text-white uppercase mb-2">Final Step: Launcher Integration</h3>
          <p className="text-sm text-slate-400 font-bold leading-relaxed mb-4">
            The native Android experience is unlocked by adding this app to your home screen:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <li className="flex gap-3 text-xs text-slate-500 font-bold">
              <span className="text-emerald-400 font-black">01.</span>
              <span>Tap the "Three Dots" (Chrome) or "Install App".</span>
            </li>
            <li className="flex gap-3 text-xs text-slate-500 font-bold">
              <span className="text-emerald-400 font-black">02.</span>
              <span>Select "Add to Home Screen".</span>
            </li>
            <li className="flex gap-3 text-xs text-slate-500 font-bold">
              <span className="text-emerald-400 font-black">03.</span>
              <span>Long-press the new icon to see Shortcuts.</span>
            </li>
            <li className="flex gap-3 text-xs text-slate-500 font-bold">
              <span className="text-emerald-400 font-black">04.</span>
              <span>Add the Chrome Widget to see your Level live.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WidgetSystem;
