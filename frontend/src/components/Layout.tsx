import { Outlet, NavLink } from "react-router-dom";
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
} from "lucide-react";
import { useStore } from "../store";
import { useEffect } from "react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/projects", icon: FolderKey, label: "Projects" },
  { to: "/secrets", icon: KeyRound, label: "Secrets" },
  { to: "/api-keys", icon: Key, label: "API Keys" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Layout() {
  const { sidebarCollapsed, toggleSidebar, serverStatus, checkServerHealth } =
    useStore();

  useEffect(() => {
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 10000);
    return () => clearInterval(interval);
  }, [checkServerHealth]);

  return (
    <div className="flex h-screen bg-vault-950 overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 64 : 220 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="relative flex flex-col flex-shrink-0 border-r border-vault-700/40 bg-vault-900/80"
        style={{ minWidth: sidebarCollapsed ? 64 : 220 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-vault-700/40">
          <div className="w-8 h-8 rounded-lg bg-accent-500/10 border border-accent-500/25 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-accent-500" />
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
                <h1 className="font-display text-[13px] font-semibold text-vault-50 whitespace-nowrap leading-tight">
                  Achilles Vault
                </h1>
                <p className="text-[10px] text-vault-400 font-mono leading-tight">
                  v0.1.0
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 group relative ${
                  isActive
                    ? "bg-accent-500/10 text-accent-400"
                    : "text-vault-300 hover:text-vault-100 hover:bg-vault-800/60"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent-500"
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      }}
                    />
                  )}
                  <item.icon
                    className={`w-[18px] h-[18px] flex-shrink-0 ${
                      isActive
                        ? "text-accent-400"
                        : "text-vault-400 group-hover:text-vault-200"
                    }`}
                  />
                  <AnimatePresence mode="wait">
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="text-[13px] font-medium whitespace-nowrap leading-none"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Server Status */}
        <div className="px-2 pb-3">
          <div
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${
              serverStatus.running
                ? "bg-accent-500/5 border-accent-500/15"
                : "bg-vault-800/40 border-vault-700/40"
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
                  <p className="text-[11px] font-medium text-vault-200 whitespace-nowrap leading-tight">
                    {serverStatus.running ? "Server Online" : "Server Offline"}
                  </p>
                  <p className="text-[10px] font-mono text-vault-400 whitespace-nowrap leading-tight">
                    localhost:{serverStatus.port}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-vault-800 border border-vault-600/60 flex items-center justify-center text-vault-400 hover:text-vault-100 hover:bg-vault-700 transition-colors z-10"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-6 lg:p-8 max-w-[1120px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
