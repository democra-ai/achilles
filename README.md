<p align="center">
  <img src="docs/images/logo-256.png" width="120" alt="Achilles Vault Logo" />
</p>

<h1 align="center">Achilles Vault</h1>

<p align="center">
  <strong>The secret manager your AI agent can actually use.</strong><br/>
  Local-first. MCP-native. Zero cloud dependency.
</p>

<p align="center">
  <a href="#quick-start"><img src="https://img.shields.io/badge/get_started-30s-10b981?style=for-the-badge" alt="Get Started" /></a>
  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/react-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/tauri-v2-FFC131?style=for-the-badge&logo=tauri&logoColor=black" alt="Tauri" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/encryption-AES--256--GCM-critical?style=flat-square" alt="AES-256-GCM" />
  <img src="https://img.shields.io/badge/protocol-MCP-blueviolet?style=flat-square" alt="MCP" />
  <img src="https://img.shields.io/badge/database-SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/chrome-extension-4285F4?style=flat-square&logo=googlechrome&logoColor=white" alt="Chrome Extension" />
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey?style=flat-square" alt="Platform" />
</p>

---

## The Problem

You're building with AI. Your stack looks something like this:

```
Claude Code → deploys to Vercel → trains on HuggingFace → calls OpenAI → pushes to GitHub
```

Each platform needs a token. You have 20+ API keys scattered across `.env` files, sticky notes, and browser bookmarks. Every time your AI agent needs one, **you stop what you're doing and paste it manually**.

Worse: some developers paste keys directly into prompts. That's a security incident waiting to happen.

---

## The Solution

**Achilles Vault** is an open-source, local-first secret manager built for the AI era.

Store your secrets once. Your AI agents fetch them securely via **MCP (Model Context Protocol)** — no manual copy-paste, no plaintext in prompts, no cloud dependency.

```
# Before Achilles
You:    "Deploy my app to Vercel"
Claude: "I need your VERCEL_TOKEN"
You:    *opens browser, navigates to dashboard, copies token, pastes into chat*

# After Achilles
You:    "Deploy my app to Vercel"
Claude: *calls achilles.get_secret("VERCEL_TOKEN") via MCP*
Done.
```

> **Your secrets never leave your machine. Not to Achilles servers. Not to anyone.**

---

## Screenshots

<table>
<tr>
<td width="50%">

**Desktop App — Dashboard**

<img src="docs/images/screenshot-dashboard.png" alt="Dashboard" />

*Real-time overview of projects, secrets, API keys, and audit activity.*

</td>
<td width="50%">

**Desktop App — Vault**

<img src="docs/images/screenshot-vault.png" alt="Vault" />

*Manage secrets across dev / staging / production environments.*

</td>
</tr>
<tr>
<td width="50%">

**Chrome Extension — Auto-Detect**

<img src="docs/images/screenshot-chrome-detect.png" alt="Chrome Detection" />

*Automatically detects API keys on GitHub, HuggingFace, and 12+ platforms.*

</td>
<td width="50%">

**Chrome Extension — Rule Hit Log**

<img src="docs/images/screenshot-chrome-rules.png" alt="Chrome Rules" />

*Shows which detection rule matched, severity level, and platform.*

</td>
</tr>
</table>

---

## Quick Start

### Prerequisites

- **Python 3.11+**
- Node.js 18+ *(optional, for desktop app)*
- Rust *(optional, for desktop build)*

### 1. Install & Start

```bash
git clone https://github.com/tao-shen/achilles.git
cd achilles

pip install -e .
achilles serve          # starts on port 8900, MCP on port 8901
```

### 2. Register & Store Secrets

```bash
achilles register -U admin -P your-password
achilles login -U admin -P your-password

achilles create-project my-ai-project

achilles set <project-id> OPENAI_API_KEY sk-xxx --env production
achilles set <project-id> HF_TOKEN hf_xxx --env production
achilles set <project-id> GITHUB_TOKEN ghp_xxx --env production
```

### 3. Use with Your AI Agent

```python
# Fetch secrets in any AI pipeline
import httpx

secrets = httpx.post(
    "http://localhost:8900/api/v1/ai/secrets",
    headers={"X-API-Key": "av_your_api_key"},
    json={
        "project": "my-ai-project",
        "environment": "production",
        "keys": ["OPENAI_API_KEY", "HF_TOKEN", "GITHUB_TOKEN"]
    }
).json()["secrets"]
# {"OPENAI_API_KEY": "sk-...", "HF_TOKEN": "hf_...", "GITHUB_TOKEN": "ghp_..."}
```

```bash
# Or inject as environment variables into any command
achilles run <project-id> --env production -- python train.py
```

