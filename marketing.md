# Achilles Vault — Reddit Marketing Playbook

> **Product:** Achilles Vault — Open-source, local-first secret manager for AI-powered development
> **Goal:** Drive GitHub stars, community adoption, and developer mindshare
> **Platform:** Reddit
> **Tone:** Authentic developer voice. No corporate speak. Show, don't tell.

---

## General Strategy Notes / 总体策略说明

**Core Reddit Marketing Principles / Reddit 营销核心原则:**

1. **Lead with pain, not product** — Redditors hate ads. Frame every post as "I had this problem, here's what I built." / 以痛点开头，而非产品——Reddit 用户厌恶广告。每篇帖子都要以"我遇到了这个问题，这是我的解决方案"来切入。
2. **Show the workflow, not the feature list** — Before/After comparisons convert. Feature lists don't. / 展示工作流程，而非功能清单——前后对比能打动人，功能列表不能。
3. **Engage every comment** — The post is 30% of the growth. The comment section is 70%. / 回复每一条评论——帖子只贡献 30% 的增长，评论区贡献 70%。
4. **Timing:** Post between 8-10am EST on Tuesday-Thursday for peak engagement. / 发布时间：美东时间周二至周四上午 8-10 点，参与度最高。
5. **Never use the word "excited"** — Dead giveaway of marketing. Use "frustrated", "annoyed", "finally". / 永远不要用"excited"——这是营销的明显标志。用"frustrated"、"annoyed"、"finally"代替。

---

## Campaign 1: r/ChatGPT + r/ClaudeAI

**Audience Profile / 受众画像:** AI power users, prompt engineers, people using Claude/ChatGPT daily for coding tasks. High overlap with API key users. / AI 深度用户、提示词工程师、每天使用 Claude/ChatGPT 编程的人。与 API 密钥用户高度重叠。

**Subreddit:** `r/ClaudeAI` (primary), `r/ChatGPT` (secondary)

### Title / 标题

> **I got mass-downvoted for pasting my API key into Claude. So I built a tool that lets AI agents fetch secrets themselves.**

> 我因为把 API 密钥粘贴到 Claude 对话中被疯狂踩。所以我做了一个工具，让 AI 代理自己获取密钥。

### Body / 正文

---

You know the drill. You're deep in a Claude Code session:

你肯定遇到过这种情况。你正在用 Claude Code 紧张地工作：

> **You:** "Deploy this to Vercel"
> **Claude:** "I need your VERCEL_TOKEN"
> **You:** *opens new tab, navigates to Vercel dashboard, generates token, copies, pastes back into chat*

And you just... pasted a live production token into a conversation window. We've all done it. I've done it dozens of times.

然后你就... 把一个生产环境的 token 粘贴到了对话窗口里。我们都干过。我自己都干过几十次。

Last month someone on this sub called me out for it: *"Dude, that's a security incident."* They were right.

上个月这个版上有人指出了这个问题："兄弟，这就是个安全事故。"他说得对。

So I spent the last few months building **Achilles Vault** — an open-source secret manager that speaks **MCP** natively. You store your API keys once, and Claude fetches them through the protocol instead of asking you to paste them.

所以我花了几个月做了 **Achilles Vault**——一个开源的密钥管理器，原生支持 **MCP 协议**。你只需存一次 API 密钥，Claude 就能通过协议自动获取，不再让你粘贴。

Here's what the workflow looks like now:

现在的工作流是这样的：

```
You:    "Deploy this to Vercel"
Claude: *calls achilles.get_secret("VERCEL_TOKEN") via MCP*
Done. No copy-paste. No token in the chat.
```

**What it does / 核心功能:**

- Everything encrypted with AES-256-GCM, stored locally in SQLite. Nothing leaves your machine. / 全部使用 AES-256-GCM 加密，本地 SQLite 存储。数据不出你的电脑。
- Built-in MCP server — add one line to your Claude config and it just works. / 内置 MCP 服务器——在 Claude 配置中加一行就能用。
- Chrome extension that auto-detects API keys on GitHub, HuggingFace, OpenAI dashboard, etc. and vaults them in one click. / Chrome 扩展自动检测 GitHub、HuggingFace、OpenAI 后台等页面上的 API 密钥，一键保存。
- 131 platform presets (AWS, Stripe, OpenAI, Anthropic...) so you don't have to name keys from scratch. / 131 个平台预设（AWS、Stripe、OpenAI、Anthropic...），无需从头命名密钥。
- `achilles run my-project -- python train.py` injects secrets as env vars. Zero code changes. / `achilles run` 把密钥注入为环境变量，无需改代码。

**100% local. 100% open source (MIT). Zero cloud dependency.**

100% 本地。100% 开源（MIT）。零云端依赖。

GitHub: [link]

I'd genuinely love feedback from this community — you're the exact users I built this for.

真心希望得到大家的反馈——你们就是我为之开发这个工具的用户。

