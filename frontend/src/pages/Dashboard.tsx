import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FolderKey,
  KeyRound,
  Key,
  Activity,
  Shield,
  Server,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { useStore } from "../store";
import { projectsApi, auditApi } from "../api/client";
import { useNavigate } from "react-router-dom";
import type { AuditEntry } from "../types";

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Dashboard() {
  const { projects, setProjects, serverStatus } = useStore();
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    projectsApi.list().then((r) => setProjects(r.data)).catch(() => {});
    auditApi.list({ limit: 8 }).then((r) => setAuditLog(r.data)).catch(() => {});
  }, [setProjects]);

  const stats = [
    {
      label: "Projects",
      value: projects.length,
      icon: FolderKey,
      color: "accent",
      onClick: () => navigate("/projects"),
    },
    {
      label: "Secrets",
      value: "—",
      icon: KeyRound,
      color: "accent",
      onClick: () => navigate("/secrets"),
    },
    {
      label: "API Keys",
      value: "—",
      icon: Key,
      color: "accent",
      onClick: () => navigate("/api-keys"),
    },
    {
      label: "Server",
      value: serverStatus.running ? "Online" : "Offline",
      icon: Server,
      color: serverStatus.running ? "accent" : "danger",
    },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="font-display text-2xl font-bold text-vault-50 tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-vault-400 mt-1">
          Your vault at a glance
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={stat.onClick}
            className="text-left bg-vault-900 border border-vault-700/50 rounded-xl p-5 hover:border-vault-600 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  stat.color === "accent"
                    ? "bg-accent-500/10 text-accent-500"
                    : "bg-danger-500/10 text-danger-500"
                }`}
              >
                <stat.icon className="w-[18px] h-[18px]" />
              </div>
              {stat.onClick && (
                <ArrowUpRight className="w-4 h-4 text-vault-500 group-hover:text-vault-300 transition-colors" />
              )}
            </div>
            <p className="font-display text-2xl font-bold text-vault-50">
              {stat.value}
            </p>
            <p className="text-xs text-vault-400 mt-0.5 uppercase tracking-wider">
              {stat.label}
            </p>
          </button>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div
          variants={fadeUp}
          className="bg-vault-900 border border-vault-700/50 rounded-xl p-6"
        >
          <h2 className="font-display text-sm font-semibold text-vault-200 uppercase tracking-wider mb-4">
            Quick Actions
          </h2>
          <div className="space-y-2">
            <button
              onClick={() => navigate("/projects")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-vault-800 hover:bg-vault-700 border border-vault-700/50 hover:border-vault-600 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-md bg-accent-500/10 flex items-center justify-center">
                <FolderKey className="w-4 h-4 text-accent-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-vault-100">
                  Create Project
                </p>
                <p className="text-xs text-vault-400">
                  Organize your secrets by project
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-vault-500 group-hover:text-vault-300 transition-colors" />
            </button>

            <button
              onClick={() => navigate("/secrets")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-vault-800 hover:bg-vault-700 border border-vault-700/50 hover:border-vault-600 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-md bg-accent-500/10 flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-accent-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-vault-100">
                  Manage Secrets
                </p>
                <p className="text-xs text-vault-400">
                  Add, view, or rotate your secrets
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-vault-500 group-hover:text-vault-300 transition-colors" />
            </button>

            <button
              onClick={() => navigate("/api-keys")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-vault-800 hover:bg-vault-700 border border-vault-700/50 hover:border-vault-600 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-md bg-accent-500/10 flex items-center justify-center">
                <Key className="w-4 h-4 text-accent-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-vault-100">
                  Generate API Key
                </p>
                <p className="text-xs text-vault-400">
                  Create keys for programmatic access
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-vault-500 group-hover:text-vault-300 transition-colors" />
            </button>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          variants={fadeUp}
          className="bg-vault-900 border border-vault-700/50 rounded-xl p-6"
        >
          <h2 className="font-display text-sm font-semibold text-vault-200 uppercase tracking-wider mb-4">
            Recent Activity
          </h2>
          {auditLog.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-vault-500">
              <Activity className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-1">
              {auditLog.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-vault-800/50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-md bg-vault-800 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-3.5 h-3.5 text-vault-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-vault-200 truncate">
                      <span className="font-mono text-accent-400 text-xs">
                        {entry.action}
                      </span>{" "}
                      {entry.resource_type}
                    </p>
                    <p className="text-xs text-vault-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(entry.timestamp).toLocaleString()}
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
        className="mt-6 bg-gradient-to-r from-accent-900/30 to-vault-900 border border-accent-500/20 rounded-xl p-6 flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center flex-shrink-0">
          <Shield className="w-6 h-6 text-accent-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-sm font-semibold text-vault-50">
            MCP Integration Ready
          </h3>
          <p className="text-xs text-vault-400 mt-0.5">
            Connect AI agents via MCP at{" "}
            <code className="font-mono text-accent-400 bg-vault-800 px-1.5 py-0.5 rounded">
              http://127.0.0.1:8900/api/v1/ai/mcp
            </code>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