### 4. Install Chrome Extension *(optional)*

1. Open `chrome://extensions` and enable **Developer mode**
2. Click **Load unpacked** and select the `chrome-extension/` directory
3. Browse to GitHub, HuggingFace, or Vercel — Achilles auto-detects any token on the page and offers to vault it

### 5. Launch Desktop App *(optional)*

```bash
cd frontend && npm install && npx tauri dev
```

---

## AI-Native Integration

This is what sets Achilles apart from every other secret manager.

### MCP Protocol — for Claude Code, Claude Desktop, and MCP-compatible agents

Achilles runs a **Model Context Protocol server on port 8901**. Configure your MCP client once and your AI agent can discover and retrieve secrets natively — no custom code required.

```json
// Claude Desktop / Claude Code — mcp config
{
  "mcpServers": {
    "achilles": {
      "url": "http://localhost:8901"
    }
  }
}
```

Your agent can now call `achilles.get_secret`, `achilles.list_projects`, and more — directly within the conversation.

### OpenAI Function Calling

Auto-generated schemas available at `/api/v1/ai/openai/functions` — drop them into any OpenAI-compatible agent with zero configuration.

### `achilles run` — Inject Secrets Without Touching Your Code

```bash
# Run any script with secrets injected as environment variables
achilles run my-project --env production -- python train.py
achilles run my-project --env staging -- docker-compose up
achilles run my-project --env production -- node server.js

# Or export to a .env file
achilles export my-project --env production > .env
```

No code changes. No secrets in source control. Works with any existing tool or script.

---

## Chrome Extension — Detect Before You Paste

The Chrome extension scans pages for 30+ secret patterns in real time. When it finds one:

1. A badge appears on the Achilles icon
2. Click **Vault** — the token is stored encrypted with full metadata
3. Auto-fill it back into any supported platform's token field later

**Supported platforms:**

| Platform | Token Types Detected |
|----------|---------------------|
| GitHub | PAT (classic, fine-grained), OAuth, App |
| HuggingFace | User Access Token |
| OpenAI | API Key, Project-scoped Key |
| Anthropic | API Key |
| AWS | Access Key ID + Secret Access Key |
| Stripe | Live, Test, Publishable |
| Vercel | API Token |
| Supabase | Service Key |
| Slack | Bot Token, User Token |
| Google | API Key |
| GitLab | Personal Access Token |
| Discord, Groq, Replicate, NPM, PyPI, Firebase | Various |
| | **30 rules total** |

All rules live in [`chrome-extension/rules/rules.json`](chrome-extension/rules/rules.json) — human-readable, editable, extensible. Add your own:

```json
{
  "id": "my-internal-token",
  "name": "Internal Service Token",
  "platform": "MyCompany",
  "pattern": "\\bmc_[A-Za-z0-9]{32,}\\b",
  "flags": "g",
  "severity": "high",
  "description": "Internal microservice authentication token.",
  "contextRequired": false
}
```

Reload the extension — the new rule is active immediately.

---

## Core Vault Features

| Feature | Description |
|---------|-------------|
| **AES-256-GCM Encryption** | All secrets encrypted at rest. Per-secret random salt and nonce — no ciphertext reuse |
| **Project / Environment Hierarchy** | Organize by project with `development`, `staging`, `production` environments |
| **Secret Versioning** | Full version history with one-click rollback |
| **Audit Logging** | Immutable record of every vault operation — who, what, when |
| **JWT + API Key Auth** | JWT for interactive sessions, API keys for agents and CI/CD |
| **Zero External Dependencies** | SQLite only. No PostgreSQL, no Redis, no external services |
| **Soft Delete & Recovery** | Deleted secrets go to trash — recoverable until permanently purged |

---

## Desktop App

Native macOS app (Tauri v2) with full dark theme, overlay titlebar, and JetBrains Mono.

```bash
cd frontend && npm install && npx tauri dev

# Or launch via deep link
open achillesvault://open
```

---

## Security

| Layer | Implementation |
|-------|---------------|
| **Encryption** | AES-256-GCM with authenticated encryption |
| **Key Derivation** | scrypt (memory-hard KDF) |
| **Salt & Nonce** | Per-secret random values — no reuse |
| **Master Key** | Never stored on disk — derived at runtime |
| **Authentication** | JWT (configurable expiry) + scoped API keys |
| **Rate Limiting** | 5 registrations/min, 10 logins/min on auth endpoints |
| **Audit Trail** | Immutable log of every vault operation |
| **Local-Only** | All data stays on your machine. Zero cloud calls |

---

## vs. Alternatives

