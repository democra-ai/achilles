import {
  Key,
  Shield,
  Lock,
  FileKey2,
  Terminal,
  Hash,
} from "lucide-react";
import type { SecretCategory } from "@/types";

export interface CategoryMeta {
  label: string;
  singular: string;
  icon: typeof Key;
  placeholder: string;
  description: string;
}

export const CATEGORY_META: Record<SecretCategory, CategoryMeta> = {
  api_key: {
    label: "API Keys",
    singular: "API Key",
    icon: Key,
    placeholder: "OPENAI_API_KEY",
    description: "Manage external API keys",
  },
  token: {
    label: "Tokens",
    singular: "Token",
    icon: Shield,
    placeholder: "OAUTH_REFRESH_TOKEN",
    description: "Manage authentication tokens",
  },
  password: {
    label: "Passwords",
    singular: "Password",
    icon: Lock,
    placeholder: "DATABASE_PASSWORD",
    description: "Manage passwords and credentials",
  },
  certificate: {
    label: "Certificates",
    singular: "Certificate",
    icon: FileKey2,
    placeholder: "SSL_CERT",
    description: "Manage certificates and keys",
  },
  env_var: {
    label: "Env Variables",
    singular: "Env Variable",
    icon: Terminal,
    placeholder: "DATABASE_URL",
    description: "Manage environment variables",
  },
  identifier: {
    label: "Identifiers",
    singular: "Identifier",
    icon: Hash,
    placeholder: "PROJECT_ID",
    description: "Manage IDs, URLs, and resource identifiers",
  },
};

export const CATEGORY_LIST = (Object.keys(CATEGORY_META) as SecretCategory[]).map((key) => ({
  value: key,
  ...CATEGORY_META[key],
}));

export const SOURCE_LABELS: Record<string, string> = {
  github: "GitHub",
  gitlab: "GitLab",
  huggingface: "Hugging Face",
  openai: "OpenAI",
  anthropic: "Anthropic",
  stripe: "Stripe",
  aws: "AWS",
  npm: "npm",
  pypi: "PyPI",
  vercel: "Vercel",
  supabase: "Supabase",
  cloudflare: "Cloudflare",
  digitalocean: "DigitalOcean",
};

export const SOURCE_KEY_HINTS: Array<{ pattern: RegExp; source: keyof typeof SOURCE_LABELS }> = [
  { pattern: /^GITHUB(?:_|$)/i, source: "github" },
  { pattern: /^GITLAB(?:_|$)/i, source: "gitlab" },
  { pattern: /^(HUGGINGFACE|HUGGING_FACE|HF)(?:_|$)/i, source: "huggingface" },
  { pattern: /^OPENAI(?:_|$)/i, source: "openai" },
  { pattern: /^ANTHROPIC(?:_|$)/i, source: "anthropic" },
  { pattern: /^STRIPE(?:_|$)/i, source: "stripe" },
  { pattern: /^AWS(?:_|$)/i, source: "aws" },
  { pattern: /^NPM(?:_|$)/i, source: "npm" },
  { pattern: /^PYPI(?:_|$)/i, source: "pypi" },
  { pattern: /^VERCEL(?:_|$)/i, source: "vercel" },
  { pattern: /^SUPABASE(?:_|$)/i, source: "supabase" },
  { pattern: /^CLOUDFLARE(?:_|$)/i, source: "cloudflare" },
  { pattern: /^DIGITALOCEAN(?:_|$)/i, source: "digitalocean" },
];

export const SOURCE_PLATFORM_ID: Record<string, string> = Object.fromEntries(
  Object.entries(SOURCE_LABELS).map(([id, label]) => [label, id])
);
