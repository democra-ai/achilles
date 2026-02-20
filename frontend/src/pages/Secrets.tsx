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
} from "lucide-react";
import { useStore } from "../store";
import { secretsApi, projectsApi } from "../api/client";
// types used inline

const envTabs = [
  { key: "development", label: "Development", icon: TestTube },
  { key: "staging", label: "Staging", icon: Globe },
  { key: "production", label: "Production", icon: Rocket },
];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
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
  } = useStore();

  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTags, setNewTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [revealedValues, setRevealedValues] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (projects.length === 0) {
      projectsApi.list().then((r) => {
        setProjects(r.data);
        if (!selectedProject && r.data.length > 0) {
          selectProject(r.data[0]);
        }
      }).catch(() => {});
    }
  }, [projects.length, setProjects, selectProject, selectedProject]);

  const loadSecrets = useCallback(async () => {
    if (!selectedProject) return;
    try {
      const { data } = await secretsApi.list(selectedProject.id, selectedEnv);
      setSecrets(data);
    } catch {
      setSecrets([]);
    }
  }, [selectedProject, selectedEnv, setSecrets]);

  useEffect(() => {
    loadSecrets();
    setRevealedKeys(new Set());
    setRevealedValues({});
  }, [loadSecrets]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setLoading(true);
    try {
      await secretsApi.set(selectedProject.id, selectedEnv, newKey, {
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
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
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
      const { data } = await secretsApi.get(selectedProject.id, selectedEnv, key);
      setRevealedValues((prev) => ({ ...prev, [key]: data.value || "" }));
      setRevealedKeys((prev) => new Set(prev).add(key));
    } catch (err) {
      console.error(err);
    }
  };

  const copyValue = async (key: string) => {
    if (!selectedProject) return;
    try {
      let value = revealedValues[key];
      if (!value) {
        const { data } = await secretsApi.get(selectedProject.id, selectedEnv, key);
        value = data.value || "";
      }
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = secrets.filter(
    (s) =>
      s.key.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-vault-50 tracking-tight">
            Secrets
          </h1>
          <p className="text-sm text-vault-400 mt-1">
            {selectedProject
              ? `Managing secrets for ${selectedProject.name}`
              : "Select a project to manage secrets"}
          </p>
        </div>
        {selectedProject && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-vault-950 font-semibold text-sm rounded-xl transition-all glow-accent"
          >
            <Plus className="w-4 h-4" />
            Add Secret
          </button>
        )}
      </motion.div>

      {/* Project Selector */}
      <motion.div variants={fadeUp} className="mb-4">
        <div className="flex gap-2 flex-wrap">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => selectProject(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedProject?.id === p.id
                  ? "bg-accent-500/10 text-accent-400 border border-accent-500/30"
                  : "bg-vault-800 text-vault-400 border border-vault-700/50 hover:border-vault-600 hover:text-vault-200"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Environment Tabs */}
      {selectedProject && (
        <motion.div variants={fadeUp} className="mb-6">
          <div className="flex gap-1 p-1 bg-vault-800/50 rounded-lg w-fit">
            {envTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => selectEnv(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition-all ${
                  selectedEnv === tab.key
                    ? "bg-vault-700 text-vault-50 shadow-sm"
                    : "text-vault-400 hover:text-vault-200"
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Search */}
      {selectedProject && (
        <motion.div variants={fadeUp} className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search secrets..."
              className="w-full pl-10 pr-4 py-2.5 bg-vault-900 border border-vault-700/50 rounded-xl text-sm text-vault-100 placeholder-vault-500 focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
            />
          </div>
        </motion.div>
      )}

      {/* Secrets List */}
      {!selectedProject ? (
        <div className="flex flex-col items-center justify-center py-20 text-vault-500">
          <AlertCircle className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm">Select a project first</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-vault-500">
          <KeyRound className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm font-medium">No secrets found</p>
          <p className="text-xs mt-1">Add your first secret to get started</p>
        </div>
      ) : (
        <motion.div variants={fadeUp} className="space-y-2">
          {filtered.map((secret) => (
            <div
              key={secret.key}
              className="bg-vault-900 border border-vault-700/50 rounded-xl px-5 py-4 hover:border-vault-600 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm font-semibold text-vault-50">
                      {secret.key}
                    </code>
                    <span className="text-[10px] font-mono text-vault-500 bg-vault-800 px-1.5 py-0.5 rounded">
                      v{secret.version}
                    </span>
                  </div>
                  {secret.description && (
                    <p className="text-xs text-vault-400 mt-1">{secret.description}</p>
                  )}
                  {secret.tags && secret.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {secret.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-[10px] font-mono text-accent-400 bg-accent-500/10 px-2 py-0.5 rounded-full"
                        >
                          <Tag className="w-2.5 h-2.5" />
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
                        className="mt-3"
                      >
                        <code className="secret-reveal block font-mono text-xs text-accent-400 bg-vault-800 rounded-lg px-3 py-2 break-all border border-vault-700/50">
                          {revealedValues[secret.key]}
                        </code>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => toggleReveal(secret.key)}
                    className="p-2 rounded-lg text-vault-400 hover:text-vault-200 hover:bg-vault-800 transition-all"
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
                    className="p-2 rounded-lg text-vault-400 hover:text-vault-200 hover:bg-vault-800 transition-all"
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
                    className="p-2 rounded-lg text-vault-400 hover:text-danger-400 hover:bg-danger-500/10 transition-all opacity-0 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-vault-900 border border-vault-700/50 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-lg font-semibold text-vault-50">
                  Add Secret
                </h2>
                <button
                  onClick={() => setShowCreate(false)}
                  className="text-vault-400 hover:text-vault-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-vault-300 mb-1.5 uppercase tracking-wider">
                    Key
                  </label>
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))}
                    className="w-full px-4 py-3 bg-vault-800 border border-vault-600/50 rounded-xl text-vault-50 placeholder-vault-500 focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all font-mono text-sm"
                    placeholder="OPENAI_API_KEY"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-vault-300 mb-1.5 uppercase tracking-wider">
                    Value
                  </label>
                  <textarea
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="w-full px-4 py-3 bg-vault-800 border border-vault-600/50 rounded-xl text-vault-50 placeholder-vault-500 focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all font-mono text-sm resize-none h-24"
                    placeholder="sk-..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-vault-300 mb-1.5 uppercase tracking-wider">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-4 py-3 bg-vault-800 border border-vault-600/50 rounded-xl text-vault-50 placeholder-vault-500 focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all text-sm"
                    placeholder="Optional description"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-vault-300 mb-1.5 uppercase tracking-wider">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full px-4 py-3 bg-vault-800 border border-vault-600/50 rounded-xl text-vault-50 placeholder-vault-500 focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all text-sm"
                    placeholder="ai, openai, production"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-accent-500 hover:bg-accent-600 text-vault-950 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
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
