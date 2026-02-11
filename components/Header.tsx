
import React, { useEffect, useState } from 'react';
import { AppTab, AuthUser } from '../types';

interface HeaderProps {
  activeTab: AppTab;
  isOnline: boolean;
  authUser: AuthUser | null;
  syncStatus: string;
  onGoogleSignIn: (response: any) => void;
  onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  isOnline, 
  authUser, 
  syncStatus,
  onGoogleSignIn,
  onSignOut
}) => {
  const [gsiError, setGsiError] = useState(false);

  useEffect(() => {
    const google = (window as any).google;
    if (google && google.accounts) {
      try {
        google.accounts.id.initialize({
          // Note: Replace this with your actual Client ID from Google Cloud Console to resolve 401 for production.
          client_id: "777000000000-placeholder.apps.googleusercontent.com", 
          callback: onGoogleSignIn,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        
        // Render Desktop Button
        const btnElem = document.getElementById("google-signin-btn");
        if (!authUser && btnElem) {
          google.accounts.id.renderButton(
            btnElem,
            { theme: "outline", size: "medium", shape: "pill", text: "signin" }
          );
        }

        // Render Mobile Button (Even if in App.tsx, we target it by ID)
        const mobileBtnElem = document.getElementById("google-signin-btn-mobile");
        if (!authUser && mobileBtnElem) {
          google.accounts.id.renderButton(
            mobileBtnElem,
            { theme: "outline", size: "medium", shape: "pill", text: "signin" }
          );
        }
      } catch (err) {
        console.warn("GSI Init Error - Likely invalid Client ID or blocked script.");
        setGsiError(true);
      }
    } else {
      setGsiError(true);
    }
  }, [authUser, onGoogleSignIn]);

  // Fallback handler for testing without a valid client_id
  const handleDemoSignIn = () => {
    onGoogleSignIn({
      credential: "mock_jwt_token." + btoa(JSON.stringify({
        sub: "demo-user-123",
        name: "Test Architect",
        email: "test@example.com",
        picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
      })) + ".signature"
    });
  };

  const getTitle = () => {
    switch(activeTab) {
      case AppTab.CHECKLIST: return "Daily Flow";
      case AppTab.GUIDE: return "Growth Path";
      case AppTab.ANALYTICS: return "Life Balance";
      default: return "";
    }
  };

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
              {isOnline ? 'Sync Active' : 'Offline Mode'}
            </div>
            {authUser && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${syncStatus === 'synced' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'synced' ? 'Cloud Synced' : 'Sync Paused'}
              </div>
            )}
          </div>
        </div>
        <p className="hidden md:block text-slate-500 text-[10px] md:text-sm font-bold uppercase tracking-widest ml-1">
          BehaviorDynamics Framework v2.5
        </p>
      </div>

      {/* Desktop Only Auth Bar */}
      <div className="hidden md:flex items-center gap-4 bg-slate-900/30 p-3 rounded-[2rem] border border-slate-800/50">
        {!authUser ? (
          <div className="flex items-center gap-4">
             {gsiError && (
               <button 
                onClick={handleDemoSignIn}
                className="px-4 py-2 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all"
               >
                 Bypass 401 (Demo)
               </button>
             )}
             <div id="google-signin-btn" className="h-9"></div>
          </div>
        ) : (
          <div className="flex items-center gap-5 pl-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-white uppercase tracking-tight">{authUser.name}</p>
              <button onClick={onSignOut} className="text-[8px] font-black text-rose-500 hover:text-rose-400 uppercase tracking-[0.3em] transition-colors mt-0.5">Logout</button>
            </div>
            <div className="relative">
              <img src={authUser.picture} className="w-10 h-10 rounded-2xl border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/10" alt="Avatar" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#0a0a0c] rounded-full"></div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
