
export interface Prerequisite {
  id: string;
  label: string;
  completed: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  totalXp: number;
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
  GUIDE = 'guide',
  ANALYTICS = 'balance',
  WIDGETS = 'widgets'
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
  selectedPhase: 'The Beginning' | 'Building Habits' | 'Finding Balance';
  archAdvice: string;
  isArchLoading: boolean;
  aiContentMap: Record<string, any>;
  skillCache: Record<string, any>;
  loadingTasks: Record<string, boolean>;
  progress: number;
  level: number;
  xp: number;
  authUser: AuthUser | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
}
