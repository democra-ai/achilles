import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FolderKey,
  KeyRound,
  Key,
  Activity,
  Server,
  ArrowUpRight,
  Clock,
  Cpu,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useStore } from "../store";
import { projectsApi, auditApi, apiKeysApi, secretsApi } from "../api/client";
import { useNavigate } from "react-router-dom";
import type { AuditEntry } from "../types";

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function Dashboard() {
  const {
    projects,
    setProjects,
    apiKeys,
    setApiKeys,
    serverStatus,
    mcpStatus,
  } = useStore();
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [secretCount, setSecretCount] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!serverStatus.running) return;
    projectsApi
      .list()
      .then((r) => setProjects(r.data))
      .catch(() => {});
    auditApi
      .list({ limit: 8 })
      .then((r) => setAuditLog(r.data.entries))
      .catch(() => {});
    apiKeysApi
      .list()
      .then((r) => setApiKeys(r.data))
      .catch(() => {});
  }, [setProjects, setApiKeys, serverStatus.running]);

  useEffect(() => {
    if (projects.length === 0) {
      setSecretCount(0);
      return;
    }
    const envs = ["development", "staging", "production"];
    const promises = projects.flatMap((p) =>
      envs.map((env) =>
        secretsApi
          .list(p.id, env)
          .then((r) => r.data.length)
          .catch(() => 0)
      )
    );
    Promise.all(promises).then((counts) => {
      setSecretCount(counts.reduce((a, b) => a + b, 0));
    });
  }, [projects]);

  const stats = [
    {
      label: "Projects",
      value: projects.length,
      icon: FolderKey,
      gradient: "stat-card-green",
      iconBg: "bg-accent-500/10 text-accent-400 border-accent-500/15",
      onClick: () => navigate("/projects"),
    },
    {
      label: "Secrets",
      value: secretCount !== null ? secretCount : "\u2014",
      icon: KeyRound,
      gradient: "stat-card-blue",
      iconBg: "bg-blue-500/10 text-blue-400 border-blue-500/15",
      onClick: () => navigate("/secrets"),
    },
    {
      label: "API Keys",
      value: apiKeys.length,
      icon: Key,
      gradient: "stat-card-purple",
      iconBg: "bg-purple-500/10 text-purple-400 border-purple-500/15",
      onClick: () => navigate("/api-keys"),
    },
    {
      label: "Server",
      value: serverStatus.running ? "Online" : "Offline",
      icon: Server,
      gradient: serverStatus.running ? "stat-card-green" : "stat-card-amber",
      iconBg: serverStatus.running
        ? "bg-accent-500/10 text-accent-400 border-accent-500/15"
        : "bg-vault-700/50 text-vault-400 border-vault-600/30",
      onClick: () => navigate("/settings"),
    },
  ];

  const formatTime = (ts: number) => {
    const d = new Date(ts * 1000);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString();
  };

  const actionColor = (action: string) => {
    if (action.includes("create") || action.includes("set"))
      return "badge-green";
    if (action.includes("delete") || action.includes("revoke"))
      return "badge-red";
    return "badge-blue";
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-accent-500/10 border border-accent-500/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-accent-400" />
          </div>
          <h1 className="font-display text-[28px] font-bold text-vault-50 tracking-tight">
            Dashboard
          </h1>
        </div>
        <p className="text-[14px] text-vault-400 ml-11">
          Your vault at a glance
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {stats.map((stat) => (
          <motion.button
            key={stat.label}
            onClick={stat.onClick}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`text-left glass-card rounded-2xl p-5 group cursor-pointer ${stat.gradient}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center border ${stat.iconBg}`}
              >
                <stat.icon className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-vault-600 opacity-0 group-hover:opacity-100 group-hover:text-vault-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <p className="font-display text-[26px] font-bold text-vault-50 leading-tight">
              {stat.value}
            </p>
            <p className="text-[11px] text-vault-400 mt-1.5 uppercase tracking-[0.1em] font-semibold">
              {stat.label}
            </p>
          </motion.button>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Quick Actions */}
        <motion.div variants={fadeUp} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-vault-400" />
            <h2 className="text-[12px] font-semibold text-vault-300 uppercase tracking-[0.1em]">
              Quick Actions
            </h2>
          </div>
          <div className="space-y-2">
            {[
              {
                to: "/projects",
                icon: FolderKey,
                title: "Create Project",
                desc: "Organize your secrets by project",
                iconBg:
                  "bg-accent-500/10 text-accent-400 border-accent-500/15",
              },
              {
                to: "/secrets",
                icon: KeyRound,
                title: "Manage Secrets",
                desc: "Add, view, or rotate your secrets",
                iconBg: "bg-blue-500/10 text-blue-400 border-blue-500/15",
              },
              {
                to: "/api-keys",
                icon: Key,
                title: "Generate API Key",
                desc: "Create keys for programmatic access",
                iconBg:
                  "bg-purple-500/10 text-purple-400 border-purple-500/15",
              },
            ].map((action) => (
              <motion.button
                key={action.to}
                onClick={() => navigate(action.to)}
                whileHover={{ x: 4 }}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl glass-subtle hover:bg-white/[0.04] transition-all duration-200 text-left group"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${action.iconBg}`}
                >
                  <action.icon className="w-[18px] h-[18px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-vault-100 leading-tight">
                    {action.title}
                  </p>
                  <p className="text-[12px] text-vault-400 leading-tight mt-0.5">
                    {action.desc}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-vault-600 opacity-0 group-hover:opacity-100 group-hover:text-vault-300 transition-all flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={fadeUp} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-4 h-4 text-vault-400" />
            <h2 className="text-[12px] font-semibold text-vault-300 uppercase tracking-[0.1em]">
              Recent Activity
            </h2>
          </div>
          {auditLog.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-vault-500">
              <div className="w-14 h-14 rounded-2xl glass-subtle flex items-center justify-center mb-3">
                <Activity className="w-6 h-6 opacity-30" />
              </div>
              <p className="text-[14px] font-medium text-vault-400">
                No recent activity
              </p>
              <p className="text-[12px] text-vault-500 mt-1">
                Actions will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {auditLog.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg glass-subtle flex items-center justify-center flex-shrink-0">
                    <Activity className="w-3.5 h-3.5 text-vault-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-vault-200 leading-tight flex items-center gap-2">
                      <span className={`badge ${actionColor(entry.action)}`}>
                        {entry.action}
                      </span>
                      <span className="text-vault-300 truncate">
                        {entry.resource_type}
                      </span>
                    </p>
                    <p className="text-[11px] text-vault-500 flex items-center gap-1.5 mt-1">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      {formatTime(entry.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* MCP Integration Banner */}
      <motion.div
        variants={fadeUp}
        className="mt-6 glass-card rounded-2xl p-6 flex items-center gap-5 bg-gradient-to-r from-accent-900/10 via-transparent to-transparent"
      >
        <div className="w-12 h-12 rounded-xl bg-accent-500/10 border border-accent-500/15 flex items-center justify-center flex-shrink-0">
          <Cpu className="w-6 h-6 text-accent-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-vault-50 leading-tight font-display">
            MCP Integration {mcpStatus.running ? "Active" : "Ready"}
          </h3>
          <p className="text-[13px] text-vault-400 mt-1 leading-relaxed">
            {mcpStatus.running ? (
              <>
                AI tools connected via MCP at{" "}
                <code className="font-mono text-accent-400 bg-vault-800/80 px-1.5 py-0.5 rounded text-[12px]">
                  http://127.0.0.1:8901/sse
                </code>
              </>
            ) : (
              <>
                Start the MCP server in{" "}
                <button
                  onClick={() => navigate("/settings")}
                  className="text-accent-400 hover:text-accent-300 underline underline-offset-2 transition-colors"
                >
                  Settings
                </button>{" "}
                to connect AI agents to your vault.
              </>
            )}
          </p>
        </div>
        {mcpStatus.running && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-accent-500 pulse-online" />
            <span className="text-[12px] font-medium text-accent-400">
              Connected
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
