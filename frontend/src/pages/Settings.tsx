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
} from "lucide-react";
import { useStore } from "../store";
import { useServerManager } from "../hooks/useTauri";

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

export default function Settings() {
  const { serverStatus, checkServerHealth, mcpStatus, checkMcpHealth } = useStore();
  const { isTauri, startServer, stopServer, restartServer, startMcpServer, stopMcpServer } = useServerManager();
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

  const handleServerAction = async (action: "start" | "stop" | "restart") => {
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
      variants={{ show: { transition: { staggerChildren: 0.04 } } }}
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="font-display text-xl font-bold text-vault-50 tracking-tight leading-tight">
          Settings
        </h1>
        <p className="text-sm text-vault-400 mt-1 leading-normal">
          Server configuration and integrations
        </p>
      </motion.div>

      <div className="space-y-4">
        {/* Server Status */}
        <motion.div
          variants={fadeUp}
          className="bg-vault-900 border border-vault-700/40 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-vault-400" />
              <h2 className="text-[11px] font-semibold text-vault-300 uppercase tracking-wider leading-tight">
                Server Status
              </h2>
            </div>
            <div className="flex items-center gap-1">
              {isTauri && (
                <>
                  {!serverStatus.running ? (
                    <button
                      onClick={() => handleServerAction("start")}
                      disabled={!!serverAction}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-accent-500/10 text-accent-400 hover:bg-accent-500/20 border border-accent-500/20 transition-colors disabled:opacity-50"
                    >
                      {serverAction === "start" ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                      Start
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleServerAction("restart")}
                        disabled={!!serverAction}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-vault-300 hover:text-vault-100 hover:bg-vault-800 transition-colors disabled:opacity-50"
                      >
                        {serverAction === "restart" ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RotateCw className="w-3 h-3" />
                        )}
                        Restart
                      </button>
                      <button
                        onClick={() => handleServerAction("stop")}
                        disabled={!!serverAction}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-danger-400 hover:bg-danger-500/10 transition-colors disabled:opacity-50"
                      >
                        {serverAction === "stop" ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Square className="w-3 h-3" />
                        )}
                        Stop
                      </button>
                    </>
                  )}
                </>
              )}
              <button
                onClick={refreshHealth}
                className="p-1.5 rounded-md text-vault-400 hover:text-vault-200 hover:bg-vault-800 transition-colors"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-vault-800/60 rounded-lg p-3 border border-vault-700/30">
              <p className="text-[10px] text-vault-400 uppercase tracking-wider mb-1 leading-tight">
                Status
              </p>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    serverStatus.running
                      ? "bg-accent-500 pulse-online"
                      : "bg-danger-400"
                  }`}
                />
                <span
                  className={`text-[13px] font-semibold leading-tight ${
                    serverStatus.running ? "text-accent-400" : "text-danger-400"
                  }`}
                >
                  {serverStatus.running ? "Online" : "Offline"}
                </span>
              </div>
            </div>

            <div className="bg-vault-800/60 rounded-lg p-3 border border-vault-700/30">
              <p className="text-[10px] text-vault-400 uppercase tracking-wider mb-1 leading-tight">
                Address
              </p>
              <div className="flex items-center gap-2">
                <code className="text-[13px] font-mono text-vault-100 leading-tight">
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
                    <Check className="w-3 h-3 text-accent-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-vault-800/60 rounded-lg p-3 border border-vault-700/30">
              <p className="text-[10px] text-vault-400 uppercase tracking-wider mb-1 leading-tight">
                Encryption
              </p>
              <span className="text-[13px] font-mono text-vault-100 leading-tight">
                AES-256-GCM
              </span>
            </div>
          </div>

          {/* Manual start instructions for browser mode */}
          {!isTauri && !serverStatus.running && (
            <div className="mt-3 bg-vault-800/40 border border-vault-700/30 rounded-lg p-3">
              <p className="text-[11px] text-vault-400 mb-2 leading-normal">
                Start the server from your terminal:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-[11px] text-accent-400 bg-vault-800 rounded px-2.5 py-1.5 border border-vault-700/40">
                  python -m achilles.main
                </code>
                <button
                  onClick={() => copyToClipboard("python -m achilles.main", "cmd")}
                  className="p-1.5 rounded-md bg-vault-800 hover:bg-vault-700 text-vault-400 hover:text-vault-200 transition-colors border border-vault-700/40 flex-shrink-0"
                >
                  {copied === "cmd" ? (
                    <Check className="w-3.5 h-3.5 text-accent-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* MCP Server */}
        <motion.div
          variants={fadeUp}
          className="bg-vault-900 border border-vault-700/40 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-vault-400" />
              <h2 className="text-[11px] font-semibold text-vault-300 uppercase tracking-wider leading-tight">
                MCP Server
              </h2>
            </div>
            <div className="flex items-center gap-1">
              {isTauri ? (
                <>
                  {!mcpStatus.running ? (
                    <button
                      onClick={() => handleMcpAction("start")}
                      disabled={!!mcpAction}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-accent-500/10 text-accent-400 hover:bg-accent-500/20 border border-accent-500/20 transition-colors disabled:opacity-50"
                    >
                      {mcpAction === "start" ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                      Start
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMcpAction("stop")}
                      disabled={!!mcpAction}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-danger-400 hover:bg-danger-500/10 transition-colors disabled:opacity-50"
                    >
                      {mcpAction === "stop" ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Square className="w-3 h-3" />
                      )}
                      Stop
                    </button>
                  )}
                </>
              ) : null}
            </div>
          </div>

          {/* Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-vault-800/60 rounded-lg p-3 border border-vault-700/30">
              <p className="text-[10px] text-vault-400 uppercase tracking-wider mb-1 leading-tight">
                Status
              </p>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    mcpStatus.running
                      ? "bg-accent-500 pulse-online"
                      : "bg-vault-500"
                  }`}
                />
                <span
                  className={`text-[13px] font-semibold leading-tight ${
                    mcpStatus.running ? "text-accent-400" : "text-vault-400"
                  }`}
                >
                  {mcpStatus.running ? "Online" : "Offline"}
                </span>
              </div>
            </div>

            <div className="bg-vault-800/60 rounded-lg p-3 border border-vault-700/30">
              <p className="text-[10px] text-vault-400 uppercase tracking-wider mb-1 leading-tight">
                URL
              </p>
              <div className="flex items-center gap-2">
                <code className="text-[13px] font-mono text-vault-100 leading-tight">
                  127.0.0.1:{mcpStatus.port}
                </code>
                <button
                  onClick={() => copyToClipboard(mcpSseUrl, "mcp-url")}
                  className="text-vault-400 hover:text-vault-200 transition-colors"
                >
                  {copied === "mcp-url" ? (
                    <Check className="w-3 h-3 text-accent-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-vault-800/60 rounded-lg p-3 border border-vault-700/30">
              <p className="text-[10px] text-vault-400 uppercase tracking-wider mb-1 leading-tight">
                Transport
              </p>
              <span className="text-[13px] font-mono text-vault-100 leading-tight">
                SSE
              </span>
            </div>
          </div>

          {/* Config Snippets */}
          <div className="space-y-3">
            <p className="text-[11px] text-vault-400 leading-normal">
              Add to your AI tool configuration to connect:
            </p>

            {/* Claude Desktop / Cursor Config */}
            <div>
              <p className="text-[10px] text-vault-500 uppercase tracking-wider mb-1.5 font-medium">
                Claude Desktop / Cursor / Claude Code
              </p>
              <div className="relative">
                <pre className="font-mono text-[11px] text-accent-400 bg-vault-800/60 rounded-lg p-3 overflow-x-auto border border-vault-700/30 leading-relaxed">
                  {claudeConfig}
                </pre>
                <button
                  onClick={() => copyToClipboard(claudeConfig, "claude-config")}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-vault-700/80 hover:bg-vault-600 text-vault-300 hover:text-vault-100 transition-colors"
                >
                  {copied === "claude-config" ? (
                    <Check className="w-3.5 h-3.5 text-accent-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Manual start for browser mode */}
            {!isTauri && (
              <div className="bg-vault-800/40 border border-vault-700/30 rounded-lg p-3">
                <p className="text-[11px] text-vault-400 mb-2 leading-normal">
                  Start the MCP server from your terminal:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-[11px] text-accent-400 bg-vault-800 rounded px-2.5 py-1.5 border border-vault-700/40">
                    python -m achilles.mcp_server
                  </code>
                  <button
                    onClick={() => copyToClipboard("python -m achilles.mcp_server", "mcp-cmd")}
                    className="p-1.5 rounded-md bg-vault-800 hover:bg-vault-700 text-vault-400 hover:text-vault-200 transition-colors border border-vault-700/40 flex-shrink-0"
                  >
                    {copied === "mcp-cmd" ? (
                      <Check className="w-3.5 h-3.5 text-accent-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* API Endpoints */}
        <motion.div
          variants={fadeUp}
          className="bg-vault-900 border border-vault-700/40 rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-4 h-4 text-vault-400" />
            <h2 className="text-[11px] font-semibold text-vault-300 uppercase tracking-wider leading-tight">
              API Endpoints
            </h2>
          </div>

          <div className="space-y-1">
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
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-vault-800/40 border border-vault-700/20"
              >
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded leading-tight ${
                    ep.method === "GET"
                      ? "bg-accent-500/10 text-accent-400"
                      : ep.method === "POST"
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-warn-500/10 text-warn-400"
                  }`}
                >
                  {ep.method}
                </span>
                <code className="text-[11px] font-mono text-vault-200 flex-1 min-w-0 truncate leading-tight">
                  {ep.path}
                </code>
                <span className="text-[10px] text-vault-500 flex-shrink-0 leading-tight">
                  {ep.desc}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Chrome Extension */}
        <motion.div
          variants={fadeUp}
          className="bg-vault-900 border border-vault-700/40 rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <ExternalLink className="w-4 h-4 text-vault-400" />
            <h2 className="text-[11px] font-semibold text-vault-300 uppercase tracking-wider leading-tight">
              Chrome Extension
            </h2>
          </div>

          <p className="text-[11px] text-vault-400 mb-3 leading-normal">
            Install the Achilles Vault Chrome extension for quick access to
            secrets from your browser.
          </p>

          <div className="bg-vault-800/60 rounded-lg p-3 border border-vault-700/30">
            <p className="text-[11px] text-vault-300 leading-normal">
              Load the extension from{" "}
              <code className="font-mono text-accent-400 bg-vault-700/80 px-1.5 py-0.5 rounded text-[10px]">
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
