import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FolderKey,
  KeyRound,
  Key,
  Activity,
  Server,
  Clock,
  Cpu,
  ArrowRight,
} from "lucide-react";
import { useStore } from "@/store";
import { projectsApi, auditApi, apiKeysApi, secretsApi } from "@/api/client";
import { useNavigate } from "react-router-dom";
import type { AuditEntry } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35 },
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
  }, [setProjects, setApiKeys]);

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
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      onClick: () => navigate("/projects"),
    },
    {
      label: "Vault Items",
      value: secretCount !== null ? secretCount : "\u2014",
      icon: KeyRound,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      onClick: () => navigate("/secrets"),
    },
    {
      label: "Access Keys",
      value: apiKeys.length,
      icon: Key,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      onClick: () => navigate("/api-keys"),
    },
    {
      label: "Server",
      value: serverStatus.running ? "Online" : "Offline",
      icon: Server,
      color: serverStatus.running ? "text-emerald-400" : "text-muted-foreground",
      bgColor: serverStatus.running ? "bg-emerald-500/10" : "bg-muted",
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

  const actionVariant = (action: string) => {
    if (action.includes("create") || action.includes("set"))
      return "default" as const;
    if (action.includes("delete") || action.includes("revoke"))
      return "destructive" as const;
    return "secondary" as const;
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your vault at a glance
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {stats.map((stat, i) => (
          <motion.button
            key={stat.label}
            onClick={stat.onClick}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.1 + i * 0.06,
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="text-left"
          >
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="pt-0">
                <div
                  className={`size-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}
                >
                  <stat.icon className={`size-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold tracking-tight">
                  {stat.value}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          </motion.button>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                {
                  to: "/projects",
                  icon: FolderKey,
                  title: "Create Project",
                  desc: "Organize your secrets by project",
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                },
                {
                  to: "/secrets",
                  icon: KeyRound,
                  title: "Manage Vault",
                  desc: "Secrets, API keys, env vars, and tokens",
                  color: "text-blue-400",
                  bg: "bg-blue-500/10",
                },
                {
                  to: "/api-keys",
                  icon: Key,
                  title: "Access Keys",
                  desc: "Create keys for programmatic vault access",
                  color: "text-purple-400",
                  bg: "bg-purple-500/10",
                },
              ].map((action) => (
                <button
                  key={action.to}
                  onClick={() => navigate(action.to)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors text-left group/action"
                >
                  <div
                    className={`size-8 rounded-md ${action.bg} flex items-center justify-center shrink-0`}
                  >
                    <action.icon className={`size-4 ${action.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{action.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {action.desc}
                    </p>
                  </div>
                  <ArrowRight className="size-3.5 text-muted-foreground group-hover/action:text-foreground transition-colors" />
                </button>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {auditLog.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="size-12 rounded-lg bg-muted flex items-center justify-center mb-3">
                    <Activity className="size-5 opacity-30" />
                  </div>
                  <p className="text-sm">No recent activity</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Actions will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {auditLog.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm flex items-center gap-2">
                          <Badge variant={actionVariant(entry.action)}>
                            {entry.action}
                          </Badge>
                          <span className="text-muted-foreground truncate text-xs">
                            {entry.resource_type}
                          </span>
                        </p>
                      </div>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0">
                        <Clock className="size-3" />
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* MCP Banner */}
      <motion.div variants={fadeUp} className="mt-4">
        <Card
          className={
            mcpStatus.running ? "border-primary/20" : ""
          }
        >
          <CardContent className="flex items-center gap-4 pt-0">
            <div
              className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
                mcpStatus.running
                  ? "bg-primary/10 border border-primary/20"
                  : "bg-muted"
              }`}
            >
              <Cpu
                className={`size-5 ${
                  mcpStatus.running ? "text-primary" : "text-muted-foreground"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                MCP Integration {mcpStatus.running ? "Active" : "Ready"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {mcpStatus.running ? (
                  <>
                    AI tools connected at{" "}
                    <code className="font-mono text-primary text-[11px]">
                      http://127.0.0.1:8901/sse
                    </code>
                  </>
                ) : (
                  <>
                    Start the MCP server in{" "}
                    <button
                      onClick={() => navigate("/settings")}
                      className="text-primary hover:underline"
                    >
                      Settings
                    </button>{" "}
                    to connect AI agents.
                  </>
                )}
              </p>
            </div>
            {mcpStatus.running && (
              <div className="flex items-center gap-2 shrink-0">
                <div className="size-2 rounded-full bg-primary pulse-online" />
                <span className="text-xs font-semibold text-primary">
                  Connected
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