---

**Post Strategy Notes / 发帖策略说明:**
- The "mass-downvoted" hook creates curiosity and social proof simultaneously. / "被疯狂踩"的开头同时制造好奇心和社会认同。
- Mentioning MCP specifically resonates with r/ClaudeAI users who are already in the ecosystem. / 提到 MCP 能引起 r/ClaudeAI 用户的共鸣，他们已经在这个生态中。
- End with "I built this for you" — positions the poster as community member, not marketer. / 以"我为你们做的"结尾——将发帖者定位为社区成员，而非营销人员。

---

## Campaign 2: r/selfhosted

**Audience Profile / 受众画像:** Privacy-conscious developers who run everything locally. Allergic to SaaS. Love Docker one-liners. Judge projects by whether they phone home. / 隐私敏感的开发者，所有东西都本地跑。对 SaaS 过敏。喜欢 Docker 一行命令。评判项目标准是看它有没有外连。

**Subreddit:** `r/selfhosted`

### Title / 标题

> **Achilles Vault: A secret manager that uses SQLite, runs on localhost, and never phones home. Built for devs whose AI agents need API keys.**

> Achilles Vault：一个用 SQLite、跑在 localhost、绝不外连的密钥管理器。为需要 API 密钥的 AI 代理而生。

### Body / 正文

---

I've been looking for a self-hosted secret manager that doesn't require me to spin up Postgres + Redis + a load balancer just to store 30 API keys. Infisical is great but it's a lot of infra for a solo developer.

一直在找一个自托管的密钥管理器，不需要搭 Postgres + Redis + 负载均衡，只是存 30 个 API 密钥。Infisical 很好，但对独立开发者来说太重了。

So I built one. **Achilles Vault.**

所以我自己做了一个。**Achilles Vault。**

**The philosophy is simple / 理念很简单:**

- `pip install` + `achilles serve`. That's it. SQLite. No external deps. / `pip install` + `achilles serve`，搞定。SQLite，无外部依赖。
- AES-256-GCM encryption at rest. Scrypt key derivation. Per-secret salt + nonce. / 静态数据 AES-256-GCM 加密。Scrypt 密钥派生。每个密钥独立的 salt + nonce。
- Master key derived from your password at runtime — **never written to disk.** / 主密钥在运行时从密码派生——**永远不写入磁盘。**
- Full audit trail. Immutable, append-only. / 完整审计日志。不可变，只追加。
- MIT licensed. / MIT 开源协议。

**What makes it different from HashiCorp Vault / 与 HashiCorp Vault 的区别:**

| | Achilles | HashiCorp Vault |
|---|---|---|
| Setup | `pip install && achilles serve` | Consul + TLS + unsealing ceremony |
| Database | SQLite (zero config) | Consul/etcd/Postgres |
| Target user | Solo dev / small team | Enterprise |
| AI integration | MCP + OpenAI function calling | None |
| Complexity | 1 process, 1 file | Multi-service orchestration |

**The AI angle / AI 方面:** If you're using Claude Code, Claude Desktop, or any MCP-compatible tool, Achilles has a built-in MCP server. Your AI agent can call `get_secret("OPENAI_API_KEY")` without you pasting anything. I know this sub isn't AI-focused, but if you use AI coding tools, this is a genuine quality-of-life upgrade.

如果你用 Claude Code、Claude Desktop 或任何 MCP 兼容工具，Achilles 有内置 MCP 服务器。AI 代理可以直接调用 `get_secret("OPENAI_API_KEY")`，不需要你粘贴任何东西。我知道这个版不是 AI 为主的，但如果你用 AI 编程工具，这是实实在在的体验升级。

**Docker:**

```bash
docker build -t achilles-vault .
docker run -p 8900:8900 -v achilles-data:/root/.achilles achilles-vault
```

Also has a Tauri desktop app if you want a GUI, and a Chrome extension that auto-detects API keys on sites like GitHub and HuggingFace.

还有 Tauri 桌面应用（如果你想要 GUI）和 Chrome 扩展（自动检测 GitHub、HuggingFace 等网站上的 API 密钥）。

GitHub: [link]

Happy to answer any questions about the architecture or security model.

架构或安全模型方面的问题，随时问。

---

**Post Strategy Notes / 发帖策略说明:**
- r/selfhosted judges on: simplicity, no-cloud, Docker support, comparison tables. All addressed. / r/selfhosted 评判标准：简单、无云、Docker 支持、对比表。全部覆盖。
- Downplay AI — this audience cares about sovereignty first. AI is a bonus feature, not the headline. / 淡化 AI——这个受众首先关心数据主权。AI 是加分项，不是标题。
- Comparison table with HashiCorp Vault is catnip for this sub. / 与 HashiCorp Vault 的对比表对这个版来说极有吸引力。
- "Never phones home" in the title is the #1 hook for this audience. / 标题里"绝不外连"是这个受众的第一吸引力。

