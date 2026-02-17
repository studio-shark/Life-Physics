
export interface Prerequisite {
  id: string;
  label: string;
  completed: boolean;
  completedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  totalXp: number;
  coins: number;
  ownedAvatarIds: string[];
  selectedAvatarId: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  picture: string;
  token: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  color: string;
  ownerId: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  category: 'Habits' | 'Energy' | 'Desire' | 'Choices' | 'Time';
  status: 'pending' | 'completed';
  difficulty: 'Easy Start' | 'Some Weight' | 'Heavy Weight';
  assigneeId?: string;
  dueDate?: string;
  createdAt: string;
  prerequisites?: Prerequisite[];
  iteration?: number;
  cycle?: number;
  selectedSkill?: string;
  completedAt?: string;
  // UI Helpers
  isPrereq?: boolean;
  parentId?: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  timestamp: string;
}

export interface Reminder {
  id: string;
  taskId: string;
  remindAt: string;
  isTriggered: boolean;
}

export enum AppTab {
  CHECKLIST = 'flow',
  HISTORY = 'history',
  SHOP = 'shop',
  ANALYTICS = 'balance',
  WIDGETS = 'widgets',
  SETTINGS = 'settings'
}

export interface AppState {
  activeTab: AppTab;
  tasks: Task[];
  projects: Project[];
  users: User[];
  comments: Comment[];
  reminders: Reminder[];
  selectedProjectId: string | 'all';
  isSidebarOpen: boolean;
  isOnline: boolean;
  skillCache: Record<string, any>;
  progress: number;
  level: number;
  xp: number;
  coins: number;
  ownedAvatarIds: string[];
  selectedAvatarId: string;
  authUser: AuthUser | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  theme: 'dark' | 'light';
  isLoading: boolean;
}
