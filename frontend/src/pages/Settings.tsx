import { useState } from "react";
import { motion } from "framer-motion";
import {
  Server,
  Cpu,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Play,
  Square,
  RotateCw,
  Loader2,
  Lock,
  Wrench,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useStore } from "../store";
import { useServerManager } from "../hooks/useTauri";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function Settings() {
  const { serverStatus, checkServerHealth, mcpStatus, checkMcpHealth, theme, setTheme } =
    useStore();
  const {
    isTauri,
    startServer,
    stopServer,
    restartServer,
    startMcpServer,
    stopMcpServer,
  } = useServerManager();
  const [copied, setCopied] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [serverAction, setServerAction] = useState<string | null>(null);
  const [mcpAction, setMcpAction] = useState<string | null>(null);

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const refreshHealth = async () => {
    setChecking(true);
    await checkServerHealth();
    await checkMcpHealth();
    setTimeout(() => setChecking(false), 500);
  };

  const handleServerAction = async (
    action: "start" | "stop" | "restart"
  ) => {
    setServerAction(action);
    if (action === "start") await startServer();
    else if (action === "stop") await stopServer();
    else if (action === "restart") await restartServer();
    await new Promise((r) => setTimeout(r, 1500));
    await checkServerHealth();
    setServerAction(null);
  };

  const handleMcpAction = async (action: "start" | "stop") => {
    setMcpAction(action);
    if (action === "start") await startMcpServer();
    else await stopMcpServer();
    await new Promise((r) => setTimeout(r, 1500));
    await checkMcpHealth();
    setMcpAction(null);
  };

  const mcpSseUrl = `http://127.0.0.1:${mcpStatus.port}/sse`;

  const claudeConfig = JSON.stringify(
    {
      mcpServers: {
        "achilles-vault": {
          url: mcpSseUrl,
        },
      },
    },
    null,
    2
  );

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.06 } },
      }}
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-vault-700/50 border border-vault-600/30 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-vault-300" />
          </div>
          <h1 className="font-display text-[28px] font-bold text-vault-50 tracking-tight">
            Settings
          </h1>
        </div>
        <p className="text-[14px] text-vault-400 ml-11">
          Server configuration and integrations
        </p>
      </motion.div>

      <div className="space-y-5">
        {/* Server Status */}
        <motion.div variants={fadeUp} className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/15 flex items-center justify-center">
                <Server className="w-[18px] h-[18px] text-accent-400" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-vault-100 font-display">
                  Backend Server
                </h2>
                <p className="text-[12px] text-vault-500">
                  REST API on port {serverStatus.port}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isTauri && (
                <>
                  {!serverStatus.running ? (
                    <button
                      onClick={() => handleServerAction("start")}
                      disabled={!!serverAction}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium bg-accent-500/[0.08] text-accent-400 hover:bg-accent-500/[0.12] border border-accent-500/15 transition-all disabled:opacity-50"
                    >
                      {serverAction === "start" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      Start
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleServerAction("restart")}
                        disabled={!!serverAction}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium text-vault-300 hover:text-vault-100 hover:bg-white/[0.04] transition-all disabled:opacity-50"
                      >
                        {serverAction === "restart" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCw className="w-3.5 h-3.5" />
                        )}
                        Restart
                      </button>
                      <button
                        onClick={() => handleServerAction("stop")}
                        disabled={!!serverAction}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium text-danger-400 hover:bg-danger-500/10 transition-all disabled:opacity-50"
                      >
                        {serverAction === "stop" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                        Stop
                      </button>
                    </>
                  )}
                </>
              )}
              <button
                onClick={refreshHealth}
                className="p-2 rounded-xl text-vault-400 hover:text-vault-200 hover:bg-white/[0.04] transition-colors"
                title="Refresh status"
              >
                <RefreshCw
                  className={`w-4 h-4 ${checking ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="glass-subtle rounded-xl p-4">
              <p className="text-[10px] text-vault-500 uppercase tracking-[0.12em] mb-2 font-semibold">
                Status
              </p>
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    serverStatus.running
                      ? "bg-accent-500 pulse-online"
                      : "bg-danger-400"
                  }`}
                />
                <span
                  className={`text-[14px] font-semibold ${
                    serverStatus.running ? "text-accent-400" : "text-danger-400"
                  }`}
                >
                  {serverStatus.running ? "Online" : "Offline"}
                </span>
              </div>
            </div>

            <div className="glass-subtle rounded-xl p-4">
              <p className="text-[10px] text-vault-500 uppercase tracking-[0.12em] mb-2 font-semibold">
                Address
              </p>
              <div className="flex items-center gap-2">
                <code className="text-[14px] font-mono text-vault-100">
                  127.0.0.1:{serverStatus.port}
                </code>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `http://127.0.0.1:${serverStatus.port}`,
                      "addr"
                    )
                  }
                  className="text-vault-400 hover:text-vault-200 transition-colors"
                >
                  {copied === "addr" ? (
                    <Check className="w-3.5 h-3.5 text-accent-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="glass-subtle rounded-xl p-4">
              <p className="text-[10px] text-vault-500 uppercase tracking-[0.12em] mb-2 font-semibold">
                Encryption
              </p>
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-accent-400" />
                <span className="text-[14px] font-mono text-vault-100">
                  AES-256-GCM
                </span>
              </div>
            </div>
          </div>

          {!isTauri && !serverStatus.running && (
            <div className="mt-4 glass-subtle rounded-xl p-4">
              <p className="text-[13px] text-vault-400 mb-2.5">
                Start the server from your terminal:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-[13px] text-accent-400 glass-subtle rounded-xl px-4 py-2.5">
                  python -m achilles.main
                </code>
                <button
                  onClick={() =>
                    copyToClipboard("python -m achilles.main", "cmd")
                  }
                  className="p-2.5 rounded-xl glass-subtle hover:bg-white/[0.06] text-vault-400 hover:text-vault-200 transition-colors flex-shrink-0"
                >
                  {copied === "cmd" ? (
                    <Check className="w-4 h-4 text-accent-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* MCP Server */}
        <motion.div variants={fadeUp} className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/15 flex items-center justify-center">
                <Cpu className="w-[18px] h-[18px] text-purple-400" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-vault-100 font-display">
                  MCP Server
                </h2>
                <p className="text-[12px] text-vault-500">
                  AI tool integration via SSE
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isTauri ? (
                <>
                  {!mcpStatus.running ? (
                    <button
                      onClick={() => handleMcpAction("start")}
                      disabled={!!mcpAction}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium bg-accent-500/[0.08] text-accent-400 hover:bg-accent-500/[0.12] border border-accent-500/15 transition-all disabled:opacity-50"
                    >
                      {mcpAction === "start" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      Start
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMcpAction("stop")}
                      disabled={!!mcpAction}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium text-danger-400 hover:bg-danger-500/10 transition-all disabled:opacity-50"
                    >
                      {mcpAction === "stop" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                      Stop
                    </button>
                  )}
                </>
              ) : null}
            </div>
          </div>

          {/* Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <div className="glass-subtle rounded-xl p-4">
              <p className="text-[10px] text-vault-500 uppercase tracking-[0.12em] mb-2 font-semibold">
                Status
              </p>
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    mcpStatus.running
                      ? "bg-accent-500 pulse-online"
                      : "bg-vault-500"
                  }`}
                />
                <span
                  className={`text-[14px] font-semibold ${
                    mcpStatus.running ? "text-accent-400" : "text-vault-400"
                  }`}
                >
                  {mcpStatus.running ? "Online" : "Offline"}
                </span>
              </div>
            </div>

            <div className="glass-subtle rounded-xl p-4">
              <p className="text-[10px] text-vault-500 uppercase tracking-[0.12em] mb-2 font-semibold">
                URL
              </p>
              <div className="flex items-center gap-2">
                <code className="text-[14px] font-mono text-vault-100">
                  127.0.0.1:{mcpStatus.port}
                </code>
                <button
                  onClick={() => copyToClipboard(mcpSseUrl, "mcp-url")}
                  className="text-vault-400 hover:text-vault-200 transition-colors"
                >
                  {copied === "mcp-url" ? (
                    <Check className="w-3.5 h-3.5 text-accent-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="glass-subtle rounded-xl p-4">
              <p className="text-[10px] text-vault-500 uppercase tracking-[0.12em] mb-2 font-semibold">
                Transport
              </p>
              <span className="text-[14px] font-mono text-vault-100">
                SSE (Server-Sent Events)
              </span>
            </div>
          </div>

          {/* Config Snippets */}
          <div className="space-y-4">
            <p className="text-[13px] text-vault-400">
              Add to your AI tool configuration to connect:
            </p>

            <div>
              <p className="text-[10px] text-vault-500 uppercase tracking-[0.12em] mb-2 font-semibold">
                Claude Desktop / Cursor / Claude Code
              </p>
              <div className="relative">
                <pre className="font-mono text-[12px] text-accent-400 glass-subtle rounded-xl p-4 overflow-x-auto leading-relaxed">
                  {claudeConfig}
                </pre>
                <button
                  onClick={() =>
                    copyToClipboard(claudeConfig, "claude-config")
                  }
                  className="absolute top-3 right-3 p-2 rounded-lg glass hover:bg-white/[0.06] text-vault-300 hover:text-vault-100 transition-colors"
                >
                  {copied === "claude-config" ? (
                    <Check className="w-4 h-4 text-accent-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {!isTauri && (
              <div className="glass-subtle rounded-xl p-4">
                <p className="text-[13px] text-vault-400 mb-2.5">
                  Start the MCP server from your terminal:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-[13px] text-accent-400 glass-subtle rounded-xl px-4 py-2.5">
                    python -m achilles.mcp_server
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        "python -m achilles.mcp_server",
                        "mcp-cmd"
                      )
                    }
                    className="p-2.5 rounded-xl glass-subtle hover:bg-white/[0.06] text-vault-400 hover:text-vault-200 transition-colors flex-shrink-0"
                  >
                    {copied === "mcp-cmd" ? (
                      <Check className="w-4 h-4 text-accent-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* API Endpoints */}
        <motion.div variants={fadeUp} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
              <Terminal className="w-[18px] h-[18px] text-blue-400" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-vault-100 font-display">
                API Endpoints
              </h2>
              <p className="text-[12px] text-vault-500">REST API reference</p>
            </div>
          </div>

          <div className="space-y-1.5">
            {[
              {
                method: "GET",
                path: "/api/v1/projects",
                desc: "List projects",
              },
              {
                method: "GET",
                path: "/api/v1/projects/{id}/environments/{env}/secrets",
                desc: "List secrets",
              },
              {
                method: "PUT",
                path: "/api/v1/projects/{id}/environments/{env}/secrets/{key}",
                desc: "Set secret",
              },
              {
                method: "POST",
                path: "/api/v1/ai/mcp/call",
                desc: "MCP tool call",
              },
            ].map((ep) => (
              <div
                key={ep.path}
                className="flex items-center gap-3 px-4 py-3 rounded-xl glass-subtle"
              >
                <span
                  className={`badge ${
                    ep.method === "GET"
                      ? "badge-green"
                      : ep.method === "POST"
                        ? "badge-blue"
                        : "badge-amber"
                  }`}
                >
                  {ep.method}
                </span>
                <code className="text-[12px] font-mono text-vault-200 flex-1 min-w-0 truncate">
                  {ep.path}
                </code>
                <span className="text-[12px] text-vault-500 flex-shrink-0">
                  {ep.desc}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div variants={fadeUp} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-vault-700/50 border border-vault-600/30 flex items-center justify-center">
              <Sun className="w-[18px] h-[18px] text-vault-300" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-vault-100 font-display">
                Appearance
              </h2>
              <p className="text-[12px] text-vault-500">
                Theme and display settings
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {([
              { key: "light" as const, label: "Light", icon: Sun },
              { key: "dark" as const, label: "Dark", icon: Moon },
              { key: "system" as const, label: "System", icon: Monitor },
            ]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setTheme(opt.key)}
                className={`flex flex-col items-center gap-2.5 px-4 py-4 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  theme === opt.key
                    ? "bg-accent-500/[0.08] border border-accent-500/20 text-accent-400"
                    : "glass-subtle text-vault-400 hover:text-vault-200 hover:bg-white/[0.04]"
                }`}
              >
                <opt.icon className="w-5 h-5" />
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Chrome Extension */}
        <motion.div variants={fadeUp} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-warn-500/10 border border-warn-500/15 flex items-center justify-center">
              <ExternalLink className="w-[18px] h-[18px] text-warn-400" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-vault-100 font-display">
                Chrome Extension
              </h2>
              <p className="text-[12px] text-vault-500">
                Browser integration
              </p>
            </div>
          </div>

          <p className="text-[13px] text-vault-400 mb-4 leading-relaxed">
            Install the Achilles Vault Chrome extension for quick access to
            secrets from your browser.
          </p>

          <div className="glass-subtle rounded-xl p-4">
            <p className="text-[13px] text-vault-300 leading-relaxed">
              Load the extension from{" "}
              <code className="font-mono text-accent-400 glass px-2 py-0.5 rounded-lg text-[12px]">
                chrome-extension/
              </code>{" "}
              directory via Chrome Developer Mode.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