| Feature | **Achilles Vault** | Doppler | Infisical | 1Password |
|---------|:-----------------:|:-------:|:---------:|:---------:|
| Open Source | **MIT** | No | MIT | No |
| Local-First | **Yes** | SaaS | Self-host | SaaS |
| AI / MCP Native | **Yes** | No | Partial | No |
| Chrome Extension + Secret Detection | **Yes** | No | No | No |
| `run` command (env injection) | **Yes** | Yes | Yes | No |
| Zero Config | **SQLite** | SaaS | Postgres + Redis | SaaS |
| Cost | **Free** | Paid | Free tier | Paid |

---

## API Reference

**Base URL:** `http://localhost:8900`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register new user |
| `POST` | `/api/v1/auth/login` | Get JWT token |
| `POST` | `/api/v1/auth/api-keys` | Create API key |
| `GET` | `/api/v1/projects` | List projects |
| `POST` | `/api/v1/projects` | Create project |
| `GET` | `/api/v1/projects/{id}/environments/{env}/secrets` | List secrets (metadata only) |
| `PUT` | `/api/v1/projects/{id}/environments/{env}/secrets/{key}` | Create or update secret |
| `GET` | `/api/v1/projects/{id}/environments/{env}/secrets/{key}` | Get decrypted value |
| `DELETE` | `/api/v1/projects/{id}/environments/{env}/secrets/{key}` | Soft delete secret |
| `POST` | `/api/v1/ai/secrets` | Fetch multiple secrets (for AI agents) |
| `GET` | `/api/v1/ai/mcp/tools` | List available MCP tools |
| `POST` | `/api/v1/ai/mcp/call` | Execute an MCP tool call |
| `GET` | `/api/v1/ai/openai/functions` | OpenAI function calling schemas |

---

## Architecture

```
achilles/
├── achilles/                    # Python backend (FastAPI)
│   ├── main.py                  # Server entry point (port 8900)
│   ├── crypto.py                # AES-256-GCM encryption
│   ├── database.py              # Async SQLite
│   ├── auth.py                  # JWT + API key auth
│   ├── mcp_server.py            # MCP protocol server (port 8901)
│   ├── routers/
│   │   ├── secrets_router.py    # Secret CRUD
│   │   ├── projects_router.py   # Project & environment management
│   │   ├── ai_router.py         # MCP + OpenAI function calling
│   │   ├── auth_router.py       # Registration & login
│   │   ├── audit_router.py      # Audit log
│   │   └── trash_router.py      # Soft delete & recovery
│   └── cli/
│       └── main.py              # Typer CLI
│
├── frontend/                    # React 19 + Tauri v2
│   ├── src/
│   │   ├── pages/               # Dashboard, Vault, Secrets, Settings
│   │   ├── components/          # Layout, UI components (shadcn/ui)
│   │   ├── store/               # Zustand state management
│   │   └── api/                 # API client
│   └── src-tauri/               # Tauri Rust backend & config
│
└── chrome-extension/            # Manifest V3
    ├── rules/rules.json         # 30+ detection rules
    ├── content/detector.js      # Pattern matching & page scanning
    ├── background/service-worker.js
    └── popup/
```

---

## Docker

```bash
docker build -t achilles-vault .
docker run -p 8900:8900 \
  -v achilles-data:/root/.achilles \
  -e ACHILLES_MASTER_KEY=your-master-key \
  achilles-vault
```

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ACHILLES_MASTER_KEY` | random | Master encryption key |
| `ACHILLES_JWT_SECRET` | random | JWT signing secret |
| `ACHILLES_HOST` | `127.0.0.1` | Server bind address |
| `ACHILLES_PORT` | `8900` | Server port |

---

## Roadmap

- [ ] VS Code extension
- [ ] Firefox & Edge support
- [ ] Team sharing with encrypted key exchange
- [ ] Secret rotation policies & expiry alerts
- [ ] `achilles inject` for Dockerfile / docker-compose
- [ ] RBAC with fine-grained permissions
- [ ] Biometric unlock (Touch ID / Windows Hello)

---

## Contributing

```bash
git clone https://github.com/tao-shen/achilles.git
cd achilles

# Backend
pip install -e ".[dev]"
pytest

# Frontend
cd frontend && npm install && npm run dev

# Lint
ruff check achilles/
```

PRs are welcome. Please open an issue first for large changes.

---

## License

[MIT](LICENSE) — free for personal and commercial use.

---

<p align="center">
  <img src="docs/images/logo-256.png" width="48" alt="Achilles Vault" />
  <br/>
  <sub>Built for developers who ship with AI.</sub>
</p>
