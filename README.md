# Achilles Vault

Open-source, local-first secret management designed for AI/LLM workflows.

Achilles Vault lets you store, manage, and serve API keys and credentials through a secure local API that AI agents can call directly. Think of it as your personal Infisical/Doppler that runs on your machine and speaks MCP.

## Features

- **AES-256-GCM Encryption** — All secrets encrypted at rest with authenticated encryption
- **Project/Environment Hierarchy** — Organize secrets by project (dev/staging/prod)
- **AI-Native API** — MCP-compatible tools + OpenAI function calling schemas
- **JWT + API Key Auth** — Dual authentication for humans and machines
- **Secret Versioning** — Full version history with rollback capability
- **Audit Logging** — Immutable record of every vault operation
- **Web Dashboard** — Dark-themed management UI
- **CLI Tool** — `achilles` command for terminal workflows
- **`achilles run`** — Inject secrets as env vars (like `doppler run`)
- **Zero Dependencies** — SQLite-based, no external services required

## Quick Start

```bash
# Install
pip install -e .

# Start the server
achilles serve

# Register (first user becomes admin)
achilles register -U admin -P your-password

# Login
achilles login -U admin -P your-password

# Create a project
achilles create-project my-app

# Set secrets
achilles set <project-id> OPENAI_API_KEY sk-xxx --env development
achilles set <project-id> DATABASE_URL postgres://... --env production

# Get a secret
achilles get <project-id> OPENAI_API_KEY --env development

# Run a command with secrets injected
achilles run <project-id> -- python my_script.py --env production

# Export as .env
achilles export <project-id> --env production > .env
```

## API Endpoints

### REST API (v1)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Get JWT token |
| POST | `/api/v1/auth/api-keys` | Create API key |
| GET | `/api/v1/projects` | List projects |
| POST | `/api/v1/projects` | Create project |
| GET | `/api/v1/projects/{id}/environments/{env}/secrets` | List secrets |
| PUT | `/api/v1/projects/{id}/environments/{env}/secrets/{key}` | Set secret |
| GET | `/api/v1/projects/{id}/environments/{env}/secrets/{key}` | Get secret |
| DELETE | `/api/v1/projects/{id}/environments/{env}/secrets/{key}` | Delete secret |

### AI Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ai/secrets` | Simple AI secret fetch |
| GET | `/api/v1/ai/mcp/tools` | List MCP tools |
| POST | `/api/v1/ai/mcp/call` | Execute MCP tool call |
| GET | `/api/v1/ai/openai/functions` | OpenAI function schemas |

### AI Agent Usage

```python
# Simple secret fetch for AI agents
import httpx

resp = httpx.post("http://localhost:8900/api/v1/ai/secrets",
    headers={"X-API-Key": "av_your_key"},
    json={"project": "my-app", "environment": "production",
          "keys": ["OPENAI_API_KEY", "DATABASE_URL"]})

secrets = resp.json()["secrets"]
# {"OPENAI_API_KEY": "sk-...", "DATABASE_URL": "postgres://..."}
```

```python
# MCP tool call
resp = httpx.post("http://localhost:8900/api/v1/ai/mcp/call",
    headers={"X-API-Key": "av_your_key"},
    json={"name": "get_secret",
          "arguments": {"project": "my-app", "key": "OPENAI_API_KEY"}})
```

## Architecture

```
achilles/
├── main.py          # FastAPI app with security middleware
├── config.py        # Settings (master key, JWT config)
├── crypto.py        # AES-256-GCM encryption layer
├── database.py      # SQLite with encrypted storage
├── auth.py          # JWT + API key authentication
├── models.py        # Pydantic request/response models
├── routers/
│   ├── auth_router.py      # Auth endpoints
│   ├── projects_router.py  # Project/env management
│   ├── secrets_router.py   # Secret CRUD
│   ├── ai_router.py        # MCP + OpenAI function calling
│   └── audit_router.py     # Audit log
└── cli/
    └── main.py      # Typer CLI tool
```

## Security

- Secrets encrypted with **AES-256-GCM** (authenticated encryption)
- Key derivation via **scrypt** (memory-hard KDF)
- Per-secret random salt and nonce (no ciphertext reuse)
- Master key never stored on disk
- JWT tokens with configurable expiry
- API keys with scope-based access control
- Rate limiting on auth endpoints
- Full audit trail

## Docker

```bash
docker build -t achilles-vault .
docker run -p 8900:8900 -v achilles-data:/root/.achilles \
  -e ACHILLES_MASTER_KEY=your-master-key \
  achilles-vault
```

## Configuration

| Env Variable | Default | Description |
|--------------|---------|-------------|
| `ACHILLES_MASTER_KEY` | random | Master encryption key |
| `ACHILLES_JWT_SECRET` | random | JWT signing secret |
| `ACHILLES_HOST` | 127.0.0.1 | Server bind address |
| `ACHILLES_PORT` | 8900 | Server port |

## Competitors

| Feature | Achilles Vault | Infisical | Doppler | Akeyless |
|---------|---------------|-----------|---------|----------|
| Open Source | Yes (MIT) | Yes (MIT) | No | No |
| Self-Hosted | Yes (local) | Yes | No | Hybrid |
| AI/MCP Native | Yes | MCP Server | No | SecretlessAI |
| Zero Config | Yes (SQLite) | PostgreSQL + Redis | SaaS | SaaS + Gateway |
| Encryption | AES-256-GCM | AES-256-GCM | Managed | DFC (patented) |

## License

MIT
