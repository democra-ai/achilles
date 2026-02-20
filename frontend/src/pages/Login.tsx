import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { authApi } from "../api/client";
import { useStore } from "../store";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setAuth } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const fn = isRegister ? authApi.register : authApi.login;
      const { data } = await fn(username, password);
      setAuth(data.access_token);
      navigate("/");
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Connection failed. Is the server running?"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-vault-950 vault-grid relative">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent-500/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md px-4"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-500/10 border border-accent-500/20 mb-5 glow-accent">
            <Shield className="w-8 h-8 text-accent-500" />
          </div>
          <h1 className="font-display text-2xl font-bold text-vault-50 tracking-tight">
            Achilles Vault
          </h1>
          <p className="text-sm text-vault-400 mt-1.5">
            Local-first secret management for AI workflows
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-vault-900 border border-vault-700/50 rounded-2xl p-8"
        >
          <div className="flex gap-1 p-1 bg-vault-800 rounded-lg mb-6">
            <button
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                !isRegister
                  ? "bg-vault-700 text-vault-50 shadow-sm"
                  : "text-vault-400 hover:text-vault-200"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                isRegister
                  ? "bg-vault-700 text-vault-50 shadow-sm"
                  : "text-vault-400 hover:text-vault-200"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-vault-300 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-vault-800 border border-vault-600/50 rounded-xl text-vault-50 placeholder-vault-500 focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all font-mono text-sm"
                placeholder="admin"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-vault-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-vault-800 border border-vault-600/50 rounded-xl text-vault-50 placeholder-vault-500 focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all font-mono text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-400 hover:text-vault-200 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-sm text-danger-400 bg-danger-500/10 border border-danger-500/20 rounded-lg px-4 py-2.5"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-accent-500 hover:bg-accent-600 text-vault-950 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 glow-accent disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {isRegister ? "Create Account" : "Unlock Vault"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        <p className="text-center text-xs text-vault-500 mt-6">
          All secrets encrypted with AES-256-GCM
        </p>
      </motion.div>
    </div>
  );
}
