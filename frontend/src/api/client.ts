import axios from "axios";
import type {
  AuthTokens,
  Project,
  Environment,
  Secret,
  SecretCreate,
  ApiKey,
  ApiKeyCreate,
  AuditEntry,
} from "../types";

const API_BASE = "http://127.0.0.1:8900";

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("achilles_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("achilles_token");
      window.location.hash = "#/login";
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (username: string, password: string) =>
    api.post<AuthTokens>("/auth/register", { username, password }),

  login: (username: string, password: string) =>
    api.post<AuthTokens>("/auth/login", { username, password }),
};

// Projects
export const projectsApi = {
  list: () => api.get<Project[]>("/projects"),

  create: (name: string, description?: string) =>
    api.post<Project>("/projects", { name, description }),

  get: (id: number) => api.get<Project>(`/projects/${id}`),

  delete: (id: number) => api.delete(`/projects/${id}`),

  environments: (projectId: number) =>
    api.get<Environment[]>(`/projects/${projectId}/environments`),
};

// Secrets
export const secretsApi = {
  list: (projectId: number, env: string) =>
    api.get<Secret[]>(`/projects/${projectId}/environments/${env}/secrets`),

  get: (projectId: number, env: string, key: string) =>
    api.get<Secret>(
      `/projects/${projectId}/environments/${env}/secrets/${key}`
    ),

  set: (projectId: number, env: string, key: string, data: SecretCreate) =>
    api.put(`/projects/${projectId}/environments/${env}/secrets/${key}`, data),

  delete: (projectId: number, env: string, key: string) =>
    api.delete(`/projects/${projectId}/environments/${env}/secrets/${key}`),
};

// API Keys
export const apiKeysApi = {
  list: () => api.get<ApiKey[]>("/auth/api-keys"),

  create: (data: ApiKeyCreate) =>
    api.post<{ key: string; api_key: ApiKey }>("/auth/api-keys", data),

  revoke: (id: number) => api.delete(`/auth/api-keys/${id}`),
};

// Audit
export const auditApi = {
  list: (params?: { limit?: number; action?: string }) =>
    api.get<AuditEntry[]>("/audit", { params }),
};

// Health
export const healthApi = {
  check: () =>
    axios
      .get(`${API_BASE}/health`)
      .then(() => true)
      .catch(() => false),
};

export default api;
