import { useState, useMemo, useCallback, useEffect } from 'react';
import { Device } from '@capacitor/device';
import { jwtDecode } from 'jwt-decode';
import { Task, AppTab, Project, User, AuthUser, Prerequisite } from '../types.ts';
import { 
  INITIAL_TASKS, 
  INITIAL_PROJECTS, 
  INITIAL_USERS 
} from '../constants.tsx';

const STORAGE_PREFIX = 'life_physics_v1_';

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
  const [coins, setCoins] = useState(0);
  const [level, setLevel] = useState(1);
  const [ownedAvatarIds, setOwnedAvatarIds] = useState<string[]>(['default']);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('default');
  
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isLoading, setIsLoading] = useState(true);

  const triggerHaptic = (pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const updateAppBadge = useCallback((count: number) => {
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        (navigator as any).setAppBadge(count).catch(() => {});
      } else {
        (navigator as any).clearAppBadge().catch(() => {});
      }
    }
  }, []);

  // Theme Handling
  useEffect(() => {
    const savedTheme = localStorage.getItem(`${STORAGE_PREFIX}theme`) as 'dark' | 'light' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(`${STORAGE_PREFIX}theme`, theme);
  }, [theme]);

  // Handle Google Login
  const handleGoogleLogin = useCallback((token: string) => {
    try {
      setGoogleToken(token);
      const decoded: any = jwtDecode(token);
      
      const user: AuthUser = {
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
        token: token
      };
      
      setAuthUser(user);
      setSyncStatus('syncing');
      
      // Attempt to sync with backend
      fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.tasks) {
          // Merge or replace logic here - simple replacement for now
          if (data.tasks.length > 0) {
             const parsedTasks = data.tasks.map((t: any) => ({
               ...t,
               prerequisites: typeof t.prerequisites === 'string' ? JSON.parse(t.prerequisites) : t.prerequisites
             }));
             setTasks(parsedTasks);
          }
          setSyncStatus('synced');
        }
      })
      .catch(err => {
        console.error("Sync failed", err);
        setSyncStatus('error');
      });

    } catch (e) {
      console.error("Login processing error", e);
    }
  }, []);

  useEffect(() => {
    const initDeviceAuth = async () => {
      setIsLoading(true);
      try {
        // If no Google User, fall back to hardware ID
        if (!authUser) {
            const idResult = await Device.getId();
            const info = await Device.getInfo();
            const deviceId = idResult.identifier;
            
            const hardwareUser: AuthUser = {
              id: deviceId,
              name: `Architect-${deviceId.slice(0, 4)}`,
              email: `${deviceId.slice(0, 8)}@${info.model}.internal`,
              picture: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${deviceId}`,
              token: 'hardware_identity'
            };
            setAuthUser(hardwareUser);

            // Load local storage for hardware user
            const storageKey = STORAGE_PREFIX + deviceId;
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                setTasks(parsed.tasks || INITIAL_TASKS);
                setProjects(parsed.projects || INITIAL_PROJECTS);
                setUsers(parsed.users || INITIAL_USERS);
                setXp(parsed.xp || 0);
                setCoins(parsed.coins || 0);
                setLevel(parsed.level || 1);
                setOwnedAvatarIds(parsed.ownedAvatarIds || ['default']);
                setSelectedAvatarId(parsed.selectedAvatarId || 'default');
            } else {
                setTasks(INITIAL_TASKS);
                setProjects(INITIAL_PROJECTS);
                setUsers(INITIAL_USERS);
            }
        }
        setSyncStatus('synced');
      } catch (err) {
        console.error("Hardware ID failed, falling back to local guest", err);
        setSyncStatus('error');
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 800);
      }
    };

    initDeviceAuth();

    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  // Save state and Sync to Cloud if logged in
  useEffect(() => {
    if (authUser && tasks.length > 0) {
      const stateToSave = { tasks, projects, users, xp, coins, level, authUser, ownedAvatarIds, selectedAvatarId };
      const storageKey = STORAGE_PREFIX + authUser.id;
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      
      const pendingCount = tasks.filter(t => t.status === 'pending').length;
      updateAppBadge(pendingCount);

      // Background Sync to Server
      if (googleToken && isOnline) {
        setSyncStatus('syncing');
        fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${googleToken}`
            },
            body: JSON.stringify({ tasks })
        })
        .then(() => setSyncStatus('synced'))
        .catch(() => setSyncStatus('error'));
      }
    }
  }, [tasks, projects, users, xp, coins, level, authUser, updateAppBadge, ownedAvatarIds, selectedAvatarId, googleToken, isOnline]);

  const buyAvatar = useCallback((id: string, price: number) => {
    if (coins >= price && !ownedAvatarIds.includes(id)) {
      setCoins(prev => prev - price);
      setOwnedAvatarIds(prev => [...prev, id]);
      triggerHaptic([50, 10, 50]);
      return true;
    }
    triggerHaptic(10);
    return false;
  }, [coins, ownedAvatarIds]);

  const selectAvatar = useCallback((id: string) => {
    if (ownedAvatarIds.includes(id)) {
      setSelectedAvatarId(id);
      triggerHaptic(50);
      return true;
    }
    return false;
  }, [ownedAvatarIds]);

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
        triggerHaptic([100, 50, 100]);
      }
      return Math.max(0, nextXp); 
    });
  }, [level]);

  const addCoins = useCallback((amount: number) => {
    setCoins(prev => Math.max(0, prev + amount));
  }, []);

  const toggleTask = useCallback((id: string) => {
    let result = { xp: 0, coins: 0, critical: false };
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (!task) return prev;
      const isCompleting = task.status === 'pending';
      const baseXP = XP_VALUES[task.difficulty as keyof typeof XP_VALUES] || 100;
      
      if (isCompleting) {
        const isCritical = Math.random() < 0.2;
        const xpGain = isCritical ? Math.floor(baseXP * 2.5) : baseXP;
        const lootRoll = Math.random() < 0.15 ? Math.floor(Math.random() * 150) + 50 : 0;
        const totalCoins = xpGain + lootRoll;

        result = { xp: xpGain, coins: totalCoins, critical: isCritical || (lootRoll > 0) };
        addXp(xpGain);
        addCoins(totalCoins);
        triggerHaptic(result.critical ? [50, 30, 50] : 50);
      } else {
        result = { xp: -baseXP, coins: -baseXP, critical: false };
        addXp(-baseXP);
        addCoins(-baseXP);
        triggerHaptic(10);
      }

      return prev.map(t => t.id === id ? { 
        ...t, 
        status: isCompleting ? 'completed' : 'pending',
        completedAt: isCompleting ? new Date().toISOString() : undefined
      } : t);
    });
    return result;
  }, [addXp, addCoins]);

  const togglePrerequisite = useCallback((taskId: string, prereqId: string) => {
    let result = { xp: 0, coins: 0, critical: false };
    
    setTasks(prev => {
      return prev.map(task => {
        if (task.id !== taskId || !task.prerequisites) return task;

        const newPrerequisites = task.prerequisites.map(p => {
          if (p.id === prereqId) {
            const isCompleting = !p.completed;
            if (isCompleting) {
              const isCritical = Math.random() < 0.15;
              const xpGain = isCritical ? PREREQ_XP * 4 : PREREQ_XP;
              const lootRoll = Math.random() < 0.1 ? 25 : 0;
              const totalCoins = xpGain + lootRoll;

              result = { xp: xpGain, coins: totalCoins, critical: isCritical || (lootRoll > 0) };
              addXp(xpGain);
              addCoins(totalCoins);
              triggerHaptic(30);
            } else {
              result = { xp: -PREREQ_XP, coins: -PREREQ_XP, critical: false };
              addXp(-PREREQ_XP);
              addCoins(-PREREQ_XP);
              triggerHaptic(10);
            }
            return { ...p, completed: isCompleting, completedAt: isCompleting ? new Date().toISOString() : undefined };
          }
          return p;
        });

        const allDone = newPrerequisites.length > 0 && newPrerequisites.every(p => p.completed && p.label.trim() !== '');
        return { 
          ...task, 
          prerequisites: newPrerequisites, 
          status: allDone ? 'completed' : 'pending',
          completedAt: allDone ? new Date().toISOString() : undefined
        };
      });
    });
    return result;
  }, [addXp, addCoins]);

  const addPrerequisite = useCallback((taskId: string) => {
    triggerHaptic(20);
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
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isAndroid = /android/i.test(userAgent);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    
    const params = new URLSearchParams({
      text: `Quest: ${title}`,
      details: `${description}\n\nSynced via Life Physics.`,
      location: 'Life Physics Dashboard',
    });

    if (isAndroid) {
      const url = `intent://calendar.google.com/calendar/render?action=TEMPLATE&${params.toString()}#Intent;scheme=https;package=com.google.android.calendar;end`;
      window.location.href = url;
    } else if (isMobile) {
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&${params.toString()}`;
      window.location.href = url;
    } else {
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&${params.toString()}`;
      window.open(url, '_blank');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
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
      isOnline,
      level,
      xp,
      coins,
      ownedAvatarIds,
      selectedAvatarId,
      xpToNextLevel: getXPNeededForLevel(level),
      rankTitle: level < 5 ? "Fragment Seeker" : level < 10 ? "Momentum Builder" : "Pattern Mapper",
      authUser,
      syncStatus,
      theme,
      isLoading
    },
    actions: {
      setActiveTab,
      toggleTask,
      togglePrerequisite,
      setIsSidebarOpen,
      setSelectedProjectId,
      addPrerequisite,
      updatePrerequisiteLabel,
      selectTaskSkill,
      addCalendarReminder,
      buyAvatar,
      selectAvatar,
      toggleTheme,
      handleGoogleLogin
    }
  };
};