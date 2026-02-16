
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AppTab, Task } from './types.ts';
import { ICONS } from './constants.tsx';
import ChecklistItem from './components/ChecklistItem.tsx';
import AnalyticsPanel from './components/AnalyticsPanel.tsx';
import WidgetSystem from './components/WidgetSystem.tsx';
import AvatarShop from './components/AvatarShop.tsx';
import Header from './components/Header.tsx';
import { useAppViewModel } from './hooks/useAppViewModel.ts';
import { useWidgetSync } from './hooks/useWidgetSync.ts';

const groupTasksByDate = (tasks: Task[]) => {
  const groups: Record<string, Task[]> = {
    'Today': [],
    'Yesterday': [],
    'This Week': [],
    'Previous Cycles': []
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const weekStart = todayStart - (86400000 * 7);

  tasks.forEach(task => {
    if (!task.completedAt) {
        groups['Previous Cycles'].push(task);
        return;
    }
    const date = new Date(task.completedAt).getTime();
    
    if (date >= todayStart) {
      groups['Today'].push(task);
    } else if (date >= yesterdayStart) {
      groups['Yesterday'].push(task);
    } else if (date >= weekStart) {
      groups['This Week'].push(task);
    } else {
      groups['Previous Cycles'].push(task);
    }
  });

  return groups;
};

const App: React.FC = () => {
  const { state, actions } = useAppViewModel();
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { 
    activeTab, 
    tasks, 
    isOnline, 
    level,
    xp,
    coins,
    ownedAvatarIds,
    selectedAvatarId,
    xpToNextLevel,
    rankTitle,
    authUser,
    syncStatus
  } = state;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNavDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync widgets with native Android
  useWidgetSync(level, xp, xpToNextLevel, tasks);

  const navItems = [
    { id: AppTab.CHECKLIST, label: 'Tasks', icon: <ICONS.Check />, color: 'text-emerald-400' },
    { id: AppTab.HISTORY, label: 'History', icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ), color: 'text-amber-400' },
    { id: AppTab.ANALYTICS, label: 'Analytics', icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ), color: 'text-indigo-400' },
    { id: AppTab.SHOP, label: 'Avatar Vault', icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ), color: 'text-purple-400' },
    { id: AppTab.WIDGETS, label: 'Widgets', icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ), color: 'text-blue-400' }
  ];

  const pendingTasks = tasks.filter(t => t.status === 'pending');

  const allCompletedItems = useMemo(() => {
    const items: Task[] = [];
    tasks.forEach(t => {
      // Add main task if completed
      if (t.status === 'completed') {
        items.push(t);
      }
      // Add completed prerequisites as virtual tasks
      t.prerequisites?.forEach(p => {
        if (p.completed && p.completedAt) {
          items.push({
            ...t,
            id: p.id,
            title: p.label,
            description: `Stream Segment: ${t.title}`,
            status: 'completed',
            completedAt: p.completedAt,
            prerequisites: [],
            isPrereq: true,
            parentId: t.id
          });
        }
      });
    });
    return items.sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [tasks]);

  const filteredCompletedTasks = allCompletedItems.filter(task => 
    (task.title || '').toLowerCase().includes(historySearchQuery.toLowerCase()) ||
    (task.description || '').toLowerCase().includes(historySearchQuery.toLowerCase())
  );

  const completedCount = allCompletedItems.length;
  const groupedTasks = groupTasksByDate(filteredCompletedTasks);

  const getAvatarUrl = () => {
    if (selectedAvatarId === 'default' && authUser) return authUser.picture;
    const seed = `quantum-shell-${selectedAvatarId.split('-')[1]}`;
    return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${seed}`;
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-slate-100 bg-[#0a0a0c]">
      <aside className="bg-[#111214] border-r border-slate-800 transition-all duration-300 flex-shrink-0 flex flex-col w-full md:w-80">
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-600 p-2.5 rounded-2xl text-white shadow-lg shadow-emerald-900/40">
              <ICONS.Rocket />
            </div>
            <h1 className="font-black text-xl tracking-tighter uppercase">LifePhysics</h1>
          </div>

          <div className="md:hidden flex items-center gap-3">
            {authUser && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[8px] font-black text-white uppercase tracking-tight">{authUser.name}</p>
                </div>
                <img src={getAvatarUrl()} className="w-9 h-9 rounded-xl border border-emerald-500/30" alt="Avatar" />
              </div>
            )}
          </div>
        </div>

        <div className="px-6 mb-6">
          <div 
            ref={dropdownRef}
            onClick={() => setIsNavDropdownOpen(!isNavDropdownOpen)}
            className="bg-[#111214] border border-slate-800 rounded-[2rem] p-6 relative overflow-visible group cursor-pointer hover:border-emerald-500/50 transition-all duration-300 active:scale-[0.98]"
          >
            <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-black/40 border border-amber-500/20 px-3 py-1.5 rounded-full shadow-lg">
               <span className="text-amber-500 font-black text-[10px] tracking-widest">{coins}</span>
               <div className="w-3.5 h-3.5 bg-gradient-to-tr from-amber-600 to-yellow-300 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.4)] flex items-center justify-center text-[7px] font-black text-amber-900">₵</div>
            </div>

            {isNavDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-3 bg-[#1a1a1e] border border-slate-700/50 rounded-[1.5rem] shadow-2xl shadow-black overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 z-[100]">
                <div className="p-2 space-y-1">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        actions.setActiveTab(item.id);
                        setIsNavDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${activeTab === item.id ? 'bg-emerald-600/20 text-emerald-400' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}`}
                    >
                      <div className={`w-5 h-5 ${activeTab === item.id ? 'text-emerald-400' : 'text-slate-600'}`}>{item.icon}</div>
                      <span className="font-black uppercase text-[10px] tracking-widest">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 blur-3xl rounded-full"></div>
            <div className="flex items-center gap-5 mb-5 relative z-10">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-emerald-900/50 border border-white/10 overflow-hidden">
                   <img src={getAvatarUrl()} className="w-full h-full object-cover p-1" alt="Equipped Shell" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-900 border-2 border-slate-800 rounded-full flex items-center justify-center">
                  <svg className={`w-3.5 h-3.5 text-emerald-500 transition-transform duration-300 ${isNavDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div>
                <h4 className="text-white font-black uppercase text-[10px] tracking-widest mb-1">{rankTitle}</h4>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{Math.round(xp)} / {xpToNextLevel} XP</p>
                </div>
              </div>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden relative z-10">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: `${Math.min(100, (xp / xpToNextLevel) * 100)}%` }}></div>
            </div>
          </div>
        </div>

        <nav className="hidden md:flex flex-col px-4 space-y-2 flex-1">
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => actions.setActiveTab(item.id)} 
              className={`w-full flex items-center gap-4 px-5 py-5 rounded-2xl transition-all ${activeTab === item.id ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 shadow-lg shadow-emerald-900/10' : 'text-slate-500 hover:bg-slate-800/30'}`}
            >
              <div className="w-6">{item.icon}</div>
              <span className="font-black uppercase text-[10px] tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        <Header 
          activeTab={activeTab} 
          isOnline={isOnline} 
          authUser={state.authUser}
          syncStatus={state.syncStatus}
          customAvatarUrl={getAvatarUrl()}
        />
        
        <div className="max-w-4xl mx-auto mt-8 md:mt-0">
          {activeTab === AppTab.CHECKLIST && (
            <div className="grid gap-8">
              {pendingTasks.length > 0 ? pendingTasks.map(task => (
                <ChecklistItem 
                  key={task.id} 
                  task={task} 
                  commentCount={0}
                  reminderCount={0}
                  completedCount={completedCount}
                  onToggle={() => actions.toggleTask(task.id)}
                  onTogglePrereq={(pid) => actions.togglePrerequisite(task.id, pid)}
                  onUpdatePrereqLabel={actions.updatePrerequisiteLabel}
                  onAddPrereq={actions.addPrerequisite}
                  onAddCalendar={actions.addCalendarReminder}
                />
              )) : (
                <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-[3rem]">
                   <p className="text-slate-500 font-black uppercase tracking-[0.3em]">No active tasks. System idle.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === AppTab.HISTORY && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-[#111214] p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none"></div>
                   <div className="relative z-10">
                     <div className="flex items-center justify-between mb-6">
                       <div>
                         <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Quest Archive</h2>
                         <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Permanent Record of Action</p>
                       </div>
                       <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                         <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       </div>
                     </div>
                     
                     <div className="bg-black/40 p-1.5 rounded-2xl border border-slate-800/50 flex items-center">
                       <div className="pl-4 text-slate-500">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                       </div>
                       <input 
                          type="text"
                          value={historySearchQuery}
                          onChange={(e) => setHistorySearchQuery(e.target.value)}
                          placeholder="SEARCH MEMORY LOGS..."
                          className="w-full bg-transparent border-none outline-none px-4 py-3 text-xs font-bold text-white placeholder:text-slate-700 uppercase tracking-widest"
                       />
                     </div>
                   </div>
                </div>

                <div className="bg-[#111214] p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col justify-center items-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 to-transparent opacity-50"></div>
                  <span className="text-5xl font-black text-white tracking-tighter relative z-10">{filteredCompletedTasks.length}</span>
                  <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.3em] mt-2 relative z-10">Completed</span>
                </div>
              </div>

              {filteredCompletedTasks.length > 0 ? (
                 <div className="space-y-8">
                   {Object.entries(groupedTasks).map(([group, groupTasks]) => (
                      groupTasks.length > 0 && (
                        <div key={group} className="space-y-4">
                          <h3 className="flex items-center gap-4 px-4">
                             <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">{group}</span>
                             <div className="h-px flex-1 bg-slate-800/50"></div>
                          </h3>
                          <div className="grid gap-4">
                            {groupTasks.map(task => (
                              <ChecklistItem 
                                key={task.id} 
                                task={task} 
                                commentCount={0}
                                reminderCount={0}
                                completedCount={completedCount}
                                onToggle={() => task.isPrereq && task.parentId ? actions.togglePrerequisite(task.parentId, task.id) : actions.toggleTask(task.id)}
                                onTogglePrereq={(pid) => actions.togglePrerequisite(task.id, pid)}
                                onUpdatePrereqLabel={actions.updatePrerequisiteLabel}
                                onAddPrereq={actions.addPrerequisite}
                                onAddCalendar={actions.addCalendarReminder}
                              />
                            ))}
                          </div>
                        </div>
                      )
                   ))}
                 </div>
              ) : (
                <div className="py-24 text-center">
                  <div className="w-24 h-24 bg-[#111214] rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800">
                    <svg className="w-10 h-10 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">No Records Found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === AppTab.SHOP && (
             <AvatarShop 
               coins={coins} 
               ownedAvatarIds={ownedAvatarIds} 
               selectedAvatarId={selectedAvatarId}
               onBuy={actions.buyAvatar}
               onSelect={actions.selectAvatar}
             />
          )}

          {activeTab === AppTab.WIDGETS && (
            <WidgetSystem 
              level={level}
              xp={xp}
              xpToNextLevel={xpToNextLevel}
              tasks={tasks}
              onAddTask={actions.addPrerequisite}
            />
          )}
          {activeTab === AppTab.ANALYTICS && <AnalyticsPanel tasks={state.allTasks} state={state} />}
        </div>
      </main>
    </div>
  );
};

export default App;
