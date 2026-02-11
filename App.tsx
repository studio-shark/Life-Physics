
import React, { useState, useRef, useEffect } from 'react';
import { AppTab } from './types.ts';
import { ICONS } from './constants.tsx';
import ChecklistItem from './components/ChecklistItem.tsx';
import ArchitecturePanel from './components/ArchitecturePanel.tsx';
import AnalyticsPanel from './components/AnalyticsPanel.tsx';
import Header from './components/Header.tsx';
import { useAppViewModel } from './hooks/useAppViewModel.ts';

const App: React.FC = () => {
  const { state, actions } = useAppViewModel();
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { 
    activeTab, 
    tasks, 
    isSidebarOpen, 
    isOnline, 
    level,
    xp,
    xpToNextLevel,
    rankTitle,
    authUser,
    syncStatus,
    selectedPhase,
    archAdvice,
    isArchLoading
  } = state;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNavDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDemoSignIn = () => {
    actions.handleGoogleSignIn({
      credential: "mock_jwt_token." + btoa(JSON.stringify({
        sub: "demo-user-123",
        name: "Test Architect",
        email: "test@example.com",
        picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
      })) + ".signature"
    });
  };

  const navItems = [
    { id: AppTab.CHECKLIST, label: 'Quest Log', icon: <ICONS.Check />, color: 'text-emerald-400' },
    { id: AppTab.GUIDE, label: 'Growth Path', icon: <ICONS.Info />, color: 'text-orange-400' }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-slate-100 bg-[#0a0a0c]">
      {/* Sidebar */}
      <aside className={`bg-[#111114] border-r border-slate-800 transition-all duration-300 flex-shrink-0 flex flex-col ${isSidebarOpen ? 'w-full md:w-80' : 'w-24'}`}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-600 p-2.5 rounded-2xl text-white shadow-lg shadow-emerald-900/40">
              <ICONS.Rocket />
            </div>
            <h1 className="font-black text-xl tracking-tighter uppercase">LifePhysics</h1>
          </div>

          {/* Mobile Auth UI: Parallel to LifePhysics Title */}
          <div className="md:hidden flex items-center gap-3">
            {!authUser ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleDemoSignIn}
                  className="px-3 py-1 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[8px] font-black uppercase"
                >
                  Demo
                </button>
                <div id="google-signin-btn-mobile" className="h-9"></div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[8px] font-black text-white uppercase tracking-tight">{authUser.name.split(' ')[0]}</p>
                  <button onClick={actions.signOut} className="text-[7px] font-black text-rose-500 uppercase">Out</button>
                </div>
                <img src={authUser.picture} className="w-9 h-9 rounded-xl border border-emerald-500/30" alt="Avatar" />
              </div>
            )}
            
            <button onClick={() => actions.setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
              <svg className={`w-6 h-6 transform transition-transform text-slate-500 ${isSidebarOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Desktop Toggle */}
          <button onClick={() => actions.setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-xl hidden md:block transition-colors">
            <svg className={`w-6 h-6 transform transition-transform text-slate-500 ${isSidebarOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {isSidebarOpen && (
          <>
            <div className="px-6 mb-6">
              <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 relative overflow-visible group">
                
                {/* Mobile-Only Dropdown Menu Trigger in Top Right of Character Box */}
                <div className="absolute top-4 right-4 z-20 md:hidden" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsNavDropdownOpen(!isNavDropdownOpen)}
                    className={`p-2.5 rounded-xl border transition-all duration-300 ${isNavDropdownOpen ? 'bg-emerald-600 border-emerald-500 text-white rotate-90' : 'bg-black border-slate-700 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400'}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                  </button>

                  {/* Dropdown Content */}
                  {isNavDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-[#1a1a1e] border border-slate-700/50 rounded-[1.5rem] shadow-2xl shadow-black overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-2 space-y-1">
                        {navItems.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              actions.setActiveTab(item.id);
                              setIsNavDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${activeTab === item.id ? 'bg-emerald-600/20 text-emerald-400' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}`}
                          >
                            <div className={`w-5 h-5 ${activeTab === item.id ? 'text-emerald-400' : 'text-slate-600'}`}>{item.icon}</div>
                            <span className="font-black uppercase text-[10px] tracking-widest">{item.label}</span>
                            {activeTab === item.id && (
                              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 blur-3xl rounded-full"></div>
                <div className="flex items-center gap-5 mb-5 relative z-10">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-emerald-900/50 border border-white/10">{level}</div>
                  </div>
                  <div>
                    <h4 className="text-white font-black uppercase text-[10px] tracking-widest mb-1">{rankTitle}</h4>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Level {level}</p>
                      {authUser && <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase font-black">Linked</span>}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden relative z-10">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: `${Math.min(100, (xp / xpToNextLevel) * 100)}%` }}></div>
                </div>
                <div className="mt-2 flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest relative z-10">
                  <span>EXP {xp}</span>
                  <span>Next {xpToNextLevel}</span>
                </div>
              </div>
            </div>

            {/* Desktop-Only Vertical Navigation */}
            <nav className="hidden md:flex flex-col px-4 space-y-2 flex-1">
              {navItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => actions.setActiveTab(item.id)} 
                  className={`w-full flex items-center gap-4 px-5 py-5 rounded-2xl transition-all ${activeTab === item.id ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 shadow-lg shadow-emerald-900/10' : 'text-slate-500 hover:bg-slate-800/30'}`}
                >
                  <div className="w-6">{item.icon}</div>
                  {isSidebarOpen && <span className="font-black uppercase text-[10px] tracking-widest">{item.label}</span>}
                </button>
              ))}
            </nav>
          </>
        )}

        {/* Sidebar bottom branding */}
        <div className="mt-auto p-8 border-t border-slate-800/30 hidden md:block">
           <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em] text-center">Protocol V2.5.0</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        <Header 
          activeTab={activeTab} 
          isOnline={isOnline} 
          authUser={state.authUser}
          syncStatus={state.syncStatus}
          onGoogleSignIn={actions.handleGoogleSignIn}
          onSignOut={actions.signOut}
        />
        
        <div className="max-w-4xl mx-auto">
          {activeTab === AppTab.CHECKLIST && (
            <div className="grid gap-8">
              {tasks.map(task => (
                <ChecklistItem 
                  key={task.id} 
                  task={task} 
                  commentCount={0}
                  reminderCount={0}
                  onToggle={() => actions.toggleTask(task.id)}
                  onTogglePrereq={(pid) => actions.togglePrerequisite(task.id, pid)}
                  onUpdatePrereqLabel={actions.updatePrerequisiteLabel}
                  onAddPrereq={actions.addPrerequisite}
                  onSelectSkill={actions.selectTaskSkill}
                  onAddCalendar={actions.addCalendarReminder}
                  onFetchAI={() => actions.fetchTaskAI(task.id, task.title)}
                  aiContent={state.aiContentMap[task.id]}
                  isLoadingAI={state.loadingTasks[task.id]}
                />
              ))}
            </div>
          )}
          {activeTab === AppTab.GUIDE && (
             <ArchitecturePanel 
               selectedPhase={selectedPhase || 'The Beginning'} 
               advice={archAdvice} 
               isLoading={isArchLoading} 
               onPhaseChange={actions.handlePhaseChange} 
             />
          )}
          {activeTab === AppTab.ANALYTICS && <AnalyticsPanel tasks={state.allTasks} state={state} />}
        </div>
      </main>
    </div>
  );
};

export default App;
