import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  LayoutDashboard,
  FolderKey,
  KeyRound,
  Key,
  Settings,
  LogOut,
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
  const { sidebarCollapsed, toggleSidebar, logout, serverStatus, checkServerHealth } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 10000);
    return () => clearInterval(interval);
  }, [checkServerHealth]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-vault-950">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 72 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="relative flex flex-col border-r border-vault-700/50 bg-vault-900"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-vault-700/50">
          <div className="w-8 h-8 rounded-lg bg-accent-500/10 border border-accent-500/30 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-accent-500" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden"
              >
                <h1 className="font-display text-sm font-semibold text-vault-50 whitespace-nowrap tracking-tight">
                  Achilles Vault
                </h1>
                <p className="text-[10px] text-vault-400 font-mono">v0.1.0</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                  isActive
                    ? "bg-accent-500/10 text-accent-400"
                    : "text-vault-300 hover:text-vault-100 hover:bg-vault-700/50"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`w-[18px] h-[18px] flex-shrink-0 ${
                      isActive ? "text-accent-400" : "text-vault-400 group-hover:text-vault-200"
                    }`}
                  />
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm font-medium whitespace-nowrap"
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
        <div className="px-3 pb-2">
          <div
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
              serverStatus.running
                ? "bg-accent-500/5 border border-accent-500/20"
                : "bg-danger-500/5 border border-danger-500/20"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                serverStatus.running
                  ? "bg-accent-500 pulse-online"
                  : "bg-danger-500"
              }`}
            />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="overflow-hidden"
                >
                  <p className="text-[11px] font-medium text-vault-200 whitespace-nowrap">
                    {serverStatus.running ? "Server Online" : "Server Offline"}
                  </p>
                  <p className="text-[10px] font-mono text-vault-400 whitespace-nowrap">
                    :{serverStatus.port}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="border-t border-vault-700/50 p-3 space-y-1">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-vault-400 hover:text-danger-400 hover:bg-danger-500/5 transition-all w-full"
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-vault-700 border border-vault-600 flex items-center justify-center text-vault-300 hover:text-vault-100 hover:bg-vault-600 transition-colors z-10"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
