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
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useStore } from "@/store";
import { useServerManager } from "@/hooks/useTauri";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export default function Settings() {
  const {
    serverStatus,
    checkServerHealth,
    mcpStatus,
    checkMcpHealth,
    theme,
    setTheme,
  } = useStore();
  const {
    isTauri,
    startServer,
    stopServer,
    restartServer,
    startMcpServer,
    stopMcpServer,
    restartMcpServer,
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

  const handleMcpAction = async (action: "start" | "stop" | "restart") => {
    setMcpAction(action);
    if (action === "start") await startMcpServer();
    else if (action === "stop") await stopMcpServer();
    else if (action === "restart") await restartMcpServer();
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
    <motion.div variants={stagger} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Server configuration and integrations
        </p>
      </motion.div>

      <div className="space-y-4">
        {/* Backend Server */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Server className="size-5 text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">Backend Server</CardTitle>
                    <CardDescription>
                      REST API on port {serverStatus.port}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isTauri && (
                    <>
                      {!serverStatus.running ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleServerAction("start")}
                          disabled={!!serverAction}
                        >
                          {serverAction === "start" ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Play className="size-3.5" />
                          )}
                          Start
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleServerAction("restart")}
                            disabled={!!serverAction}
                          >
                            {serverAction === "restart" ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <RotateCw className="size-3.5" />
                            )}
                            Restart
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleServerAction("stop")}
                            disabled={!!serverAction}
                            className="text-destructive hover:text-destructive"
                          >
                            {serverAction === "stop" ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Square className="size-3.5" />
                            )}
                            Stop
                          </Button>
                        </>
                      )}
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={refreshHealth}
                    title="Refresh status"
                  >
                    <RefreshCw
                      className={`size-4 ${checking ? "animate-spin" : ""}`}
                    />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
                    Status
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className={`size-2 rounded-full ${
                        serverStatus.running
                          ? "bg-primary pulse-online"
                          : "bg-destructive"
                      }`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        serverStatus.running
                          ? "text-primary"
                          : "text-destructive"
                      }`}
                    >
                      {serverStatus.running ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
                    Address
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono">
                      127.0.0.1:{serverStatus.port}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `http://127.0.0.1:${serverStatus.port}`,
                          "addr"
                        )
                      }
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied === "addr" ? (
                        <Check className="size-3.5 text-primary" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
                    Encryption
                  </p>
                  <div className="flex items-center gap-2">
                    <Lock className="size-3.5 text-primary" />
                    <span className="text-sm font-mono">AES-256-GCM</span>
                  </div>
                </div>
              </div>

              {!isTauri && !serverStatus.running && (
                <div className="mt-4 bg-muted rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    Start the server from your terminal:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-xs text-primary bg-background border rounded-md px-3 py-2">
                      python -m achilles.main
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        copyToClipboard("python -m achilles.main", "cmd")
                      }
                    >
                      {copied === "cmd" ? (
                        <Check className="size-4 text-primary" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* MCP Server */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Cpu className="size-5 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">MCP Server</CardTitle>
                    <CardDescription>
                      AI tool integration via SSE
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isTauri && (
                    <>
                      {!mcpStatus.running ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMcpAction("start")}
                          disabled={!!mcpAction}
                        >
                          {mcpAction === "start" ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Play className="size-3.5" />
                          )}
                          Start
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMcpAction("restart")}
                            disabled={!!mcpAction}
                          >
                            {mcpAction === "restart" ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <RotateCw className="size-3.5" />
                            )}
                            Restart
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMcpAction("stop")}
                            disabled={!!mcpAction}
                            className="text-destructive hover:text-destructive"
                          >
                            {mcpAction === "stop" ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Square className="size-3.5" />
                            )}
                            Stop
                          </Button>
                        </>
                      )}
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={refreshHealth}
                    title="Refresh status"
                  >
                    <RefreshCw
                      className={`size-4 ${checking ? "animate-spin" : ""}`}
                    />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
                    Status
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className={`size-2 rounded-full ${
                        mcpStatus.running
                          ? "bg-primary pulse-online"
                          : "bg-muted-foreground"
                      }`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        mcpStatus.running
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {mcpStatus.running ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
                    URL
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono">
                      127.0.0.1:{mcpStatus.port}
                    </code>
                    <button
                      onClick={() => copyToClipboard(mcpSseUrl, "mcp-url")}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied === "mcp-url" ? (
                        <Check className="size-3.5 text-primary" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
                    Transport
                  </p>
                  <span className="text-sm font-mono">
                    SSE (Server-Sent Events)
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Add to your AI tool configuration to connect:
                </p>

                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
                    Claude Desktop / Cursor / Claude Code
                  </p>
                  <div className="relative">
                    <pre className="font-mono text-xs text-primary bg-muted border rounded-lg p-4 overflow-x-auto">
                      {claudeConfig}
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(claudeConfig, "claude-config")
                      }
                      className="absolute top-3 right-3 p-1.5 rounded-md bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied === "claude-config" ? (
                        <Check className="size-3.5 text-primary" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {!isTauri && (
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      Start the MCP server from your terminal:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 font-mono text-xs text-primary bg-background border rounded-md px-3 py-2">
                        python -m achilles.mcp_server
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          copyToClipboard(
                            "python -m achilles.mcp_server",
                            "mcp-cmd"
                          )
                        }
                      >
                        {copied === "mcp-cmd" ? (
                          <Check className="size-4 text-primary" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* API Endpoints */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Terminal className="size-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-sm">API Endpoints</CardTitle>
                  <CardDescription>REST API reference</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
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
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-muted"
                  >
                    <Badge
                      variant={
                        ep.method === "GET"
                          ? "default"
                          : ep.method === "POST"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {ep.method}
                    </Badge>
                    <code className="text-xs font-mono flex-1 min-w-0 truncate">
                      {ep.path}
                    </code>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {ep.desc}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Appearance */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                  <Sun className="size-5 text-yellow-400" />
                </div>
                <div>
                  <CardTitle className="text-sm">Appearance</CardTitle>
                  <CardDescription>
                    Theme and display settings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    {
                      key: "light" as const,
                      label: "Light",
                      icon: Sun,
                    },
                    {
                      key: "dark" as const,
                      label: "Dark",
                      icon: Moon,
                    },
                    {
                      key: "system" as const,
                      label: "System",
                      icon: Monitor,
                    },
                  ] as const
                ).map((opt) => (
                  <Button
                    key={opt.key}
                    variant={theme === opt.key ? "default" : "outline"}
                    onClick={() => setTheme(opt.key)}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <opt.icon className="size-5" />
                    {opt.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Chrome Extension */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                  <ExternalLink className="size-5 text-yellow-400" />
                </div>
                <div>
                  <CardTitle className="text-sm">Chrome Extension</CardTitle>
                  <CardDescription>Browser integration</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Install the Achilles Vault Chrome extension for quick access to
                secrets from your browser.
              </p>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-xs">
                  Load the extension from{" "}
                  <code className="font-mono text-primary text-[11px]">
                    chrome-extension/
                  </code>{" "}
                  directory via Chrome Developer Mode.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
