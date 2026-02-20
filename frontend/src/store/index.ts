import { create } from "zustand";
import type { User, Project, Secret, ApiKey, ServerStatus } from "../types";
import { healthApi } from "../api/client";

interface AppStore {
  // Auth
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user?: User) => void;
  logout: () => void;

  // Server
  serverStatus: ServerStatus;
  checkServerHealth: () => Promise<void>;

  // Projects
  projects: Project[];
  selectedProject: Project | null;
  selectedEnv: string;
  setProjects: (projects: Project[]) => void;
  selectProject: (project: Project | null) => void;
  selectEnv: (env: string) => void;

  // Secrets
  secrets: Secret[];
  setSecrets: (secrets: Secret[]) => void;

  // API Keys
  apiKeys: ApiKey[];
  setApiKeys: (keys: ApiKey[]) => void;

  // UI
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useStore = create<AppStore>((set) => ({
  // Auth
  token: localStorage.getItem("achilles_token"),
  user: null,
  isAuthenticated: !!localStorage.getItem("achilles_token"),

  setAuth: (token: string, user?: User) => {
    localStorage.setItem("achilles_token", token);
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("achilles_token");
    set({ token: null, user: null, isAuthenticated: false });
  },

  // Server
  serverStatus: { running: false, port: 8900, url: "http://127.0.0.1:8900" },

  checkServerHealth: async () => {
    const running = await healthApi.check();
    set((state) => ({
      serverStatus: { ...state.serverStatus, running },
    }));
  },

  // Projects
  projects: [],
  selectedProject: null,
  selectedEnv: "development",
  setProjects: (projects) => set({ projects }),
  selectProject: (project) => set({ selectedProject: project }),
  selectEnv: (env) => set({ selectedEnv: env }),

  // Secrets
  secrets: [],
  setSecrets: (secrets) => set({ secrets }),

  // API Keys
  apiKeys: [],
  setApiKeys: (keys) => set({ apiKeys: keys }),

  // UI
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
