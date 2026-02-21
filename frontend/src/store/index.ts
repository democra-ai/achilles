import { create } from "zustand";
import type { Project, Secret, ApiKey, ServerStatus } from "../types";
import { healthApi } from "../api/client";

interface AppStore {
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
