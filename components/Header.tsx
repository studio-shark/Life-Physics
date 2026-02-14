
import React from 'react';
import { AppTab, AuthUser } from '../types';

interface HeaderProps {
  activeTab: AppTab;
  isOnline: boolean;
  authUser: AuthUser | null;
  syncStatus: string;
  customAvatarUrl?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  isOnline, 
  authUser, 
  syncStatus,
  customAvatarUrl
}) => {
  const getTitle = () => {
    switch(activeTab) {
      case AppTab.CHECKLIST: return "Tasks";
      case AppTab.HISTORY: return "History";
      case AppTab.ANALYTICS: return "Life Balance";
      case AppTab.WIDGETS: return "System Links";
      case AppTab.SHOP: return "Avatar Vault";
      default: return "";
    }
  };

  const avatarDisplay = customAvatarUrl || (authUser ? authUser.picture : null);

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 mb-4 md:mb-12">
      <div className="flex-1 w-full">
        <div className="flex items-center justify-between md:justify-start gap-6 mb-3">
          <h1 className="hidden md:block text-4xl md:text-6xl font-black tracking-tighter text-white uppercase">
            {getTitle()}
          </h1>
          
          <div className="hidden md:flex gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${isOnline ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></span>
              {isOnline ? 'Live' : 'Cached'}
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${syncStatus === 'synced' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
              Hardware Local
            </div>
          </div>
        </div>
        <p className="hidden md:block text-slate-500 text-[10px] md:text-sm font-bold uppercase tracking-widest ml-1">
          Architect Core v1.1.0 • Built for Android
        </p>
      </div>

      <div className="hidden md:flex items-center gap-4 bg-slate-900/30 p-3 rounded-[2rem] border border-slate-800/50">
        {authUser ? (
          <div className="flex items-center gap-5 pl-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-white uppercase tracking-tight">{authUser.name}</p>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mt-0.5">System Identifier Linked</p>
            </div>
            <div className="relative">
              <img src={avatarDisplay || ''} className="w-10 h-10 rounded-2xl border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/10 bg-slate-800 p-0.5" alt="Avatar" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#0a0a0c] rounded-full"></div>
            </div>
          </div>
        ) : (
          <div className="px-6 py-2 text-slate-600 font-black uppercase text-[10px] tracking-widest">
            Initializing System...
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
