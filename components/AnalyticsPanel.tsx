
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Task } from '../types';

interface AnalyticsPanelProps {
  tasks: Task[];
  state: any;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ tasks, state }) => {
  // Flatten tasks and prereqs for granular analytics
  const analyticsTasks = React.useMemo(() => {
    return tasks.flatMap(t => {
      const base = [t];
      if (t.prerequisites?.length) {
        t.prerequisites.forEach(p => {
           base.push({
             ...t,
             id: p.id,
             title: p.label,
             status: p.completed ? 'completed' : 'pending',
             isPrereq: true
           } as Task);
        });
      }
      return base;
    });
  }, [tasks]);

  // 1. Prepare Data for Quest Completion by Realm (Category)
  const categoryData = analyticsTasks.reduce((acc: any[], task) => {
    const existing = acc.find(a => a.name === task.category);
    if (existing) {
      if (task.status === 'completed') existing.completed += 1;
      existing.total += 1;
    } else {
      acc.push({ 
        name: task.category, 
        completed: task.status === 'completed' ? 1 : 0, 
        total: 1 
      });
    }
    return acc;
  }, []);

  // 2. Prepare Data for Equilibrium Index (Status)
  const pendingCount = analyticsTasks.filter(t => t.status === 'pending').length;
  const completedCount = analyticsTasks.filter(t => t.status === 'completed').length;
  const totalTasks = analyticsTasks.length;
  
  const statusData = [
    { name: 'Aligned', value: completedCount },
    { name: 'Potential', value: pendingCount }
  ];

  const COLORS = ['#10b981', '#334155']; // Emerald and Slate-700

  // 3. Dynamic Metrics
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  
  // Clutter Logic
  let clutterLevel = "Low";
  let clutterColor = "text-emerald-500";
  if (pendingCount >= 5) { clutterLevel = "Moderate"; clutterColor = "text-amber-500"; }
  if (pendingCount >= 10) { clutterLevel = "High"; clutterColor = "text-rose-500"; }

  // Resilience Logic
  let resilienceLevel = "Developing";
  let resilienceColor = "text-slate-400";
  if (completionRate > 25) { resilienceLevel = "Growing"; resilienceColor = "text-blue-400"; }
  if (completionRate > 50) { resilienceLevel = "Strong"; resilienceColor = "text-indigo-400"; }
  if (completionRate > 75) { resilienceLevel = "Unshakeable"; resilienceColor = "text-emerald-400"; }

  // 4. Narrative Generation
  const getNarrative = () => {
    if (totalTasks === 0) return "The canvas of your journey is blank. Begin by defining your first quests.";
    if (clutterLevel === "High") return "The noise of unfinished tasks is accumulating. Focus on clearing 'Heavy Weight' items to restore equilibrium.";
    if (resilienceLevel === "Unshakeable") return "You are moving with absolute momentum. Your flow is clear, and your actions are precise.";
    return `Your journey as a ${state.rankTitle} is unfolding. Continue to balance your energy between new habits and completing active quests.`;
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 pb-24 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. MASTERY STATUS CARD */}
      <div className="md:col-span-2 bg-[#111214] border-2 border-slate-800 p-8 md:p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-500">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[120px] pointer-events-none rounded-full"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="text-center md:text-left space-y-4">
            <div>
              <h3 className="text-emerald-500 font-black text-[10px] uppercase tracking-[0.4em] mb-2">Mastery Status</h3>
              <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">{state.rankTitle}</h2>
            </div>
            <p className="text-slate-400 font-bold text-sm md:text-base max-w-lg leading-relaxed">
              Level {state.level} Architect. {getNarrative()}
            </p>
            <div className="flex items-center gap-4 justify-center md:justify-start pt-2">
               <div className="h-2 w-32 bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (state.xp / state.xpToNextLevel) * 100)}%` }}></div>
               </div>
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{state.xp} / {state.xpToNextLevel} XP</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="w-28 h-28 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-[2rem] flex items-center justify-center text-white font-black text-5xl shadow-2xl shadow-emerald-900/40 border border-white/10">
              {state.level}
            </div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Tier</span>
          </div>
        </div>
      </div>

      {/* 2. QUEST COMPLETION BY REALM */}
      <div className="bg-[#111214] p-8 rounded-[3rem] border border-slate-800 shadow-xl flex flex-col justify-between">
        <h3 className="text-lg font-black text-white mb-8 tracking-tighter uppercase flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          Realm Distribution
        </h3>
        <div className="h-64 w-full">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#64748b', fontWeight: 800, textTransform: 'uppercase' }} 
                  dy={10}
                />
                <YAxis 
                  hide 
                />
                <Tooltip 
                  cursor={{ fill: '#1f2937', radius: 4 }}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)', fontSize: '12px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="total" fill="#334155" radius={[4, 4, 4, 4]} stackId="a" />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 4, 4]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-slate-600 text-xs font-black uppercase tracking-widest">No Realm Data</div>
          )}
        </div>
      </div>

      {/* 3. EQUILIBRIUM INDEX */}
      <div className="bg-[#111214] p-8 rounded-[3rem] border border-slate-800 shadow-xl flex flex-col items-center relative overflow-hidden">
        <div className="w-full flex justify-between items-start mb-4 relative z-10">
           <h3 className="text-lg font-black text-white tracking-tighter uppercase flex items-center gap-2">
             <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
             Equilibrium
           </h3>
        </div>
        
        <div className="h-64 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={90}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                 contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', fontSize: '12px', fontWeight: 'bold' }}
                 itemStyle={{ color: '#e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-4xl font-black text-white tracking-tighter">
              {completionRate}%
            </span>
            <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Flow Rate</span>
          </div>
        </div>
      </div>

      {/* 4. CHRONICLE OF BALANCE & 5. METRICS */}
      <div className="md:col-span-2 bg-[#111214] text-white p-10 md:p-12 rounded-[4rem] border-2 border-slate-800 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
           <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-black mb-4 tracking-tighter uppercase text-slate-200">Chronicle of Balance</h3>
              <p className="text-slate-400 font-bold leading-loose text-lg italic">
                "{getNarrative()}"
              </p>
           </div>
           
           <div className="flex-shrink-0 grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="p-6 bg-black/40 rounded-[2rem] border border-slate-800 text-center backdrop-blur-sm">
                 <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest block mb-2">Resilience</span>
                 <span className={`text-xl font-black uppercase ${resilienceColor}`}>{resilienceLevel}</span>
              </div>
              <div className="p-6 bg-black/40 rounded-[2rem] border border-slate-800 text-center backdrop-blur-sm">
                 <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest block mb-2">Clutter</span>
                 <span className={`text-xl font-black uppercase ${clutterColor}`}>{clutterLevel}</span>
              </div>
           </div>
        </div>
        
        {/* Ambient Effects */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-600/10 rounded-full blur-[100px] -ml-40 -mb-40 pointer-events-none"></div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
