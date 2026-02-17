import React from 'react';
import LoginButton from './LoginButton.tsx';

interface SettingsPanelProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  authUser: any;
  onLogin: (token: string) => void;
  appVersion: string;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  theme, 
  onToggleTheme, 
  authUser,
  onLogin,
  appVersion 
}) => {
  const isHardware = !authUser || authUser.token === 'hardware_identity';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      <div className="mb-8">
        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-2">System Configuration</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Architect Control Panel</p>
      </div>

      {isHardware && (
        <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center gap-4">
           <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg">
             <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
           </div>
           <div>
             <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">Cloud Sync</h3>
             <p className="text-xs text-slate-500 font-bold mt-1">Sign in to sync your progress across devices.</p>
           </div>
           <div className="mt-2">
             <LoginButton onSuccess={onLogin} />
           </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#111214] rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl transition-colors duration-300">
        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">Interface Appearance</h3>
        
        <div className="flex items-center justify-between">
           <div>
             <h4 className="text-lg font-bold text-slate-900 dark:text-white">Day/Night Cycle</h4>
             <p className="text-xs text-slate-500 font-medium mt-1">Invert the spectral visual spectrum.</p>
           </div>
           
           <button 
             onClick={onToggleTheme}
             className={`relative w-20 h-10 rounded-full transition-colors duration-500 ease-in-out border-2 ${theme === 'dark' ? 'bg-[#0a0a0c] border-slate-700' : 'bg-slate-200 border-slate-300'}`}
           >
              <div 
                className={`absolute top-1 left-1 w-7 h-7 rounded-full shadow-md flex items-center justify-center transition-transform duration-500 ease-in-out ${theme === 'dark' ? 'translate-x-10 bg-slate-800' : 'translate-x-0 bg-white'}`}
              >
                {theme === 'dark' ? (
                   <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                ) : (
                   <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                )}
              </div>
           </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111214] rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl transition-colors duration-300">
        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">Device Information</h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
             <span className="text-slate-600 dark:text-slate-400 font-bold text-sm">Identity ID</span>
             <code className="bg-slate-100 dark:bg-black/40 px-3 py-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 text-xs font-mono">{authUser?.id || 'Unknown'}</code>
          </div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
             <span className="text-slate-600 dark:text-slate-400 font-bold text-sm">Token Status</span>
             <span className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${isHardware ? 'text-amber-500' : 'text-emerald-500'}`}>
               <span className={`w-2 h-2 rounded-full ${isHardware ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></span>
               {isHardware ? 'Local Hardware' : 'Google Verified'}
             </span>
          </div>
          <div className="flex items-center justify-between">
             <span className="text-slate-600 dark:text-slate-400 font-bold text-sm">Core Version</span>
             <span className="text-slate-900 dark:text-white font-black text-xs">{appVersion}</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SettingsPanel;