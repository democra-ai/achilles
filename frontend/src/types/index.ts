export interface User {
  id: string;
  username: string;
  role: string;
  created_at: number;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  created_at: number;
  updated_at: number;
  environments?: Environment[];
}

export interface Environment {
  id: string;
  name: string;
  project_id: string;
  created_at: number;
}

export type SecretCategory = "secret" | "api_key" | "env_var" | "token";

export interface Secret {
  id: string;
  key: string;
  description?: string;
  tags?: string[];
  version: number;
  category: SecretCategory;
  created_at: number;
  updated_at: number;
  value?: string;
}

export interface SecretCreate {
  key: string;
  value: string;
  description?: string;
  tags?: string[];
  category?: SecretCategory;
}

export interface ApiKey {
  id: string;
  name: string;
  scopes: string;
  project_ids: string;
  expires_at: number | null;
  last_used_at: number | null;
  created_at: number;
  is_active: number;
}

export interface ApiKeyCreate {
  name: string;
  scopes: string[];
  project_ids?: string[];
  expires_in_days?: number;
}

export interface AuditEntry {
  id: string;
  timestamp: number;
  action: string;
  resource_type: string;
  resource_id: string | null;
  actor: string;
  ip_address: string | null;
  details: string;
}

export interface ServerStatus {
  running: boolean;
  port: number;
  url: string;
}

export interface McpStatus {
  running: boolean;
  port: number;
  url: string;
}
