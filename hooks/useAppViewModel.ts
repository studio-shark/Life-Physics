
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Task, AppTab, Project, User, AuthUser, Prerequisite } from '../types.ts';
import { 
  INITIAL_TASKS, 
  INITIAL_PROJECTS, 
  INITIAL_USERS 
} from '../constants.tsx';
import { generateSmartTaskBreakdown, getArchitectureAdvice } from '../services/geminiService.ts';
import { CloudService } from '../services/cloudService.ts';

const STORAGE_KEY = 'life_physics_prod_state';

const XP_VALUES = {
  'Easy Start': 100,
  'Some Weight': 250,
  'Heavy Weight': 500
};

const PREREQ_XP = 25;
const getXPNeededForLevel = (level: number) => Math.floor(500 * Math.pow(level, 1.2));

export const useAppViewModel = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.CHECKLIST);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>('all');
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [aiContentMap, setAiContentMap] = useState<Record<string, any>>({});
  const [loadingTasks, setLoadingTasks] = useState<Record<string, boolean>>({});

  const [selectedPhase, setSelectedPhase] = useState<'The Beginning' | 'Building Habits' | 'Finding Balance'>('The Beginning');
  const [archAdvice, setArchAdvice] = useState('');
  const [isArchLoading, setIsArchLoading] = useState(false);
  
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTasks(parsed.tasks || INITIAL_TASKS);
        setProjects(parsed.projects || INITIAL_PROJECTS);
        setUsers(parsed.users || INITIAL_USERS);
        setXp(parsed.xp || 0);
        setLevel(parsed.level || 1);
        if (parsed.authUser) setAuthUser(parsed.authUser);
      } catch (e) {
        setTasks(INITIAL_TASKS);
      }
    } else {
      setTasks(INITIAL_TASKS);
      setProjects(INITIAL_PROJECTS);
      setUsers(INITIAL_USERS);
    }

    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      const stateToSave = { tasks, projects, users, xp, level, authUser };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));

      if (authUser && syncStatus !== 'syncing') {
        setSyncStatus('syncing');
        CloudService.pushProgress(authUser.id, authUser.token, stateToSave)
          .then(() => setSyncStatus('synced'))
          .catch(() => setSyncStatus('error'));
      }
    }
  }, [tasks, projects, users, xp, level, authUser, syncStatus]);

  const handleGoogleSignIn = useCallback((response: any) => {
    try {
      const parts = response.credential.split('.');
      if (parts.length < 2) return;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));

      const newAuthUser: AuthUser = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        token: response.credential
      };

      setAuthUser(newAuthUser);
      setSyncStatus('syncing');

      CloudService.pullProgress(newAuthUser.id, newAuthUser.token).then((cloudRes: any) => {
        if (cloudRes && cloudRes.data) {
          const d = cloudRes.data;
          setTasks(d.tasks || tasks);
          setXp(d.xp || xp);
          setLevel(d.level || level);
          setSyncStatus('synced');
        } else {
          setSyncStatus('synced');
        }
      });
    } catch (err) {
      setSyncStatus('error');
    }
  }, [tasks, xp, level]);

  const signOut = useCallback(() => {
    setAuthUser(null);
    setSyncStatus('idle');
  }, []);

  const addXp = useCallback((amount: number) => {
    setXp(currentXp => {
      let nextXp = currentXp + amount;
      let currentLevel = level;
      let needed = getXPNeededForLevel(currentLevel);
      
      while (nextXp >= needed) {
        nextXp -= needed;
        currentLevel++;
        setLevel(currentLevel);
        needed = getXPNeededForLevel(currentLevel);
      }
      return Math.max(0, nextXp); 
    });
  }, [level]);

  const toggleTask = useCallback((id: string) => {
    let result = { xp: 0, critical: false };
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (!task) return prev;
      const isCompleting = task.status === 'pending';
      const baseXP = XP_VALUES[task.difficulty as keyof typeof XP_VALUES] || 100;
      
      if (isCompleting) {
        const isCritical = Math.random() < 0.2;
        const gain = isCritical ? Math.floor(baseXP * 2.5) : baseXP;
        result = { xp: gain, critical: isCritical };
        addXp(gain);
      } else {
        result = { xp: -baseXP, critical: false };
        addXp(-baseXP);
      }

      return prev.map(t => t.id === id ? { ...t, status: isCompleting ? 'completed' : 'pending' } : t);
    });
    return result;
  }, [addXp]);

  const togglePrerequisite = useCallback((taskId: string, prereqId: string) => {
    let result = { xp: 0, critical: false };
    
    setTasks(prev => {
      return prev.map(task => {
        if (task.id !== taskId || !task.prerequisites) return task;

        const newPrerequisites = task.prerequisites.map(p => {
          if (p.id === prereqId) {
            const isCompleting = !p.completed;
            if (isCompleting) {
              const isCritical = Math.random() < 0.15;
              const gain = isCritical ? PREREQ_XP * 4 : PREREQ_XP;
              result = { xp: gain, critical: isCritical };
              addXp(gain);
            } else {
              result = { xp: -PREREQ_XP, critical: false };
              addXp(-PREREQ_XP);
            }
            return { ...p, completed: isCompleting };
          }
          return p;
        });

        const allDone = newPrerequisites.length > 0 && newPrerequisites.every(p => p.completed && p.label.trim() !== '');
        return { ...task, prerequisites: newPrerequisites, status: allDone ? 'completed' : 'pending' };
      });
    });
    return result;
  }, [addXp]);

  const addPrerequisite = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const newP: Prerequisite = { id: Math.random().toString(), label: '', completed: false };
        return { ...t, prerequisites: [...(t.prerequisites || []), newP] };
      }
      return t;
    }));
  }, []);

  const updatePrerequisiteLabel = useCallback((taskId: string, pid: string, label: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, prerequisites: t.prerequisites?.map(p => p.id === pid ? { ...p, label } : p) };
      }
      return t;
    }));
  }, []);

  const selectTaskSkill = useCallback((taskId: string, skill: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, selectedSkill: skill } : t));
  }, []);

  const addCalendarReminder = useCallback((title: string, description: string = '') => {
    const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const params = new URLSearchParams({
      text: `Quest: ${title}`,
      details: `${description}\n\nSynced via Life Physics.`,
      location: 'Life Physics Dashboard',
    });
    window.open(`${baseUrl}&${params.toString()}`, '_blank');
  }, []);

  const fetchTaskAI = useCallback(async (taskId: string, taskTitle: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask || aiContentMap[taskId] || !navigator.onLine) return;
    
    setLoadingTasks(prev => ({ ...prev, [taskId]: true }));
    try {
      const labels = targetTask?.prerequisites?.map(p => p.label).filter(l => l.trim() !== '');
      const result = await generateSmartTaskBreakdown(taskTitle, labels, targetTask.selectedSkill);
      setAiContentMap(prev => ({ ...prev, [taskId]: result }));
    } catch (err) {
      // Production fail silently
    } finally {
      setLoadingTasks(prev => ({ ...prev, [taskId]: false }));
    }
  }, [aiContentMap, tasks]);

  const handlePhaseChange = useCallback(async (phase: 'The Beginning' | 'Building Habits' | 'Finding Balance') => {
    setSelectedPhase(phase);
    if (!navigator.onLine) return;
    setIsArchLoading(true);
    try {
      const advice = await getArchitectureAdvice(phase);
      setArchAdvice(advice);
    } catch (err) {
      // Production fail silently
    } finally {
      setIsArchLoading(false);
    }
  }, []);

  const progress = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  return {
    state: {
      activeTab,
      tasks,
      allTasks: tasks,
      projects,
      selectedProjectId,
      isSidebarOpen,
      progress,
      aiContentMap,
      loadingTasks,
      isOnline,
      level,
      xp,
      xpToNextLevel: getXPNeededForLevel(level),
      rankTitle: level < 5 ? "Fragment Seeker" : level < 10 ? "Momentum Builder" : "Pattern Mapper",
      authUser,
      syncStatus,
      selectedPhase,
      archAdvice,
      isArchLoading
    },
    actions: {
      setActiveTab,
      toggleTask,
      togglePrerequisite,
      setIsSidebarOpen,
      fetchTaskAI,
      setSelectedProjectId,
      handleGoogleSignIn,
      signOut,
      addPrerequisite,
      updatePrerequisiteLabel,
      selectTaskSkill,
      handlePhaseChange,
      addCalendarReminder
    }
  };
};
