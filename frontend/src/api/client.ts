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
    const { addToast } = useStore.getState();

    if (!error.response) {
      // Network error - server is down
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
  list: (projectId: string, env: string) =>
    api.get<Secret[]>(`/projects/${projectId}/environments/${env}/secrets`),

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

// Audit
export const auditApi = {
  list: (params?: { limit?: number; action?: string }) =>
    api.get<{ entries: AuditEntry[]; limit: number; offset: number }>(
      "/audit",
      { params }
    ),
};

// Health (no interceptor - health check failures are expected when server is off)
export const healthApi = {
  check: () =>
    axios
      .get(`${API_BASE}/health`, { timeout: 3000 })
      .then(() => true)
      .catch(() => false),
};

// MCP Health (check if MCP server port is responding)
const MCP_BASE = "http://127.0.0.1:8901";

export const mcpHealthApi = {
  check: () =>
    axios
      .get(`${MCP_BASE}/health`, { timeout: 3000 })
      .then(() => true)
      .catch(() => false),
};

export default api;
