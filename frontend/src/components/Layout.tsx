import { Outlet, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  LayoutDashboard,
  FolderKey,
  KeyRound,
  Key,
  Settings,
  Play,
  Terminal,
  Loader2,
  Copy,
  Check,
  WifiOff,
  Fingerprint,
  Lock,
} from "lucide-react";
import { useStore } from "@/store";
import { useEffect, useState } from "react";
import { useServerManager } from "@/hooks/useTauri";
import { ToastBridge } from "./Toast";
import { Toaster } from "@/components/ui/sonner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, Trash2 } from "lucide-react";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";

const topNav = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/projects", icon: FolderKey, label: "Projects" },
];

const vaultItems = [
  { to: "/secrets", icon: KeyRound, label: "Secrets" },
  { to: "/vault-api-keys", icon: Key, label: "API Keys" },
  { to: "/env-vars", icon: Terminal, label: "Env Vars" },
  { to: "/tokens", icon: Shield, label: "Tokens" },
];

const bottomNav = [
  { to: "/trash", icon: Trash2, label: "Trash" },
  { to: "/api-keys", icon: Fingerprint, label: "Access Keys" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

function OfflineBanner() {
  const { isTauri, startServer } = useServerManager();
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const cmd = "python -m achilles.main";

  const handleStart = async () => {
    setStarting(true);
    await startServer();
    setStarting(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-6 pt-4">
      <Alert variant="destructive">
        <WifiOff className="size-4" />
        <AlertTitle>Server Offline</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>The backend server is not running.</span>
          {isTauri ? (
            <Button
              size="sm"
              onClick={handleStart}
              disabled={starting}
            >
              {starting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              {starting ? "Starting..." : "Start"}
            </Button>
          ) : (
            <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5">
              <Terminal className="size-3.5 text-muted-foreground" />
              <code className="text-xs font-mono text-primary">{cmd}</code>
              <button
                onClick={handleCopy}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? (
                  <Check className="size-3.5 text-primary" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default function Layout() {
  const {
    sidebarCollapsed,
    toggleSidebar,
    serverStatus,
    checkServerHealth,
    checkMcpHealth,
    theme,
  } = useStore();
  const { isTauri, startServer } = useServerManager();
  const [sidebarStarting, setSidebarStarting] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const applyTheme = (resolved: "light" | "dark") => {
      document.documentElement.classList.toggle("light", resolved === "light");
    };

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mq.matches ? "dark" : "light");
      const handler = (e: MediaQueryListEvent) =>
        applyTheme(e.matches ? "dark" : "light");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  useEffect(() => {
    checkServerHealth();
    checkMcpHealth();
    const interval = setInterval(() => {
      checkServerHealth();
      checkMcpHealth();
    }, 5000);
    return () => clearInterval(interval);
  }, [checkServerHealth, checkMcpHealth]);

  const handleSidebarStart = async () => {
    setSidebarStarting(true);
    await startServer();
    setSidebarStarting(false);
  };

  return (
    <TooltipProvider>
      <SidebarProvider
        className="h-screen overflow-hidden ambient-bg noise-overlay"
        open={!sidebarCollapsed}
        onOpenChange={(open) => {
          if (open === sidebarCollapsed) toggleSidebar();
        }}
      >
        {/* ── VS Code-style unified title bar ── */}
        <header
          data-tauri-drag-region
          className="fixed top-0 inset-x-0 z-50 flex items-center h-[var(--titlebar-inset,0px)] border-b border-border/40 bg-background/60 backdrop-blur-md select-none"
        >
          {/* Left: after traffic lights (~76px), sidebar toggle + brand */}
          <div className="flex items-center gap-2.5 pl-[76px]">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="size-5 rounded bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/25 flex items-center justify-center shadow-[0_0_8px_oklch(0.696_0.17_162.48/0.12)]">
              <Shield className="size-3 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground/70">
              Achilles Vault
            </span>
          </div>
        </header>

        <Sidebar collapsible="icon" className="glass-sidebar !top-[var(--titlebar-inset,0px)] !h-[calc(100svh-var(--titlebar-inset,0px))]">
          <SidebarContent className="px-2 py-2">
            <SidebarMenu>
              {topNav.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to)}
                    tooltip={item.label}
                  >
                    <NavLink to={item.to} end={item.to === "/"}>
                      <item.icon />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Vault collapsible group */}
              <Collapsible
                defaultOpen
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <div className="flex items-center">
                    <SidebarMenuButton
                      asChild
                      tooltip="Vault"
                      isActive={location.pathname === "/vault"}
                      className="flex-1"
                    >
                      <NavLink to="/vault">
                        <Lock />
                        <span>Vault</span>
                      </NavLink>
                    </SidebarMenuButton>
                    <CollapsibleTrigger asChild>
                      <button className="p-1 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors group-data-[state=collapsed]:hidden">
                        <ChevronRight className="size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {vaultItems.map((item) => (
                        <SidebarMenuSubItem key={item.to}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={location.pathname.startsWith(item.to)}
                          >
                            <NavLink to={item.to}>
                              <item.icon />
                              <span>{item.label}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {bottomNav.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith(item.to)}
                    tooltip={item.label}
                  >
                    <NavLink to={item.to}>
                      <item.icon />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border p-4">
            {!serverStatus.running ? (
              <button
                onClick={handleSidebarStart}
                disabled={sidebarStarting}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-all group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              >
                {sidebarStarting ? (
                  <Loader2 className="size-4 text-yellow-400 animate-spin shrink-0" />
                ) : (
                  <div className="size-2 rounded-full bg-destructive shrink-0 shadow-[0_0_6px_oklch(0.704_0.191_22.216/0.5)]" />
                )}
                <div className="min-w-0 flex-1 text-left group-data-[collapsible=icon]:hidden">
                  <p className="text-xs font-medium text-foreground">
                    {sidebarStarting ? "Starting..." : "Server Offline"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {isTauri ? "Click to start" : "Start manually"}
                  </p>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                <div className="size-2 rounded-full bg-primary pulse-online shrink-0 shadow-[0_0_6px_oklch(0.696_0.17_162.48/0.4)]" />
                <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                  <p className="text-xs font-medium text-foreground">
                    Server Online
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    localhost:{serverStatus.port}
                  </p>
                </div>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="overflow-y-auto relative z-[1] !mt-[var(--titlebar-inset,0px)]">
          {!serverStatus.running && <OfflineBanner />}

          <div className="max-w-[1200px] w-full px-6 lg:px-10 py-6 lg:py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </SidebarInset>

        <Toaster />
        <ToastBridge />
      </SidebarProvider>
    </TooltipProvider>
  );
}
