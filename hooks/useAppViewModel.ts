import { useState, useMemo, useCallback, useEffect } from 'react';
import { Device } from '@capacitor/device';
import { jwtDecode } from 'jwt-decode';
import { Task, AppTab, Project, User, AuthUser, Prerequisite, Note } from '../types.ts';
import { API_BASE_URL } from '../services/api.ts';
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
  const [notes, setNotes] = useState<Note[]>([]);
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
  const handleGoogleLogin = useCallback(async (token: string) => {
    try {
      setSyncStatus('syncing');

      // 1. Verify token with Backend (Robust Auth Flow)
      // Use API_BASE_URL to ensure this works on Native Android
      const authRes = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token })
      });

      if (!authRes.ok) {
          console.error("Backend auth failed:", await authRes.text());
          throw new Error('Backend authentication verification failed');
      }

      const authData = await authRes.json();
      const userProfile = authData.user;

      // Apply Cloud Preferences immediately if they exist
      if (userProfile.preferences?.theme) {
          setTheme(userProfile.preferences.theme);
      }

      // 2. Migration Strategy: Check for local tasks from hardware/guest session
      if (authUser && authUser.token === 'hardware_identity') {
          const storageKey = STORAGE_PREFIX + authUser.id;
          const saved = localStorage.getItem(storageKey);
          
          if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed.tasks && Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
                  const localTasks: Task[] = parsed.tasks;
                  console.log(`Migrating ${localTasks.length} tasks to cloud...`);
                  
                  // Attempt to upload all local tasks to the new cloud account
                  await Promise.all(localTasks.map(async (task) => {
                      try {
                           const res = await fetch(`${API_BASE_URL}/api/tasks`, {
                               method: 'POST',
                               headers: {
                                   'Content-Type': 'application/json',
                                   'Authorization': `Bearer ${token}`
                               },
                               body: JSON.stringify(task)
                           });
                           if (!res.ok) {
                             console.warn(`Task ${task.title} might already exist or failed to sync.`);
                           }
                      } catch (err) {
                          console.error('Migration upload failed for task', task.id, err);
                      }
                  }));
                  
                  // Clear local storage after migration attempt
                  localStorage.removeItem(storageKey);
                  console.log('Local storage migration complete.');
              }
          }
      }

      // 3. Set Auth State from Verified Profile
      setGoogleToken(token);
      setAuthUser({
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        picture: userProfile.picture,
        token: token,
        preferences: userProfile.preferences
      });
      
      // Persist session
      localStorage.setItem(`${STORAGE_PREFIX}auth_token`, token);
      
      // 4. Load cloud data (Merged)
      const [tasksRes, notesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/tasks`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/notes`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const tasksData = await tasksRes.json();
      if (tasksData.status === 'success' && tasksData.tasks) {
         // Parse prerequisites JSON string from DB
         const parsedTasks = tasksData.tasks.map((t: any) => ({
           ...t,
           prerequisites: typeof t.prerequisites === 'string' ? JSON.parse(t.prerequisites) : t.prerequisites
         }));
         setTasks(parsedTasks);
      }

      const notesData = await notesRes.json();
      if (notesData.status === 'success' && notesData.notes) {
         setNotes(notesData.notes);
      }
      
      setSyncStatus('synced');

    } catch (e) {
      console.error("Login processing error", e);
      setSyncStatus('error');
      // If login failed, ensure we don't keep a bad token
      localStorage.removeItem(`${STORAGE_PREFIX}auth_token`);
    }
  }, [authUser]);

  // Logout Function
  const logout = useCallback(async () => {
    setAuthUser(null);
    setGoogleToken(null);
    setTasks([]);
    setNotes([]);
    localStorage.removeItem(`${STORAGE_PREFIX}auth_token`);
    
    // Re-initialize hardware identity
    setIsLoading(true);
    try {
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

        const storageKey = STORAGE_PREFIX + deviceId;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            const parsed = JSON.parse(saved);
            setTasks(parsed.tasks || INITIAL_TASKS);
            setNotes(parsed.notes || []);
            setProjects(parsed.projects || INITIAL_PROJECTS);
            setUsers(parsed.users || INITIAL_USERS);
            setXp(parsed.xp || 0);
            setCoins(parsed.coins || 0);
            setLevel(parsed.level || 1);
            setOwnedAvatarIds(parsed.ownedAvatarIds || ['default']);
            setSelectedAvatarId(parsed.selectedAvatarId || 'default');
        } else {
            setTasks(INITIAL_TASKS);
            setNotes([]);
            setProjects(INITIAL_PROJECTS);
            setUsers(INITIAL_USERS);
        }
    } catch (err) {
      console.error("Hardware ID failed during logout", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial Hardware/Guest Setup & Session Restoration
  useEffect(() => {
    const initDeviceAuth = async () => {
      setIsLoading(true);
      try {
        // Check for persisted session first
        const savedToken = localStorage.getItem(`${STORAGE_PREFIX}auth_token`);
        if (savedToken) {
            console.log("Restoring session...");
            // We can reuse handleGoogleLogin to verify and load data
            // But we need to be careful about the 'authUser' dependency in handleGoogleLogin
            // For now, let's just call it. Since authUser is null initially, migration logic won't run, which is correct for restore.
            await handleGoogleLogin(savedToken);
            setIsLoading(false);
            return;
        }

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
            // Only set hardware auth if we are strictly offline/guest. 
            // If user logs in later, this gets replaced.
            setAuthUser(hardwareUser);

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
                setNotes([]);
                setProjects(INITIAL_PROJECTS);
                setUsers(INITIAL_USERS);
            }
        }
      } catch (err) {
        console.error("Hardware ID failed", err);
      } finally {
        setTimeout(() => setIsLoading(false), 800);
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
  }, []); // Empty dependency array to run once on mount

  // Sync to API Helper
  const syncTaskToCloud = async (task: Task, method: 'POST' | 'PUT') => {
    if (!authUser || !googleToken || !isOnline || authUser.token === 'hardware_identity') return;
    
    const url = method === 'POST' ? `${API_BASE_URL}/api/tasks` : `${API_BASE_URL}/api/tasks/${task.id}`;
    
    try {
        setSyncStatus('syncing');
        await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${googleToken}`
            },
            body: JSON.stringify(task)
        });
        setSyncStatus('synced');
    } catch (e) {
        console.error(`Failed to ${method} task`, e);
        setSyncStatus('error');
    }
  };

  const syncNoteToCloud = async (note: Note, method: 'POST' | 'PUT' | 'DELETE') => {
    if (!authUser || !googleToken || !isOnline || authUser.token === 'hardware_identity') return;
    
    const url = method === 'POST' ? `${API_BASE_URL}/api/notes` : `${API_BASE_URL}/api/notes/${note.id}`;
    
    try {
        setSyncStatus('syncing');
        await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${googleToken}`
            },
            body: method !== 'DELETE' ? JSON.stringify(note) : undefined
        });
        setSyncStatus('synced');
    } catch (e) {
        console.error(`Failed to ${method} note`, e);
        setSyncStatus('error');
    }
  };

  // Local Storage Fallback (only for Guest/Hardware user)
  useEffect(() => {
    if (authUser && authUser.token === 'hardware_identity') {
      const stateToSave = { tasks, notes, projects, users, xp, coins, level, authUser, ownedAvatarIds, selectedAvatarId };
      const storageKey = STORAGE_PREFIX + authUser.id;
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      
      const pendingCount = tasks.filter(t => t.status === 'pending').length;
      updateAppBadge(pendingCount);
    }
  }, [tasks, notes, projects, users, xp, coins, level, authUser, updateAppBadge, ownedAvatarIds, selectedAvatarId]);

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
      const taskIndex = prev.findIndex(t => t.id === id);
      if (taskIndex === -1) return prev;
      
      const task = prev[taskIndex];
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

      const updatedTask: Task = { 
        ...task, 
        status: isCompleting ? 'completed' : 'pending',
        completedAt: isCompleting ? new Date().toISOString() : undefined
      };

      // Sync to cloud
      syncTaskToCloud(updatedTask, 'PUT');

      const newTasks = [...prev];
      newTasks[taskIndex] = updatedTask as Task;
      return newTasks;
    });
    return result;
  }, [addXp, addCoins, authUser, googleToken, isOnline]);

  const togglePrerequisite = useCallback((taskId: string, prereqId: string) => {
    let result = { xp: 0, coins: 0, critical: false };
    
    setTasks(prev => {
      const taskIndex = prev.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return prev;
      const task = prev[taskIndex];
      if (!task.prerequisites) return prev;

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
      const updatedTask: Task = { 
        ...task, 
        prerequisites: newPrerequisites, 
        status: allDone ? 'completed' : 'pending',
        completedAt: allDone ? new Date().toISOString() : undefined
      };

      // Sync to cloud
      syncTaskToCloud(updatedTask, 'PUT');

      const newTasks = [...prev];
      newTasks[taskIndex] = updatedTask as Task;
      return newTasks;
    });
    return result;
  }, [addXp, addCoins, authUser, googleToken, isOnline]);

  const addPrerequisite = useCallback((taskId: string) => {
    triggerHaptic(20);
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (!task) return prev;
      
      const newP: Prerequisite = { id: Math.random().toString(), label: '', completed: false };
      const updatedTask = { ...task, prerequisites: [...(task.prerequisites || []), newP] };
      
      // We don't sync immediately on empty prereq add, wait for label update or let the next sync handle it
      // But for robustness, let's sync
      syncTaskToCloud(updatedTask, 'PUT');

      return prev.map(t => t.id === taskId ? updatedTask : t);
    });
  }, [authUser, googleToken, isOnline]);

  const updatePrerequisiteLabel = useCallback((taskId: string, pid: string, label: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (!task) return prev;
      
      const updatedTask = { ...task, prerequisites: task.prerequisites?.map(p => p.id === pid ? { ...p, label } : p) };
      
      return prev.map(t => t.id === taskId ? updatedTask : t);
    });
  }, []);

  const addTask = useCallback(async (title: string, description: string = '', difficulty: 'Easy Start' | 'Some Weight' | 'Heavy Weight' = 'Some Weight') => {
      const newTask: Task = {
          id: Math.random().toString(36).substr(2, 9),
          projectId: 'p1',
          title,
          description,
          category: 'Habits',
          status: 'pending',
          difficulty,
          createdAt: new Date().toISOString(),
          prerequisites: []
      };

      // Explicitly await POST if authenticated
      if (authUser && googleToken && isOnline && authUser.token !== 'hardware_identity') {
          try {
              setSyncStatus('syncing');
              const response = await fetch(`${API_BASE_URL}/api/tasks`, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${googleToken}`
                  },
                  body: JSON.stringify(newTask)
              });
              
              if (!response.ok) {
                  throw new Error('Failed to create task on server');
              }
              setSyncStatus('synced');
          } catch (e) {
              console.error("Failed to post task", e);
              setSyncStatus('error');
              return; // Halt update on error
          }
      }

      setTasks(prev => [...prev, newTask]);
      triggerHaptic(30);
  }, [authUser, googleToken, isOnline]);

  const selectTaskSkill = useCallback((taskId: string, skill: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, selectedSkill: skill } : t));
  }, []);

  const addCalendarReminder = useCallback((title: string, description: string = '') => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isAndroid = /android/i.test(userAgent);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    
    const params = new URLSearchParams({
      text: `Quest: ${title}`,
      details: `${description}\n\nSynced via Life-Architect.`,
      location: 'Life-Architect Dashboard',
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

  const addNote = useCallback(async (title: string, content: string) => {
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      userId: authUser?.id || 'guest',
      title,
      content,
      createdAt: new Date().toISOString()
    };

    setNotes(prev => [newNote, ...prev]);
    syncNoteToCloud(newNote, 'POST');
    triggerHaptic(20);
  }, [authUser, googleToken, isOnline]);

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    setNotes(prev => {
      const note = prev.find(n => n.id === id);
      if (!note) return prev;
      const updatedNote = { ...note, ...updates, updatedAt: new Date().toISOString() };
      syncNoteToCloud(updatedNote, 'PUT');
      return prev.map(n => n.id === id ? updatedNote : n);
    });
  }, [authUser, googleToken, isOnline]);

  const deleteNote = useCallback(async (id: string) => {
    const noteToDelete = notes.find(n => n.id === id);
    if (noteToDelete) {
      syncNoteToCloud(noteToDelete, 'DELETE');
    }
    setNotes(prev => prev.filter(n => n.id !== id));
    triggerHaptic(30);
  }, [notes, authUser, googleToken, isOnline]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      
      // Sync to cloud if logged in
      if (authUser && googleToken && isOnline && authUser.token !== 'hardware_identity') {
          fetch(`${API_BASE_URL}/api/user/settings`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${googleToken}`
              },
              body: JSON.stringify({ theme: newTheme })
          }).catch(err => console.error("Failed to sync theme", err));
      }
      
      return newTheme;
    });
  }, [authUser, googleToken, isOnline]);

  const progress = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  return {
    state: {
      activeTab,
      tasks,
      notes,
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
      addTask,
      updatePrerequisiteLabel,
      selectTaskSkill,
      addCalendarReminder,
      buyAvatar,
      selectAvatar,
      addNote,
      updateNote,
      deleteNote,
      toggleTheme,
      handleGoogleLogin,
      logout
    }
  };
};