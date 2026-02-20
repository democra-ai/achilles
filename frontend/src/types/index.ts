export interface User {
  id: number;
  username: string;
  is_admin: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
  environments?: Environment[];
}

export interface Environment {
  id: number;
  name: string;
  project_id: number;
  created_at: string;
}

export interface Secret {
  key: string;
  description?: string;
  tags?: string[];
  version: number;
  created_at: string;
  updated_at: string;
  value?: string;
}

export interface SecretCreate {
  value: string;
  description?: string;
  tags?: string[];
}

export interface ApiKey {
  id: number;
  name: string;
  prefix: string;
  scopes: string[];
  project_id?: number;
  expires_at?: string;
  last_used_at?: string;
  created_at: string;
}

export interface ApiKeyCreate {
  name: string;
  scopes: string[];
  project_id?: number;
  expires_in_days?: number;
}

export interface AuditEntry {
  id: number;
  timestamp: string;
  action: string;
  resource_type: string;
  resource_id: string;
  username: string;
  ip_address: string;
  details: Record<string, unknown>;
}

export interface ServerStatus {
  running: boolean;
  port: number;
  url: string;
}