---

## Campaign 3: r/programming + r/webdev

**Audience Profile / 受众画像:** Professional developers. Skeptical. They've seen 1000 "I built a thing" posts. Need technical substance and a clear "why should I care" moment. / 专业开发者。持怀疑态度。他们看过 1000 个"我做了个东西"的帖子。需要技术实质和明确的"我为什么要在乎"的瞬间。

**Subreddit:** `r/programming` (primary), `r/webdev` (secondary)

### Title / 标题

> **I built an open-source secret manager with a Chrome extension that auto-detects API keys on GitHub, HuggingFace, and 12 other platforms**

> 我做了一个开源密钥管理器，带 Chrome 扩展，能自动检测 GitHub、HuggingFace 等 12+ 个平台上的 API 密钥

### Body / 正文

---

I have 20+ API keys across AWS, OpenAI, Stripe, GitHub, HuggingFace, Vercel, and others. They live in `.env` files, browser bookmarks, and (honestly) a Google Doc I'm not proud of.

我有 20 多个 API 密钥分布在 AWS、OpenAI、Stripe、GitHub、HuggingFace、Vercel 等平台。它们散落在 `.env` 文件、浏览器书签里，还有（说实话）一个我不太好意思提的 Google Doc 里。

The final straw was when I generated an API key on HuggingFace, switched tabs, forgot to save it, and it was gone forever.

最后的导火索是：我在 HuggingFace 生成了一个 API 密钥，切换了标签页，忘了保存，然后它就永远消失了。

So I built **Achilles Vault** — an open-source secret manager focused on the developer workflow problems I was actually having:

所以我做了 **Achilles Vault**——一个开源密钥管理器，专门解决我实际遇到的开发者工作流问题：

**1. Chrome Extension with 30+ Detection Rules / Chrome 扩展，30+ 检测规则**

You browse GitHub Settings → Personal Access Tokens. The extension detects the token pattern on the page and shows a badge. Click it → the token gets encrypted and stored in your local vault. Works on 14+ platforms.

你浏览 GitHub Settings → Personal Access Tokens。扩展检测到页面上的 token 模式并显示徽标。点击→ token 被加密存入本地保险库。支持 14+ 个平台。

No more "let me save this somewhere" → opens Notion → forgets → regenerates it next week.

再也不用"让我找个地方保存"→ 打开 Notion → 忘了 → 下周重新生成。

**2. 131 Platform Presets / 131 个平台预设**

Create a project, pick "AI/LLM" template, and you get pre-configured key names for OpenAI, Anthropic, HuggingFace, Groq, Replicate, etc. — properly categorized with descriptions. No more inventing `OPENAI_KEY` vs `OPENAI_API_KEY` vs `openai_token`.

创建项目，选"AI/LLM"模板，就能得到 OpenAI、Anthropic、HuggingFace、Groq、Replicate 等的预配置密钥名——分类清晰带描述。不用再纠结 `OPENAI_KEY` 还是 `OPENAI_API_KEY` 还是 `openai_token`。

**3. `achilles run` — Inject Without Code Changes / 无需改代码注入密钥**

```bash
achilles run my-project --env production -- python train.py
achilles run my-project --env staging -- docker-compose up
```

Secrets injected as environment variables. No `.env` files in your repo. No `dotenv` dependency.

密钥以环境变量形式注入。仓库里没有 `.env` 文件。无需 `dotenv` 依赖。

**4. AI Agent Integration (MCP) / AI 代理集成**

If you use Claude Code or similar tools — Achilles has a built-in MCP server. Your AI can call `get_secret()` directly instead of asking you to paste tokens. But this is totally optional — the tool works perfectly without any AI involvement.

如果你用 Claude Code 或类似工具——Achilles 有内置 MCP 服务器。AI 可以直接调用 `get_secret()` 而不是让你粘贴 token。但这完全是可选的——这个工具完全可以独立于 AI 使用。

**Tech stack / 技术栈:**
- Backend: FastAPI + SQLite (zero external deps) / 后端：FastAPI + SQLite（零外部依赖）
- Encryption: AES-256-GCM, scrypt KDF, per-secret salt/nonce / 加密：AES-256-GCM，scrypt 密钥派生，每个密钥独立 salt/nonce
- Desktop: Tauri v2 + React 19 / 桌面端：Tauri v2 + React 19
- Chrome Extension: Manifest V3 / Chrome 扩展：Manifest V3
- License: MIT / 协议：MIT

GitHub: [link]

I wrote it to solve my own problem. If you have similar pain points, give it a look. Feedback welcome — especially on the security model.

我写它是为了解决自己的问题。如果你有类似的痛点，可以看看。欢迎反馈——尤其是安全模型方面的。

---

