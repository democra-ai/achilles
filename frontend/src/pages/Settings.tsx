import { useState } from "react";
import { motion } from "framer-motion";
import {
  Server,
  Shield,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useStore } from "../store";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Settings() {
  const { serverStatus, checkServerHealth } = useStore();
  const [copied, setCopied] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const refreshHealth = async () => {
    setChecking(true);
    await checkServerHealth();
    setTimeout(() => setChecking(false), 500);
  };

  const mcpConfig = JSON.stringify(
    {
      mcpServers: {
        "achilles-vault": {
          url: "http://127.0.0.1:8900/api/v1/ai/mcp",
          headers: {
            Authorization: "Bearer <your-api-key>",
          },
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
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="font-display text-2xl font-bold text-vault-50 tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-vault-400 mt-1">
          Server configuration and integrations
        </p>
      </motion.div>

      <div className="space-y-6">
        {/* Server Status */}
        <motion.div
          variants={fadeUp}
          className="bg-vault-900 border border-vault-700/50 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-vault-300" />
              <h2 className="font-display text-sm font-semibold text-vault-200 uppercase tracking-wider">
                Server Status
              </h2>
            </div>
            <button
              onClick={refreshHealth}
              className="p-2 rounded-lg text-vault-400 hover:text-vault-200 hover:bg-vault-800 transition-all"
            >
              <RefreshCw
                className={`w-4 h-4 ${checking ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-vault-800 rounded-lg p-4 border border-vault-700/50">
              <p className="text-xs text-vault-400 uppercase tracking-wider mb-1">
                Status
              </p>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    serverStatus.running
                      ? "bg-accent-500 pulse-online"
                      : "bg-danger-500"
                  }`}
                />
                <span
                  className={`text-sm font-semibold ${
                    serverStatus.running
                      ? "text-accent-400"
                      : "text-danger-400"
                  }`}
                >
                  {serverStatus.running ? "Online" : "Offline"}
                </span>
              </div>
            </div>

            <div className="bg-vault-800 rounded-lg p-4 border border-vault-700/50">
              <p className="text-xs text-vault-400 uppercase tracking-wider mb-1">
                Address
              </p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-vault-100">
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

            <div className="bg-vault-800 rounded-lg p-4 border border-vault-700/50">
              <p className="text-xs text-vault-400 uppercase tracking-wider mb-1">
                Encryption
              </p>
              <span className="text-sm font-mono text-vault-100">
                AES-256-GCM
              </span>
            </div>
          </div>
        </motion.div>

        {/* MCP Configuration */}
        <motion.div
          variants={fadeUp}
          className="bg-vault-900 border border-vault-700/50 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-vault-300" />
            <h2 className="font-display text-sm font-semibold text-vault-200 uppercase tracking-wider">
              MCP Configuration
            </h2>
          </div>

          <p className="text-xs text-vault-400 mb-3">
            Add this to your Claude/AI agent configuration to connect via MCP:
          </p>

          <div className="relative">
            <pre className="font-mono text-xs text-accent-400 bg-vault-800 rounded-lg p-4 overflow-x-auto border border-vault-700/50">
              {mcpConfig}
            </pre>
            <button
              onClick={() => copyToClipboard(mcpConfig, "mcp")}
              className="absolute top-3 right-3 p-1.5 rounded-md bg-vault-700 hover:bg-vault-600 text-vault-300 hover:text-vault-100 transition-all"
            >
              {copied === "mcp" ? (
                <Check className="w-3.5 h-3.5 text-accent-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </motion.div>

        {/* API Endpoints */}
        <motion.div
          variants={fadeUp}
          className="bg-vault-900 border border-vault-700/50 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-4 h-4 text-vault-300" />
            <h2 className="font-display text-sm font-semibold text-vault-200 uppercase tracking-wider">
              API Endpoints
            </h2>
          </div>

          <div className="space-y-2">
            {[
              { method: "POST", path: "/api/v1/auth/login", desc: "Authenticate" },
              { method: "GET", path: "/api/v1/projects", desc: "List projects" },
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
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-vault-800/50 border border-vault-700/30"
              >
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    ep.method === "GET"
                      ? "bg-accent-500/10 text-accent-400"
                      : ep.method === "POST"
                      ? "bg-blue-500/10 text-blue-400"
                      : "bg-warn-500/10 text-warn-400"
                  }`}
                >
                  {ep.method}
                </span>
                <code className="text-xs font-mono text-vault-200 flex-1">
                  {ep.path}
                </code>
                <span className="text-[10px] text-vault-500">{ep.desc}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Chrome Extension */}
        <motion.div
          variants={fadeUp}
          className="bg-vault-900 border border-vault-700/50 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <ExternalLink className="w-4 h-4 text-vault-300" />
            <h2 className="font-display text-sm font-semibold text-vault-200 uppercase tracking-wider">
              Chrome Extension
            </h2>
          </div>

          <p className="text-xs text-vault-400 mb-3">
            Install the Achilles Vault Chrome extension for quick access to
            secrets from your browser.
          </p>

          <div className="bg-vault-800 rounded-lg p-4 border border-vault-700/50">
            <p className="text-xs text-vault-300">
              Load the extension from{" "}
              <code className="font-mono text-accent-400 bg-vault-700 px-1.5 py-0.5 rounded">
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
