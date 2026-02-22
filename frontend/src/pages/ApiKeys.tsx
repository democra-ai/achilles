import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key,
  Plus,
  Trash2,
  X,
  Copy,
  Check,
  Loader2,
  Clock,
  Shield,
  AlertTriangle,
  Fingerprint,
} from "lucide-react";
import { useStore } from "../store";
import { apiKeysApi } from "../api/client";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const scopeOptions = [
  { key: "read", label: "Read", desc: "View secrets" },
  { key: "write", label: "Write", desc: "Create & update" },
  { key: "admin", label: "Admin", desc: "Full access" },
];

export default function ApiKeys() {
  const { apiKeys, setApiKeys, serverStatus, addToast } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["read"]);
  const [expiryDays, setExpiryDays] = useState("90");
  const [loading, setLoading] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (!serverStatus.running) return;
    apiKeysApi
      .list()
      .then((r) => setApiKeys(r.data))
      .catch(() => {});
  }, [setApiKeys, serverStatus.running]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverStatus.running) {
      addToast({
        type: "error",
        title: "Server offline",
        message: "Start the server before creating API keys",
      });
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiKeysApi.create({
        name,
        scopes: selectedScopes,
        expires_in_days: expiryDays ? parseInt(expiryDays) : undefined,
      });
      setNewKeyValue(data.key);
      const list = await apiKeysApi.list();
      setApiKeys(list.data);
      addToast({
        type: "success",
        title: "API key created",
        message: "Remember to copy the key before closing",
      });
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    try {
      await apiKeysApi.revoke(id);
      const { data } = await apiKeysApi.list();
      setApiKeys(data);
      addToast({ type: "success", title: "API key revoked" });
    } catch {
      // handled by interceptor
    }
  };

  const copyKeyValue = async () => {
    if (!newKeyValue) return;
    await navigator.clipboard.writeText(newKeyValue);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope]
    );
  };

  const closeCreate = () => {
    setShowCreate(false);
    setNewKeyValue(null);
    setName("");
    setSelectedScopes(["read"]);
    setExpiryDays("90");
  };

  const parseScopes = (raw: string | string[]): string[] => {
    if (Array.isArray(raw)) return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  };

  const formatDate = (ts: number | null) => {
    if (!ts) return null;
    return new Date(ts * 1000).toLocaleDateString();
  };

  const scopeColor = (scope: string) => {
    switch (scope) {
      case "read":
        return "badge-blue";
      case "write":
        return "badge-amber";
      case "admin":
        return "badge-purple";
      default:
        return "badge-blue";
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.06 } },
      }}
    >
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex items-center justify-between mb-10"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/15 flex items-center justify-center">
              <Fingerprint className="w-4 h-4 text-purple-400" />
            </div>
            <h1 className="font-display text-[28px] font-bold text-vault-50 tracking-tight">
              API Keys
            </h1>
          </div>
          <p className="text-[14px] text-vault-400 ml-11">
            Manage programmatic access to your vault
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-semibold text-[14px] rounded-xl transition-all duration-200 shadow-lg shadow-accent-500/20"
        >
          <Plus className="w-4 h-4" />
          New API Key
        </motion.button>
      </motion.div>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center justify-center py-24 text-vault-500"
        >
          <div className="w-20 h-20 rounded-3xl glass-card flex items-center justify-center mb-5">
            <Key className="w-9 h-9 text-vault-500 opacity-40" />
          </div>
          <p className="text-[16px] font-medium text-vault-300 font-display">
            No API keys yet
          </p>
          <p className="text-[13px] text-vault-500 mt-1.5">
            Create an API key for programmatic vault access
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreate(true)}
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold text-[14px] rounded-xl shadow-lg shadow-accent-500/20"
          >
            <Plus className="w-4 h-4" />
            Generate Key
          </motion.button>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {apiKeys.map((key, i) => {
            const keyScopes = parseScopes(key.scopes);
            return (
              <motion.div
                key={key.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] as const }}
                layout
                className={`glass-card rounded-2xl px-5 py-4 group ${
                  !key.is_active ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-[15px] font-semibold text-vault-50 font-display">
                        {key.name}
                      </h3>
                      {!key.is_active && (
                        <span className="badge badge-red">Revoked</span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-2.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-vault-500 flex-shrink-0" />
                        <div className="flex gap-1">
                          {keyScopes.map((scope) => (
                            <span
                              key={scope}
                              className={`badge ${scopeColor(scope)}`}
                            >
                              {scope}
                            </span>
                          ))}
                        </div>
                      </div>
                      {key.expires_at && (
                        <span className="flex items-center gap-1.5 text-[12px] text-vault-400">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          Expires {formatDate(key.expires_at)}
                        </span>
                      )}
                      {key.last_used_at && (
                        <span className="text-[12px] text-vault-400">
                          Last used {formatDate(key.last_used_at)}
                        </span>
                      )}
                      <span className="text-[11px] text-vault-500">
                        Created {formatDate(key.created_at)}
                      </span>
                    </div>
                  </div>
                  {key.is_active ? (
                    <button
                      onClick={() => handleRevoke(key.id)}
                      className="p-2 rounded-lg text-vault-500 hover:text-danger-400 hover:bg-danger-500/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                      title="Revoke"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4"
            onClick={closeCreate}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="modal-content rounded-2xl p-6 w-full max-w-md"
            >
              {newKeyValue ? (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/15 flex items-center justify-center">
                      <Check className="w-5 h-5 text-accent-400" />
                    </div>
                    <h2 className="font-display text-lg font-semibold text-vault-50">
                      API Key Created
                    </h2>
                  </div>

                  <div className="glass-subtle rounded-xl p-3.5 mb-4 flex items-start gap-2.5 !border-warn-500/15 bg-warn-500/[0.04]">
                    <AlertTriangle className="w-4 h-4 text-warn-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[13px] text-warn-400 leading-relaxed">
                      Copy this key now. It won't be shown again.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-[12px] text-accent-400 glass-subtle rounded-xl px-4 py-3 break-all leading-relaxed">
                      {newKeyValue}
                    </code>
                    <button
                      onClick={copyKeyValue}
                      className="p-2.5 rounded-xl glass-subtle hover:bg-white/[0.06] text-vault-300 hover:text-vault-100 transition-colors flex-shrink-0"
                    >
                      {copiedKey ? (
                        <Check className="w-4 h-4 text-accent-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={closeCreate}
                    className="w-full mt-5 py-3 glass-subtle hover:bg-white/[0.06] text-vault-200 font-medium rounded-xl transition-colors text-[14px]"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-lg font-semibold text-vault-50">
                      New API Key
                    </h2>
                    <button
                      onClick={closeCreate}
                      className="p-1.5 rounded-lg text-vault-400 hover:text-vault-200 hover:bg-white/[0.04] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-vault-400 mb-2 uppercase tracking-[0.1em]">
                        Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input-premium w-full"
                        placeholder="My Claude Agent"
                        required
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-vault-400 mb-2 uppercase tracking-[0.1em]">
                        Scopes
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {scopeOptions.map((scope) => (
                          <button
                            key={scope.key}
                            type="button"
                            onClick={() => toggleScope(scope.key)}
                            className={`px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 text-center ${
                              selectedScopes.includes(scope.key)
                                ? "bg-accent-500/[0.08] border border-accent-500/20 text-accent-400"
                                : "glass-subtle text-vault-400 hover:text-vault-200 hover:bg-white/[0.04]"
                            }`}
                          >
                            {scope.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-vault-400 mb-2 uppercase tracking-[0.1em]">
                        Expires In
                      </label>
                      <select
                        value={expiryDays}
                        onChange={(e) => setExpiryDays(e.target.value)}
                        className="input-premium w-full"
                      >
                        <option value="30">30 days</option>
                        <option value="90">90 days</option>
                        <option value="365">1 year</option>
                        <option value="">Never</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || selectedScopes.length === 0}
                      className="w-full py-3 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-[14px] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent-500/20"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          Generate Key
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
