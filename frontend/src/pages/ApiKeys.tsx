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
} from "lucide-react";
import { useStore } from "../store";
import { apiKeysApi } from "../api/client";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const scopes = [
  { key: "secrets:read", label: "Read Secrets" },
  { key: "secrets:write", label: "Write Secrets" },
  { key: "projects:read", label: "Read Projects" },
  { key: "projects:write", label: "Write Projects" },
];

export default function ApiKeys() {
  const { apiKeys, setApiKeys } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [expiryDays, setExpiryDays] = useState("90");
  const [loading, setLoading] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    apiKeysApi.list().then((r) => setApiKeys(r.data)).catch(() => {});
  }, [setApiKeys]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await apiKeysApi.create({
        name,
        scopes: selectedScopes,
        expires_in_days: parseInt(expiryDays) || undefined,
      });
      setNewKeyValue(data.key);
      const list = await apiKeysApi.list();
      setApiKeys(list.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: number) => {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    try {
      await apiKeysApi.revoke(id);
      const { data } = await apiKeysApi.list();
      setApiKeys(data);
    } catch (err) {
      console.error(err);
    }
  };

  const copyKey = async () => {
    if (!newKeyValue) return;
    await navigator.clipboard.writeText(newKeyValue);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const closeCreate = () => {
    setShowCreate(false);
    setNewKeyValue(null);
    setName("");
    setSelectedScopes([]);
    setExpiryDays("90");
  };

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-vault-50 tracking-tight">
            API Keys
          </h1>
          <p className="text-sm text-vault-400 mt-1">
            Manage programmatic access to your vault
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-vault-950 font-semibold text-sm rounded-xl transition-all glow-accent"
        >
          <Plus className="w-4 h-4" />
          New API Key
        </button>
      </motion.div>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center justify-center py-20 text-vault-500"
        >
          <div className="w-16 h-16 rounded-2xl bg-vault-800 flex items-center justify-center mb-4">
            <Key className="w-8 h-8 opacity-40" />
          </div>
          <p className="text-sm font-medium">No API keys yet</p>
          <p className="text-xs text-vault-500 mt-1">
            Create an API key for programmatic vault access
          </p>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="space-y-2">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="bg-vault-900 border border-vault-700/50 rounded-xl px-5 py-4 hover:border-vault-600 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-vault-50">{key.name}</h3>
                    <code className="text-[10px] font-mono text-vault-400 bg-vault-800 px-1.5 py-0.5 rounded">
                      {key.prefix}...
                    </code>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-xs text-vault-400">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {key.scopes.join(", ")}
                    </span>
                    {key.expires_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expires {new Date(key.expires_at).toLocaleDateString()}
                      </span>
                    )}
                    {key.last_used_at && (
                      <span className="flex items-center gap-1">
                        Last used {new Date(key.last_used_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(key.id)}
                  className="p-2 rounded-lg text-vault-400 hover:text-danger-400 hover:bg-danger-500/10 transition-all opacity-0 group-hover:opacity-100"
                  title="Revoke"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={closeCreate}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-vault-900 border border-vault-700/50 rounded-2xl p-6 w-full max-w-md"
            >
              {newKeyValue ? (
                /* Show new key */
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-accent-500/10 flex items-center justify-center">
                      <Check className="w-4 h-4 text-accent-500" />
                    </div>
                    <h2 className="font-display text-lg font-semibold text-vault-50">
                      API Key Created
                    </h2>
                  </div>

                  <div className="bg-warn-500/5 border border-warn-500/20 rounded-lg p-3 mb-4 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-warn-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-warn-400">
                      Copy this key now. It won't be shown again.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-xs text-accent-400 bg-vault-800 rounded-lg px-3 py-2.5 break-all border border-vault-700/50">
                      {newKeyValue}
                    </code>
                    <button
                      onClick={copyKey}
                      className="p-2.5 rounded-lg bg-vault-800 hover:bg-vault-700 text-vault-300 hover:text-vault-100 transition-all border border-vault-700/50"
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
                    className="w-full mt-4 py-2.5 bg-vault-800 hover:bg-vault-700 text-vault-200 font-medium rounded-xl transition-all text-sm"
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* Create form */
                <>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-display text-lg font-semibold text-vault-50">
                      New API Key
                    </h2>
                    <button
                      onClick={closeCreate}
                      className="text-vault-400 hover:text-vault-200 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-vault-300 mb-1.5 uppercase tracking-wider">
                        Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-vault-800 border border-vault-600/50 rounded-xl text-vault-50 placeholder-vault-500 focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all text-sm"
                        placeholder="My Claude Agent"
                        required
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-vault-300 mb-1.5 uppercase tracking-wider">
                        Scopes
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {scopes.map((scope) => (
                          <button
                            key={scope.key}
                            type="button"
                            onClick={() => toggleScope(scope.key)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                              selectedScopes.includes(scope.key)
                                ? "bg-accent-500/10 border-accent-500/30 text-accent-400"
                                : "bg-vault-800 border-vault-700/50 text-vault-400 hover:border-vault-600"
                            }`}
                          >
                            {scope.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-vault-300 mb-1.5 uppercase tracking-wider">
                        Expires In (days)
                      </label>
                      <select
                        value={expiryDays}
                        onChange={(e) => setExpiryDays(e.target.value)}
                        className="w-full px-4 py-3 bg-vault-800 border border-vault-600/50 rounded-xl text-vault-50 focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all text-sm"
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
                      className="w-full py-3 bg-accent-500 hover:bg-accent-600 text-vault-950 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
