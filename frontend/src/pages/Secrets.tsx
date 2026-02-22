import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound,
  Plus,
  Trash2,
  X,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  Loader2,
  TestTube,
  Globe,
  Rocket,
  Tag,
  AlertCircle,
  Lock,
} from "lucide-react";
import { useStore } from "../store";
import { secretsApi, projectsApi } from "../api/client";

const envTabs = [
  { key: "development", label: "Development", icon: TestTube },
  { key: "staging", label: "Staging", icon: Globe },
  { key: "production", label: "Production", icon: Rocket },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function Secrets() {
  const {
    projects,
    setProjects,
    selectedProject,
    selectProject,
    selectedEnv,
    selectEnv,
    secrets,
    setSecrets,
    serverStatus,
    addToast,
  } = useStore();

  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTags, setNewTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [revealedValues, setRevealedValues] = useState<
    Record<string, string>
  >({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!serverStatus.running) return;
    if (projects.length === 0) {
      projectsApi
        .list()
        .then((r) => {
          setProjects(r.data);
          if (!selectedProject && r.data.length > 0) {
            selectProject(r.data[0]);
          }
        })
        .catch(() => {});
    }
  }, [
    projects.length,
    setProjects,
    selectProject,
    selectedProject,
    serverStatus.running,
  ]);

  const loadSecrets = useCallback(async () => {
    if (!selectedProject || !serverStatus.running) return;
    try {
      const { data } = await secretsApi.list(selectedProject.id, selectedEnv);
      setSecrets(data);
    } catch {
      setSecrets([]);
    }
  }, [selectedProject, selectedEnv, setSecrets, serverStatus.running]);

  useEffect(() => {
    loadSecrets();
    setRevealedKeys(new Set());
    setRevealedValues({});
  }, [loadSecrets]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    if (!serverStatus.running) {
      addToast({
        type: "error",
        title: "Server offline",
        message: "Start the server before adding secrets",
      });
      return;
    }
    setLoading(true);
    try {
      await secretsApi.set(selectedProject.id, selectedEnv, newKey, {
        key: newKey,
        value: newValue,
        description: newDesc || undefined,
        tags: newTags ? newTags.split(",").map((t) => t.trim()) : undefined,
      });
      await loadSecrets();
      setShowCreate(false);
      setNewKey("");
      setNewValue("");
      setNewDesc("");
      setNewTags("");
      addToast({
        type: "success",
        title: "Secret saved",
        message: `${newKey} has been encrypted and stored`,
      });
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!selectedProject) return;
    if (!confirm(`Delete secret "${key}"?`)) return;
    try {
      await secretsApi.delete(selectedProject.id, selectedEnv, key);
      await loadSecrets();
      addToast({
        type: "success",
        title: "Secret deleted",
        message: `${key} has been removed`,
      });
    } catch {
      // handled by interceptor
    }
  };

  const toggleReveal = async (key: string) => {
    if (revealedKeys.has(key)) {
      setRevealedKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      return;
    }
    if (!selectedProject) return;
    try {
      const { data } = await secretsApi.get(
        selectedProject.id,
        selectedEnv,
        key
      );
      setRevealedValues((prev) => ({ ...prev, [key]: data.value || "" }));
      setRevealedKeys((prev) => new Set(prev).add(key));
    } catch {
      // handled by interceptor
    }
  };

  const copyValue = async (key: string) => {
    if (!selectedProject) return;
    try {
      let value = revealedValues[key];
      if (!value) {
        const { data } = await secretsApi.get(
          selectedProject.id,
          selectedEnv,
          key
        );
        value = data.value || "";
      }
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // handled by interceptor
    }
  };

  const filtered = secrets.filter(
    (s) =>
      s.key.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase())
  );

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
        className="flex items-center justify-between mb-8"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
              <Lock className="w-4 h-4 text-blue-400" />
            </div>
            <h1 className="font-display text-[28px] font-bold text-vault-50 tracking-tight">
              Secrets
            </h1>
          </div>
          <p className="text-[14px] text-vault-400 ml-11">
            {selectedProject
              ? `Managing secrets for ${selectedProject.name}`
              : "Select a project to manage secrets"}
          </p>
        </div>
        {selectedProject && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-semibold text-[14px] rounded-xl transition-all duration-200 shadow-lg shadow-accent-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Secret
          </motion.button>
        )}
      </motion.div>

      {/* Project Selector */}
      <motion.div variants={fadeUp} className="mb-4">
        <div className="flex gap-2 flex-wrap">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => selectProject(p)}
              className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                selectedProject?.id === p.id
                  ? "bg-accent-500/[0.08] text-accent-400 border border-accent-500/20 shadow-sm shadow-accent-500/10"
                  : "glass-subtle text-vault-400 hover:text-vault-200 hover:bg-white/[0.04]"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Environment Tabs */}
      {selectedProject && (
        <motion.div variants={fadeUp} className="mb-5">
          <div className="inline-flex gap-1 p-1 glass-subtle rounded-xl">
            {envTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => selectEnv(tab.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${
                  selectedEnv === tab.key
                    ? "bg-white/[0.08] text-vault-50 shadow-sm border border-white/[0.06]"
                    : "text-vault-400 hover:text-vault-200"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Search */}
      {selectedProject && (
        <motion.div variants={fadeUp} className="mb-5 relative z-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search secrets..."
              className="input-premium w-full pl-11"
            />
          </div>
        </motion.div>
      )}

      {/* Secrets List */}
      {!selectedProject ? (
        <div className="flex flex-col items-center justify-center py-24 text-vault-500">
          <div className="w-20 h-20 rounded-3xl glass-card flex items-center justify-center mb-5">
            <AlertCircle className="w-8 h-8 text-vault-500 opacity-40" />
          </div>
          <p className="text-[16px] font-medium text-vault-300 font-display">
            Select a project first
          </p>
          <p className="text-[13px] text-vault-500 mt-1.5">
            Choose a project from the list above
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-vault-500">
          <div className="w-20 h-20 rounded-3xl glass-card flex items-center justify-center mb-5">
            <KeyRound className="w-8 h-8 text-vault-500 opacity-40" />
          </div>
          <p className="text-[16px] font-medium text-vault-300 font-display">
            No secrets found
          </p>
          <p className="text-[13px] text-vault-500 mt-1.5">
            {search
              ? "Try a different search term"
              : "Add your first secret to get started"}
          </p>
          {!search && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreate(true)}
              className="mt-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold text-[14px] rounded-xl shadow-lg shadow-accent-500/20"
            >
              <Plus className="w-4 h-4" />
              Add Secret
            </motion.button>
          )}
        </div>
      ) : (
        <div className="space-y-2 relative z-10">
          {filtered.map((secret, i) => (
            <motion.div
              key={secret.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] as const }}
              layout
              className="glass-card rounded-2xl px-5 py-4 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <code className="font-mono text-[14px] font-semibold text-vault-50">
                      {secret.key}
                    </code>
                    <span className="badge badge-blue">v{secret.version}</span>
                  </div>
                  {secret.description && (
                    <p className="text-[13px] text-vault-400 mt-1.5">
                      {secret.description}
                    </p>
                  )}
                  {secret.tags && secret.tags.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {secret.tags.map((tag) => (
                        <span key={tag} className="badge badge-green">
                          <Tag className="w-3 h-3 flex-shrink-0" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Revealed value */}
                  <AnimatePresence>
                    {revealedKeys.has(secret.key) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3"
                      >
                        <code className="secret-reveal block font-mono text-[12px] text-accent-400 glass-subtle rounded-xl px-4 py-3 break-all leading-relaxed">
                          {revealedValues[secret.key]}
                        </code>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleReveal(secret.key)}
                    className="p-2 rounded-lg text-vault-400 hover:text-vault-200 hover:bg-white/[0.04] transition-colors"
                    title={revealedKeys.has(secret.key) ? "Hide" : "Reveal"}
                  >
                    {revealedKeys.has(secret.key) ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => copyValue(secret.key)}
                    className="p-2 rounded-lg text-vault-400 hover:text-vault-200 hover:bg-white/[0.04] transition-colors"
                    title="Copy value"
                  >
                    {copiedKey === secret.key ? (
                      <Check className="w-4 h-4 text-accent-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(secret.key)}
                    className="p-2 rounded-lg text-vault-400 hover:text-danger-400 hover:bg-danger-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
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
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="modal-content rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-semibold text-vault-50">
                  Add Secret
                </h2>
                <button
                  onClick={() => setShowCreate(false)}
                  className="p-1.5 rounded-lg text-vault-400 hover:text-vault-200 hover:bg-white/[0.04] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-vault-400 mb-2 uppercase tracking-[0.1em]">
                    Key
                  </label>
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) =>
                      setNewKey(
                        e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_")
                      )
                    }
                    className="input-premium w-full font-mono"
                    placeholder="OPENAI_API_KEY"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-vault-400 mb-2 uppercase tracking-[0.1em]">
                    Value
                  </label>
                  <textarea
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="input-premium w-full font-mono resize-none h-24"
                    placeholder="sk-..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-vault-400 mb-2 uppercase tracking-[0.1em]">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="input-premium w-full"
                    placeholder="Optional description"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-vault-400 mb-2 uppercase tracking-[0.1em]">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="input-premium w-full"
                    placeholder="ai, openai, production"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-[14px] disabled:opacity-50 shadow-lg shadow-accent-500/20"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Secret
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