**Post Strategy Notes / 发帖策略说明:**
- Lead with the Chrome extension — it's the most visually novel feature and differentiator. / 以 Chrome 扩展开头——这是最具视觉新鲜感的功能和差异化特点。
- r/programming wants technical detail. Include the tech stack and mention the encryption specifics. / r/programming 要技术细节。包含技术栈并提及加密细节。
- "The final straw" story creates relatability — everyone has lost a token they forgot to save. / "最后的导火索"故事制造共鸣——每个人都有忘记保存而丢失 token 的经历。
- De-emphasize AI for this audience — position it as optional. Lead with the developer UX. / 对这个受众淡化 AI——定位为可选功能。以开发者体验为主打。

---

## Campaign 4: r/opensource + r/coolgithubprojects

**Audience Profile / 受众画像:** Open-source enthusiasts who like discovering well-crafted projects. Appreciate good README, clean architecture, and MIT license. Star first, try later. / 开源爱好者，喜欢发现精心制作的项目。欣赏好的 README、干净的架构和 MIT 协议。先 star 再试。

**Subreddit:** `r/opensource` (primary), `r/coolgithubprojects` (secondary)

### Title / 标题

> **Achilles Vault — Open-source secret manager with MCP integration, Chrome auto-detection, and 131 platform presets. Local-first, SQLite-only, MIT licensed.**

> Achilles Vault——开源密钥管理器，支持 MCP 集成、Chrome 自动检测和 131 个平台预设。本地优先，仅用 SQLite，MIT 协议。

### Body / 正文

---

Hey r/opensource — I've been working on this for a while and wanted to share it here for feedback.

嘿 r/opensource——这个项目我做了一段时间了，想在这里分享一下，收集反馈。

**Achilles Vault** is a local-first secret manager built for developers who work with lots of API keys across multiple platforms.

**Achilles Vault** 是一个本地优先的密钥管理器，为跨多个平台使用大量 API 密钥的开发者打造。

**Why I built it / 我为什么做这个:**

I was using a mix of `.env` files, 1Password, and browser bookmarks to manage ~25 API keys. When I started using Claude Code heavily, I realized I was copy-pasting tokens into AI conversations multiple times a day. That's a terrible security practice, and no existing tool solved the full workflow.

我之前混合使用 `.env` 文件、1Password 和浏览器书签来管理约 25 个 API 密钥。当我开始大量使用 Claude Code 后，我意识到我每天多次把 token 粘贴到 AI 对话中。这是很糟糕的安全做法，没有现有工具能解决完整的工作流。

**Key differentiators / 关键差异化特点:**

- **MCP-native:** Built-in Model Context Protocol server. Claude Code/Desktop can retrieve secrets programmatically — no human in the loop. / 原生 MCP：内置 MCP 服务器。Claude Code/Desktop 可以程序化获取密钥——无需人工介入。
- **Chrome extension:** 30+ regex rules that scan pages for API keys in real time. Detects tokens on GitHub, HuggingFace, OpenAI, AWS console, and 10+ more platforms. One-click to vault. / Chrome 扩展：30+ 正则规则实时扫描页面上的 API 密钥。检测 GitHub、HuggingFace、OpenAI、AWS 控制台等 10+ 个平台上的 token。一键入库。
- **131 platform presets:** Create a project and get pre-configured key names for AWS (12 keys), OpenAI (4 keys), Stripe (6 keys), etc. Saves the "what should I name this key" decision fatigue. / 131 个平台预设：创建项目即获得 AWS（12 个密钥）、OpenAI（4 个密钥）、Stripe（6 个密钥）等的预配置密钥名。省去"这个密钥该叫什么名"的决策疲劳。
- **Zero infra:** SQLite only. `pip install && achilles serve`. No Postgres, no Redis, no Docker required (though Docker is supported). / 零基础设施：仅 SQLite。`pip install && achilles serve`。不需要 Postgres、Redis、Docker（但支持 Docker）。

**Architecture / 架构:**

```
Python FastAPI backend (:8900)
├── AES-256-GCM encryption (scrypt KDF)
├── SQLite with async connection pooling
├── JWT + API key auth with rate limiting
└── MCP server (:8901)

React 19 + Tauri v2 desktop app
Chrome Extension (Manifest V3)
```

**Comparison / 对比:**

| | Achilles | Doppler | Infisical | 1Password |
|---|---|---|---|---|
| Open Source | MIT | No | MIT | No |
| Local-First | Yes | SaaS | Self-host | SaaS |
| AI/MCP Native | Yes | No | Partial | No |
| Chrome Detection | Yes | No | No | No |
| Setup Complexity | `pip install` | SaaS signup | Postgres + Redis | SaaS signup |

Repo is MIT licensed. Desktop app, Chrome extension, CLI, and full REST API are all included.

仓库 MIT 协议。桌面应用、Chrome 扩展、CLI 和完整 REST API 全部包含。

GitHub: [link]

Contributions welcome. Happy to discuss architecture decisions.

