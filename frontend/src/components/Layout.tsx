import { Outlet, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  LayoutDashboard,
  FolderKey,
  KeyRound,
  Key,
  Settings,
  ChevronLeft,
  ChevronRight,
  Play,
  Terminal,
  Loader2,
  Copy,
  Check,
  WifiOff,
} from "lucide-react";
import { useStore } from "../store";
import { useEffect, useState } from "react";
import { useServerManager } from "../hooks/useTauri";
import ToastContainer from "./Toast";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/projects", icon: FolderKey, label: "Projects" },
  { to: "/secrets", icon: KeyRound, label: "Secrets" },
  { to: "/api-keys", icon: Key, label: "API Keys" },
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
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="mx-6 lg:mx-8 mt-6 lg:mt-8 mb-0"
    >
      <div className="glass-card rounded-2xl p-6 !border-danger-500/15 bg-gradient-to-r from-danger-500/5 via-transparent to-transparent">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-danger-500/10 border border-danger-500/15 flex items-center justify-center flex-shrink-0">
            <WifiOff className="w-5 h-5 text-danger-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-vault-50 leading-tight font-display">
              Server Offline
            </h3>
            <p className="text-[13px] text-vault-400 mt-1.5 leading-relaxed">
              The backend server is not running. All features require an active
              server connection.
            </p>
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              {isTauri ? (
                <button
                  onClick={handleStart}
                  disabled={starting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-semibold text-[14px] rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-accent-500/20"
                >
                  {starting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {starting ? "Starting..." : "Start Server"}
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 glass-subtle rounded-xl px-4 py-2.5">
                    <Terminal className="w-4 h-4 text-vault-400 flex-shrink-0" />
                    <code className="text-[13px] font-mono text-accent-400">
                      {cmd}
                    </code>
                    <button
                      onClick={handleCopy}
                      className="p-1 text-vault-400 hover:text-vault-200 transition-colors"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-accent-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <span className="text-[12px] text-vault-500">
                    Run in your terminal
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
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

  // Apply theme to <html> element
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
    <div className="flex h-screen bg-vault-950 overflow-hidden noise-overlay">
      <ToastContainer />

      {/* Ambient gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[300px] -right-[200px] w-[700px] h-[700px] rounded-full bg-accent-500/[0.02] blur-[120px]" />
        <div className="absolute -bottom-[400px] -left-[300px] w-[800px] h-[800px] rounded-full bg-blue-500/[0.015] blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-500/[0.01] blur-[130px]" />
      </div>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 72 : 260 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="relative flex flex-col flex-shrink-0 border-r border-white/[0.04] sidebar-bg z-20"
        style={{ minWidth: sidebarCollapsed ? 72 : 260 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3.5 px-5 h-[68px] border-b border-white/[0.04]">
          <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-accent-500/20 to-accent-700/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0 glow-accent">
            <Shield className="w-[19px] h-[19px] text-accent-400" />
          </div>
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <h1 className="font-display text-[16px] font-bold text-vault-50 whitespace-nowrap tracking-tight">
                  Achilles
                </h1>
                <p className="text-[11px] text-vault-500 font-mono leading-tight">
                  Vault v0.1.0
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-5 px-3 space-y-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] font-semibold text-vault-500 uppercase tracking-[0.12em] px-3 mb-3"
              >
                Navigation
              </motion.p>
            )}
          </AnimatePresence>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? "text-accent-400"
                    : "text-vault-400 hover:text-vault-100"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-xl bg-accent-500/[0.08] border border-accent-500/[0.12]"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-3 w-full">
                    <item.icon
                      className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-200 ${
                        isActive
                          ? "text-accent-400"
                          : "text-vault-500 group-hover:text-vault-200"
                      }`}
                    />
                    <AnimatePresence mode="wait">
                      {!sidebarCollapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.1 }}
                          className={`text-[13px] font-medium whitespace-nowrap leading-none ${
                            isActive ? "text-accent-400" : ""
                          }`}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Server Status */}
        <div className="px-3 pb-4 space-y-2">
          {!serverStatus.running && !sidebarCollapsed ? (
            <button
              onClick={handleSidebarStart}
              disabled={sidebarStarting}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border border-danger-500/15 bg-danger-500/5 hover:bg-danger-500/8 transition-all duration-200 group"
            >
              {sidebarStarting ? (
                <Loader2 className="w-4 h-4 text-warn-400 animate-spin flex-shrink-0" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-danger-400 flex-shrink-0" />
              )}
              <div className="overflow-hidden min-w-0 flex-1">
                <p className="text-[12px] font-medium text-vault-200 whitespace-nowrap leading-tight">
                  {sidebarStarting ? "Starting..." : "Server Offline"}
                </p>
                <p className="text-[10px] text-vault-500 whitespace-nowrap leading-tight mt-0.5">
                  {isTauri ? "Click to start" : "Start manually"}
                </p>
              </div>
            </button>
          ) : (
            <div
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-colors ${
                serverStatus.running
                  ? "bg-accent-500/[0.04] border-accent-500/10"
                  : "bg-vault-800/30 border-white/[0.03]"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  serverStatus.running
                    ? "bg-accent-500 pulse-online"
                    : "bg-vault-500"
                }`}
              />
              <AnimatePresence mode="wait">
                {!sidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="overflow-hidden min-w-0"
                  >
                    <p className="text-[12px] font-medium text-vault-200 whitespace-nowrap leading-tight">
                      {serverStatus.running ? "Server Online" : "Offline"}
                    </p>
                    <p className="text-[10px] font-mono text-vault-500 whitespace-nowrap leading-tight mt-0.5">
                      localhost:{serverStatus.port}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-[78px] w-6 h-6 rounded-full glass border border-white/[0.08] flex items-center justify-center text-vault-400 hover:text-vault-100 transition-all duration-200 z-30 shadow-xl shadow-black/30"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        {!serverStatus.running && <OfflineBanner />}
        <div className="px-8 lg:px-10 py-6 lg:py-8 max-w-[1200px]">
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
      </main>
    </div>
  );
}
