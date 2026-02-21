import { create } from "zustand";
import type { Project, Secret, ApiKey, ServerStatus, McpStatus } from "../types";
import { healthApi, mcpHealthApi } from "../api/client";

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

interface AppStore {
  // Server
  serverStatus: ServerStatus;
  checkServerHealth: () => Promise<void>;

  // MCP Server
  mcpStatus: McpStatus;
  checkMcpHealth: () => Promise<void>;

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

  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

let toastId = 0;

export const useStore = create<AppStore>((set) => ({
  // Server
  serverStatus: { running: false, port: 8900, url: "http://127.0.0.1:8900" },

  checkServerHealth: async () => {
    const running = await healthApi.check();
    set((state) => ({
      serverStatus: { ...state.serverStatus, running },
    }));
  },

  // MCP Server
  mcpStatus: { running: false, port: 8901, url: "http://127.0.0.1:8901" },

  checkMcpHealth: async () => {
    const running = await mcpHealthApi.check();
    set((state) => ({
      mcpStatus: { ...state.mcpStatus, running },
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

  // Toasts
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${++toastId}`;
    set((state) => ({
      toasts: [...state.toasts.slice(-4), { ...toast, id }],
    }));
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