欢迎贡献。乐于讨论架构决策。

---

**Post Strategy Notes / 发帖策略说明:**
- r/opensource appreciates: architecture diagrams, comparison tables, clear licensing. Deliver all three. / r/opensource 欣赏：架构图、对比表、清晰的协议说明。三者全部提供。
- r/coolgithubprojects is discovery-oriented — the title should be self-contained enough to understand the project without clicking. / r/coolgithubprojects 是发现导向的——标题应足够独立，不点进去就能理解项目。
- "Why I built it" section creates narrative arc that open-source communities respond to. / "我为什么做这个"部分创造叙事弧，开源社区对此有响应。
- Mentioning specific numbers (131 presets, 30+ rules, 25 API keys) builds credibility. / 提及具体数字（131 个预设、30+ 规则、25 个 API 密钥）建立可信度。

---

## Campaign 5: r/MachineLearning + r/LocalLLaMA

**Audience Profile / 受众画像:** ML engineers and researchers who juggle HuggingFace tokens, OpenAI keys, GPU cloud credentials, and Weights & Biases API keys daily. Many run training scripts that need 5+ secrets injected. / ML 工程师和研究人员，每天操作 HuggingFace token、OpenAI 密钥、GPU 云凭证和 W&B API 密钥。许多人运行需要注入 5+ 个密钥的训练脚本。

**Subreddit:** `r/MachineLearning` (primary), `r/LocalLLaMA` (secondary)

### Title / 标题

> **[P] Achilles Vault — Stop hardcoding API keys in your training scripts. Open-source secret manager with `achilles run` and MCP for AI agents.**

> [P] Achilles Vault——别再在训练脚本里硬编码 API 密钥了。开源密钥管理器，支持 `achilles run` 和 AI 代理的 MCP 协议。

### Body / 正文

---

If your training workflow looks anything like mine, you've got secrets scattered everywhere:

如果你的训练工作流和我的类似，你的密钥肯定到处都是：

```python
# config.py (please don't look at my git history)
HF_TOKEN = "hf_xxxxxxxxxxxxx"
OPENAI_API_KEY = "sk-xxxxxxxxxxxxx"
WANDB_API_KEY = "xxxxxxxxxxxxx"
AWS_SECRET_ACCESS_KEY = "xxxxxxxxxxxxx"
```

Or maybe you're slightly better and use `.env` + `python-dotenv`. But then you have `.env` files in 15 different project directories, half of them with stale tokens, and you can never remember which one has the current HuggingFace key.

或者你稍微好一点，用 `.env` + `python-dotenv`。但然后你在 15 个不同的项目目录里有 `.env` 文件，其中一半是过期的 token，你永远记不清哪个有当前的 HuggingFace 密钥。

I built **Achilles Vault** to fix this. Here's what my training workflow looks like now:

我做了 **Achilles Vault** 来解决这个问题。现在我的训练工作流是这样的：

```bash
# Store once
achilles set ml-project HF_TOKEN hf_xxx --env production
achilles set ml-project OPENAI_API_KEY sk-xxx --env production
achilles set ml-project WANDB_API_KEY xxx --env production

# Run with secrets injected — zero code changes
achilles run ml-project --env production -- python train.py
achilles run ml-project --env production -- accelerate launch train.py
achilles run ml-project --env staging -- pytest tests/
```

Your `train.py` just reads `os.environ["HF_TOKEN"]` — no dotenv, no config files, no secrets in source control.

你的 `train.py` 只需读 `os.environ["HF_TOKEN"]`——无需 dotenv，无需配置文件，源码管理中没有密钥。

**Other things that might interest ML folks / ML 从业者可能感兴趣的其他功能:**

- **131 platform presets** including HuggingFace, OpenAI, Anthropic, W&B, Comet, Lambda Labs, RunPod, Modal, Together AI, Groq, Replicate — all pre-configured with proper key names. / 131 个平台预设，包括 HuggingFace、OpenAI、Anthropic、W&B、Comet、Lambda Labs、RunPod、Modal、Together AI、Groq、Replicate——全部预配置正确的密钥名。
- **Environment separation** (dev/staging/prod) — use test keys locally, production keys in your cluster, same project. / 环境分离（开发/预发/生产）——本地用测试密钥，集群用生产密钥，同一个项目。
- **Chrome extension** — auto-detects tokens on HuggingFace and OpenAI dashboards. Generate a token → one-click vault it. / Chrome 扩展——在 HuggingFace 和 OpenAI 后台自动检测 token。生成 token → 一键入库。
- **MCP server** — if you use Claude Code to write/debug training scripts, Claude can fetch secrets natively via MCP instead of asking you to paste them. / MCP 服务器——如果你用 Claude Code 写/调试训练脚本，Claude 可以通过 MCP 原生获取密钥，不用让你粘贴。
- **Export to .env** — `achilles export ml-project --env production > .env` for tools that specifically need a file. / 导出为 .env——`achilles export ml-project --env production > .env`，给那些特别需要文件的工具。

