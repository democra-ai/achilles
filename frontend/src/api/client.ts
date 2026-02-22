import axios from "axios";
import type {
  Project,
  Environment,
  Secret,
  SecretCreate,
  ApiKey,
  ApiKeyCreate,
  AuditEntry,
} from "../types";
import { useStore } from "../store";

const API_BASE = "http://127.0.0.1:8900";

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const store = useStore.getState();
    const { addToast } = store;

    if (!error.response) {
      // Network error - server is down. Immediately mark as offline
      // and activate cooldown so health polls don't flip it back.
      markApiFailed();
      useStore.setState((state) => ({
        serverStatus: { ...state.serverStatus, running: false },
      }));
      addToast({
        type: "error",
        title: "Connection failed",
        message: "Cannot reach the server. Make sure the backend is running.",
        duration: 5000,
      });
    } else if (error.response.status === 422) {
      const detail = error.response.data?.error?.message || error.response.data?.detail;
      addToast({
        type: "warning",
        title: "Validation error",
        message: typeof detail === "string" ? detail : "Please check your input",
      });
    } else if (error.response.status === 401) {
      addToast({
        type: "warning",
        title: "Unauthorized",
        message: "Authentication required",
      });
    } else if (error.response.status === 404) {
      addToast({
        type: "warning",
        title: "Not found",
        message: error.response.data?.error?.message || "Resource not found",
      });
    } else if (error.response.status >= 500) {
      addToast({
        type: "error",
        title: "Server error",
        message: "An internal server error occurred",
      });
    }

    return Promise.reject(error);
  }
);

// Projects
export const projectsApi = {
  list: () => api.get<Project[]>("/projects"),

  create: (name: string, description?: string) =>
    api.post<Project>("/projects", { name, description }),

  get: (id: string) => api.get<Project>(`/projects/${id}`),

  delete: (id: string) => api.delete(`/projects/${id}`),

  environments: (projectId: string) =>
    api.get<Environment[]>(`/projects/${projectId}/environments`),
};

// Secrets
export const secretsApi = {
  list: (projectId: string, env: string, category?: string) =>
    api.get<Secret[]>(`/projects/${projectId}/environments/${env}/secrets`, {
      params: category ? { category } : undefined,
    }),

  get: (projectId: string, env: string, key: string) =>
    api.get<Secret>(
      `/projects/${projectId}/environments/${env}/secrets/${key}`
    ),

  set: (projectId: string, env: string, key: string, data: SecretCreate) =>
    api.put(`/projects/${projectId}/environments/${env}/secrets/${key}`, data),

  delete: (projectId: string, env: string, key: string) =>
    api.delete(`/projects/${projectId}/environments/${env}/secrets/${key}`),
};

// API Keys
export const apiKeysApi = {
  list: () => api.get<ApiKey[]>("/auth/api-keys"),

  create: (data: ApiKeyCreate) =>
    api.post<{ id: string; name: string; key: string; created_at: number }>(
      "/auth/api-keys",
      data
    ),

  revoke: (id: string) => api.delete(`/auth/api-keys/${id}`),
};

// Trash
export interface TrashItem {
  id: string;
  key: string;
  version: number;
  description: string;
  tags: string[];
  category: string;
  created_at: number;
  updated_at: number;
  deleted_at: number;
  project_id: string;
  project_name: string;
  env_name: string;
}

export const trashApi = {
  list: () => api.get<TrashItem[]>("/trash"),
  restore: (secretId: string) => api.post(`/trash/${secretId}/restore`),
  purge: (secretId: string) => api.delete(`/trash/${secretId}`),
  empty: () => api.delete("/trash"),
};

// Audit
export const auditApi = {
  list: (params?: { limit?: number; action?: string }) =>
    api.get<{ entries: AuditEntry[]; limit: number; offset: number }>(
      "/audit",
      { params }
    ),
};

// Track when the last API network failure happened.
// Health polls within the cooldown period are skipped to prevent
// the poll from flipping status back to "online" after a real failure.
let _lastApiFail = 0;
const API_FAIL_COOLDOWN = 15_000; // 15 seconds

export function markApiFailed() {
  _lastApiFail = Date.now();
}

// Health — verifies BOTH /health AND an actual API route (/api/v1/projects).
// If the HTTP process is alive but API routes are broken, this returns false.
export const healthApi = {
  check: async (): Promise<boolean> => {
    // Respect cooldown after a real API failure
    if (Date.now() - _lastApiFail < API_FAIL_COOLDOWN) return false;

    try {
      const opts = {
        timeout: 3000,
        params: { _t: Date.now() },
        headers: { "Cache-Control": "no-cache, no-store" },
      };
      // 1) /health endpoint must respond with "healthy"
      const health = await axios.get(`${API_BASE}/health`, opts);
      if (health.data?.status !== "healthy") return false;

      // 2) An actual API route must also be reachable
      await axios.get(`${API_BASE}/api/v1/projects`, opts);
      return true;
    } catch {
      return false;
    }
  },
};

// MCP Health (check if MCP server port is responding)
const MCP_BASE = "http://127.0.0.1:8901";

export const mcpHealthApi = {
  check: () =>
    axios
      .get(`${MCP_BASE}/health`, {
        timeout: 3000,
        params: { _t: Date.now() },
        headers: { "Cache-Control": "no-cache, no-store" },
      })
      .then((res) => res.data?.status === "ok")
      .catch(() => false),
};

export default api;
