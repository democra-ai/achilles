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
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export default function Dashboard() {
  const { projects, setProjects, serverStatus } = useStore();
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    projectsApi
      .list()
      .then((r) => setProjects(r.data))
      .catch(() => {});
    auditApi
      .list({ limit: 8 })
      .then((r) => setAuditLog(r.data))
      .catch(() => {});
  }, [setProjects]);

  const stats = [
    {
      label: "Projects",
      value: projects.length,
      icon: FolderKey,
      color: "accent" as const,
      onClick: () => navigate("/projects"),
    },
    {
      label: "Secrets",
      value: "\u2014",
      icon: KeyRound,
      color: "accent" as const,
      onClick: () => navigate("/secrets"),
    },
    {
      label: "API Keys",
      value: "\u2014",
      icon: Key,
      color: "accent" as const,
      onClick: () => navigate("/api-keys"),
    },
    {
      label: "Server",
      value: serverStatus.running ? "Online" : "Offline",
      icon: Server,
      color: (serverStatus.running ? "accent" : "muted") as
        | "accent"
        | "muted",
    },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="font-display text-xl font-bold text-vault-50 tracking-tight leading-tight">
          Dashboard
        </h1>
        <p className="text-sm text-vault-400 mt-1 leading-normal">
          Your vault at a glance
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
      >
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={stat.onClick}
            disabled={!stat.onClick}
            className="text-left bg-vault-900 border border-vault-700/40 rounded-xl p-4 hover:border-vault-600/60 transition-all duration-200 group disabled:cursor-default"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  stat.color === "accent"
                    ? "bg-accent-500/10 text-accent-500"
                    : "bg-vault-700/50 text-vault-400"
                }`}
              >
                <stat.icon className="w-[18px] h-[18px]" />
              </div>
              {stat.onClick && (
                <ArrowUpRight className="w-3.5 h-3.5 text-vault-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
            <p className="font-display text-xl font-bold text-vault-50 leading-tight">
              {stat.value}
            </p>
            <p className="text-[11px] text-vault-400 mt-1 uppercase tracking-wider font-medium leading-tight">
              {stat.label}
            </p>
          </button>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <motion.div
          variants={fadeUp}
          className="bg-vault-900 border border-vault-700/40 rounded-xl p-5"
        >
          <h2 className="text-[11px] font-semibold text-vault-300 uppercase tracking-wider mb-3 leading-tight">
            Quick Actions
          </h2>
          <div className="space-y-1.5">
            {[
              {
                to: "/projects",
                icon: FolderKey,
                title: "Create Project",
                desc: "Organize your secrets by project",
              },
              {
                to: "/secrets",
                icon: KeyRound,
                title: "Manage Secrets",
                desc: "Add, view, or rotate your secrets",
              },
              {
                to: "/api-keys",
                icon: Key,
                title: "Generate API Key",
                desc: "Create keys for programmatic access",
              },
            ].map((action) => (
              <button
                key={action.to}
                onClick={() => navigate(action.to)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-vault-800/50 hover:bg-vault-800 border border-vault-700/30 hover:border-vault-600/50 transition-all duration-150 text-left group"
              >
                <div className="w-8 h-8 rounded-md bg-accent-500/8 flex items-center justify-center flex-shrink-0">
                  <action.icon className="w-4 h-4 text-accent-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-vault-100 leading-tight">
                    {action.title}
                  </p>
                  <p className="text-[11px] text-vault-400 leading-tight mt-0.5">
                    {action.desc}
                  </p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-vault-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </button>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          variants={fadeUp}
          className="bg-vault-900 border border-vault-700/40 rounded-xl p-5"
        >
          <h2 className="text-[11px] font-semibold text-vault-300 uppercase tracking-wider mb-3 leading-tight">
            Recent Activity
          </h2>
          {auditLog.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-vault-500">
              <Activity className="w-7 h-7 mb-2 opacity-30" />
              <p className="text-[13px] text-vault-400">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {auditLog.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-vault-800/40 transition-colors"
                >
                  <div className="w-7 h-7 rounded-md bg-vault-800/80 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-3.5 h-3.5 text-vault-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-vault-200 truncate leading-tight">
                      <span className="font-mono text-accent-400 text-[11px]">
                        {entry.action}
                      </span>{" "}
                      {entry.resource_type}
                    </p>
                    <p className="text-[11px] text-vault-500 flex items-center gap-1 mt-0.5 leading-tight">
                      <Clock className="w-3 h-3 flex-shrink-0" />
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
        className="mt-4 bg-gradient-to-r from-accent-900/20 to-vault-900 border border-accent-500/15 rounded-xl p-5 flex items-center gap-4"
      >
        <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-accent-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-semibold text-vault-50 leading-tight">
            MCP Integration Ready
          </h3>
          <p className="text-[11px] text-vault-400 mt-0.5 leading-normal">
            Connect AI agents via MCP at{" "}
            <code className="font-mono text-accent-400 bg-vault-800 px-1.5 py-0.5 rounded text-[10px]">
              http://127.0.0.1:8900/api/v1/ai/mcp
            </code>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