Everything is encrypted (AES-256-GCM), local-only (SQLite), and open source (MIT).

全部加密（AES-256-GCM），仅限本地（SQLite），开源（MIT）。

GitHub: [link]

Curious if others have this problem or if I'm just uniquely disorganized.

好奇其他人是否也有这个问题，还是只有我特别混乱。

---

**Post Strategy Notes / 发帖策略说明:**
- The `[P]` tag is required for project posts on r/MachineLearning. / `[P]` 标签是 r/MachineLearning 项目帖的必须标记。
- Lead with the `config.py` code block — every ML engineer will cringe-laugh because they've done it. / 以 `config.py` 代码块开头——每个 ML 工程师都会尴尬地笑，因为他们也这么干过。
- `achilles run ... -- accelerate launch` shows the tool works with real ML tooling, not just toy examples. / `achilles run ... -- accelerate launch` 展示工具与真实 ML 工具兼容，不只是玩具示例。
- Self-deprecating closer ("uniquely disorganized") is authentic and invites engagement. / 自嘲式结尾（"特别混乱"）显得真实，并邀请互动。
- r/LocalLLaMA: Emphasize that it works with local inference and that there is zero cloud dependency. / r/LocalLLaMA：强调它与本地推理兼容且零云端依赖。

---

## Campaign 6: r/cybersecurity + r/netsec

**Audience Profile / 受众画像:** Security professionals and enthusiasts. Extremely skeptical. Will probe your crypto implementation. Respect transparency about threat models. / 安全专业人士和爱好者。极度怀疑。会追问你的加密实现。尊重对威胁模型的透明度。

**Subreddit:** `r/cybersecurity` (primary), `r/netsec` (secondary)

### Title / 标题

> **Open-source secret manager for developers: AES-256-GCM, scrypt KDF, per-secret salt/nonce, local-only SQLite. Looking for security review.**

> 面向开发者的开源密钥管理器：AES-256-GCM、scrypt KDF、每密钥独立 salt/nonce、仅本地 SQLite。寻求安全审查。

### Body / 正文

---

I built **Achilles Vault**, an open-source local-first secret manager. Before I push it harder in the dev community, I want honest feedback from people who break things for a living.

我做了 **Achilles Vault**，一个开源的本地优先密钥管理器。在我向开发者社区大力推广之前，我想从以破坏为生的人那里获得诚实的反馈。

**Threat model / 威胁模型:**

This is a *personal/small-team developer tool*, not an enterprise vault. The threat model assumes:

这是一个*个人/小团队开发者工具*，不是企业级保险库。威胁模型假设：

- The machine is trusted (not defending against a compromised OS) / 机器是可信的（不防御受损的操作系统）
- The primary threat is accidental exposure (secrets in git, in AI prompts, on clipboard) / 主要威胁是意外泄露（密钥在 git 中、在 AI 提示词中、在剪贴板上）
- Secondary threat is at-rest data theft (stolen laptop) / 次要威胁是静态数据被盗（笔记本电脑被偷）

**Crypto implementation / 加密实现:**

| Layer | Detail |
|---|---|
| Algorithm | AES-256-GCM (authenticated encryption) |
| KDF | scrypt (N=2^14, r=8, p=1) — memory-hard |
| Salt | 32 bytes, random, per-secret |
| Nonce | 12 bytes, random, per-secret |
| Master key | Derived from user password via scrypt at startup. **Never persisted to disk.** |
| AAD | Encryption timestamp as additional authenticated data |
| Storage | SQLite on localhost. No network calls. |
| Auth | JWT (configurable expiry) for interactive use. Scoped API keys for agents. |
| Rate limiting | 5 reg/min, 10 login/min on auth endpoints |
| Audit | Immutable append-only log: action, actor, resource, IP, timestamp, severity |

**What I'm specifically looking for feedback on / 我具体寻求反馈的方面:**

1. Is scrypt with these parameters sufficient, or should I offer Argon2id as an option? / 这些参数的 scrypt 是否足够，还是应该提供 Argon2id 作为选项？
2. The nonce is random (not counter-based). With per-secret random salts, the collision risk should be negligible — am I wrong? / nonce 是随机的（非计数器型）。配合每密钥随机 salt，碰撞风险应该可以忽略——我错了吗？
3. Any concerns about the threat model I've outlined? / 对我概述的威胁模型有任何疑虑吗？

The code is fully open source (MIT). Encryption logic is in a single file — easy to audit.

代码完全开源（MIT）。加密逻辑在单个文件中——方便审计。

GitHub: [link]

I'd rather get torn apart here than find out I made a mistake after people trust it with their production keys.

我宁愿在这里被批评，也不愿在人们把生产密钥交给它之后才发现我犯了错。

---

