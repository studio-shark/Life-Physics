
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
import { Task, AppState } from '../types';

interface AnalyticsPanelProps {
  tasks: Task[];
  state: any;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ tasks, state }) => {
  const categoryData = tasks.reduce((acc: any[], task) => {
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

  const statusData = [
    { name: 'Balanced', value: tasks.filter(t => t.status === 'completed').length },
    { name: 'Stuck/Energy', value: tasks.filter(t => t.status === 'pending').length }
  ];

  const COLORS = ['#10b981', '#1f1f23'];

  return (
    <div className="grid md:grid-cols-2 gap-10 pb-24 relative z-10">
      {/* RPG PROGRESS BOX */}
      <div className="md:col-span-2 bg-[#1a1a1e] border-2 border-emerald-500/20 p-10 rounded-[4rem] shadow-2xl shadow-black/50 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
          <div className="text-center md:text-left">
            <h3 className="text-emerald-500 font-black text-xs uppercase tracking-[0.5em] mb-2">Mastery Status</h3>
            <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-4">{state.rankTitle}</h2>
            <p className="text-slate-400 font-bold max-w-lg">
              You are currently Level {state.level}. Continue gathering memory fragments through meaningful action to reach the next tier of equilibrium.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-32 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center text-white font-black text-5xl shadow-2xl shadow-emerald-900/50">
              {state.level}
            </div>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Current Tier</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-[#141417] p-10 rounded-[4rem] border-2 border-slate-800 shadow-3xl shadow-black/50">
        <h3 className="text-2xl font-black text-white mb-10 tracking-tighter uppercase">Quest Completion by Realm</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f23" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 900 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 900 }} />
              <Tooltip 
                cursor={{ fill: '#1f1f23' }}
                contentStyle={{ backgroundColor: '#000', borderRadius: '24px', border: '1px solid #334155', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)', padding: '20px' }}
              />
              <Bar dataKey="completed" fill="#10b981" radius={[10, 10, 10, 10]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Completion Distribution */}
      <div className="bg-[#141417] p-10 rounded-[4rem] border-2 border-slate-800 shadow-3xl shadow-black/50 flex flex-col items-center">
        <h3 className="text-2xl font-black text-white self-start mb-10 tracking-tighter uppercase">Equilibrium Index</h3>
        <div className="h-72 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={105}
                paddingAngle={10}
                dataKey="value"
                stroke="none"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-5xl font-black text-white tracking-tighter">
              {Math.round((statusData[0].value / (statusData[0].value + statusData[1].value || 1)) * 100)}%
            </span>
            <span className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em] mt-2">Aligned</span>
          </div>
        </div>
      </div>

      {/* Wellness Insight */}
      <div className="md:col-span-2 bg-[#1a1a1e] text-white p-14 rounded-[5rem] border-2 border-slate-800 relative overflow-hidden shadow-4xl shadow-black/80">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-14">
           <div className="flex-1 text-center md:text-left">
              <h3 className="text-4xl font-black mb-6 tracking-tighter uppercase">Chronicle of Balance</h3>
              <p className="text-slate-400 font-bold leading-relaxed text-xl max-w-3xl italic">
                Your journey as a <strong className="text-white">{state.rankTitle}</strong> has reached new heights. 
                By mastering <strong className="text-orange-400">Flow</strong>, you have reduced the inertia of your old patterns. 
                Focus on the remaining <strong className="text-emerald-400">Heavy Weight</strong> quests to transcend to the next level of awareness.
              </p>
           </div>
           <div className="flex-shrink-0 grid grid-cols-2 gap-6">
              <div className="p-8 bg-black rounded-[2.5rem] border border-slate-800 text-center shadow-inner">
                 <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest block mb-2">Resilience</span>
                 <span className="text-2xl font-black text-emerald-500 uppercase">High</span>
              </div>
              <div className="p-8 bg-black rounded-[2.5rem] border border-slate-800 text-center shadow-inner">
                 <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest block mb-2">Clutter</span>
                 <span className="text-2xl font-black text-orange-500 uppercase">Low</span>
              </div>
           </div>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600 rounded-full blur-[150px] opacity-10 -mr-40 -mt-40"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600 rounded-full blur-[150px] opacity-5 -ml-40 -mb-40"></div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