**Post Strategy Notes / 发帖策略说明:**
- "Looking for security review" is the only acceptable framing for this audience. Anything that looks like promotion will be destroyed. / "寻求安全审查"是这个受众唯一可接受的框架。任何看起来像推广的东西都会被毁。
- Lead with the threat model — shows maturity. Amateurs don't define threat models. / 以威胁模型开头——展示成熟度。业余者不定义威胁模型。
- Ask specific questions — gives experts a reason to engage instead of just judging. / 问具体问题——给专家一个参与的理由，而不只是评判。
- "Torn apart here" closer shows vulnerability and respect for the community's expertise. / "在这里被批评"的结尾展示脆弱性和对社区专业知识的尊重。
- Any actual security feedback you receive becomes fuel for a "We listened to r/netsec and improved X" follow-up post. / 收到的任何实际安全反馈都可以成为"我们听取了 r/netsec 的建议并改进了 X"后续帖的素材。

---

## Campaign 7: r/devops + r/sysadmin

**Audience Profile / 受众画像:** Infrastructure engineers who manage secrets at scale. Use HashiCorp Vault, AWS Secrets Manager, or env vars in CI/CD. Pragmatic. Care about ops overhead. / 大规模管理密钥的基础设施工程师。使用 HashiCorp Vault、AWS Secrets Manager 或 CI/CD 中的环境变量。务实。关心运维开销。

**Subreddit:** `r/devops` (primary), `r/sysadmin` (secondary)

### Title / 标题

> **Built a secret manager that's basically "HashiCorp Vault for solo devs" — SQLite backend, `pip install`, no unsealing ceremony**

> 做了一个密钥管理器，基本上就是"独立开发者的 HashiCorp Vault"——SQLite 后端，`pip install`，无需解封仪式

### Body / 正文

---

I love HashiCorp Vault. I also hate setting it up for personal projects.

我喜欢 HashiCorp Vault。我也讨厌为个人项目搭建它。

Consul backend. TLS certificates. Unsealing ritual. Five YAML files. For what? Storing 30 API keys on my laptop.

Consul 后端。TLS 证书。解封仪式。五个 YAML 文件。为了什么？在我笔记本上存 30 个 API 密钥。

So I built **Achilles Vault** — a secret manager that takes the ideas I like from HashiCorp (encryption at rest, audit logging, project scoping) and strips out everything a solo dev doesn't need.

所以我做了 **Achilles Vault**——一个密钥管理器，取我喜欢的 HashiCorp 理念（静态加密、审计日志、项目范围划分），去掉独立开发者不需要的一切。

**Setup / 搭建:**

```bash
pip install achilles-vault
achilles serve    # API on :8900, done.
```

That's the whole setup. SQLite backend. One process. One data file.

这就是全部搭建。SQLite 后端。一个进程。一个数据文件。

**What you get / 你得到的:**

- **AES-256-GCM** encryption at rest (scrypt KDF, per-secret salt/nonce) / 静态 AES-256-GCM 加密（scrypt KDF，每密钥独立 salt/nonce）
- **Project → Environment → Secret** hierarchy (dev/staging/prod) / 项目 → 环境 → 密钥层级（开发/预发/生产）
- **`achilles run`** — inject secrets into any subprocess as env vars. Like `aws-vault exec` but for all your keys. / `achilles run`——将密钥作为环境变量注入任何子进程。类似 `aws-vault exec`，但适用于你所有的密钥。
- **Full audit trail** — immutable, append-only, with severity levels / 完整审计日志——不可变，只追加，带严重级别
- **JWT + API key auth** — API keys with scopes (read/write/admin) and expiration / JWT + API 密钥认证——API 密钥带作用域（读/写/管理员）和过期时间
- **Secret versioning** with rollback / 密钥版本控制和回滚
- **Soft delete + recovery** (30-day trash) / 软删除 + 恢复（30 天回收站）
- **REST API** — integrate with CI/CD, scripts, whatever / REST API——与 CI/CD、脚本等集成
- **131 platform presets** — pre-named keys for AWS, GCP, Azure, and 128 other services / 131 个平台预设——AWS、GCP、Azure 和其他 128 个服务的预命名密钥

**Bonus for AI-assisted development / AI 辅助开发的额外好处:**

If you're using Claude Code or other MCP-compatible tools, there's a built-in MCP server that lets AI agents fetch secrets programmatically. Not for everyone, but for those who use it — game changer.

如果你使用 Claude Code 或其他 MCP 兼容工具，有内置 MCP 服务器让 AI 代理程序化获取密钥。不是每个人都需要，但对使用者来说是质的飞跃。

**What it's NOT / 它不是什么:**

- Not a team/enterprise solution (yet). No RBAC, no multi-user sync. / 不是团队/企业解决方案（还不是）。没有 RBAC，没有多用户同步。
- Not a replacement for AWS Secrets Manager in production infra. / 不是生产基础设施中 AWS Secrets Manager 的替代品。
- Not trying to compete with Vault at scale. / 不试图在规模上与 Vault 竞争。

It's for the gap between "env vars in a `.env` file" and "full HashiCorp deployment." That gap is bigger than most people admit.

它填补的是".env 文件中的环境变量"和"完整 HashiCorp 部署"之间的空白。这个空白比大多数人承认的要大。

GitHub: [link]

MIT licensed. PRs welcome.

MIT 协议。欢迎 PR。

---

**Post Strategy Notes / 发帖策略说明:**
- "HashiCorp Vault for solo devs" is a positioning statement this audience immediately understands. / "独立开发者的 HashiCorp Vault"是这个受众立即理解的定位表述。
- "Unsealing ceremony" is a known pain point — instant relatability. / "解封仪式"是已知痛点——即时共鸣。
- The "What it's NOT" section is critical — DevOps people will immediately ask "why not just use Vault?" This preempts that objection. / "它不是什么"部分至关重要——DevOps 人员会立即问"为什么不直接用 Vault？"这预先化解了这个反对意见。
- `aws-vault exec` comparison creates instant mental model for this audience. / `aws-vault exec` 类比为这个受众创造即时心理模型。
- Position AI as bonus, not core — this audience is pragmatic and might be AI-skeptical. / 将 AI 定位为加分项而非核心——这个受众务实，可能对 AI 持怀疑态度。

---

## Cross-Campaign Engagement Playbook / 跨营销活动互动策略

### Comment Response Templates / 评论回复模板

**"Why not just use .env files?" / "为什么不直接用 .env 文件？"**

> .env files work great until you have 15 projects and can't remember which file has the current HuggingFace token. Or until you accidentally commit one. Achilles is basically `.env` files with encryption, versioning, and a Chrome extension that catches keys before they end up in a Google Doc.

> .env 文件很好用，直到你有 15 个项目而且记不清哪个文件有当前的 HuggingFace token。或者直到你不小心提交了一个。Achilles 基本上就是带加密、版本控制的 `.env` 文件，加一个在密钥流入 Google Doc 之前捕获它们的 Chrome 扩展。

**"Why not just use 1Password CLI?" / "为什么不直接用 1Password CLI？"**

> 1Password is great for passwords. It's not great for AI agents that need to fetch secrets via MCP, or for auto-detecting tokens on web pages. Different tool for a different workflow.

> 1Password 管密码很好。但不适合需要通过 MCP 获取密钥的 AI 代理，也不适合在网页上自动检测 token。不同的工具，不同的工作流。

**"Rolling your own crypto is dangerous" / "自己造轮子做加密很危险"**

> Totally agree, which is why I'm not. The encryption uses Python's `cryptography` library (AES-256-GCM via OpenSSL). I'm using well-established primitives, not inventing new ones. The implementation is in a single file — happy to have it reviewed.

> 完全同意，这就是为什么我没有自己造。加密使用 Python 的 `cryptography` 库（通过 OpenSSL 的 AES-256-GCM）。我用的是成熟的密码学原语，不是发明新的。实现在单个文件中——欢迎审查。

**"Looks cool, starred!" / "看起来不错，已 star！"**

> Thanks! If you try it and hit any rough edges, open an issue — I'm actively improving the setup experience.

> 谢谢！如果你试用时遇到任何问题，开个 issue——我正在积极改善使用体验。

---

## Posting Schedule / 发布时间表

| Day | Subreddit | Campaign | Notes |
|-----|-----------|----------|-------|
| Week 1, Tue | r/ClaudeAI | Campaign 1 | Start with the most aligned audience / 从最匹配的受众开始 |
| Week 1, Thu | r/opensource | Campaign 4 | GitHub stars beget more stars / GitHub star 会带来更多 star |
| Week 2, Tue | r/programming | Campaign 3 | Broadest reach / 最广泛的覆盖 |
| Week 2, Thu | r/MachineLearning | Campaign 5 | [P] tag, technical crowd / [P] 标签，技术受众 |
| Week 3, Tue | r/selfhosted | Campaign 2 | Local-first angle / 本地优先视角 |
| Week 3, Thu | r/devops | Campaign 7 | Pragmatic audience / 务实受众 |
| Week 4, Tue | r/cybersecurity | Campaign 6 | Security review ask / 安全审查请求 |

**Rules / 规则:**
- Never post to more than 2 subreddits in one day. / 一天不在超过 2 个子版块发帖。
- Spend 2+ hours in comments after each post. This is where growth happens. / 每篇帖子后花 2+ 小时回复评论。增长发生在这里。
- Every piece of feedback becomes a GitHub issue or improvement. Post updates referencing community feedback. / 每条反馈都变成 GitHub issue 或改进。发布更新时引用社区反馈。

---

*Generated for Achilles Vault Reddit launch campaign.*
