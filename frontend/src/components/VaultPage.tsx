import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound,
  Key,
  Terminal,
  Shield,
  Plus,
  Trash2,
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
import { useStore } from "@/store";
import { secretsApi, projectsApi } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SecretCategory } from "@/types";

const CATEGORY_META: Record<
  SecretCategory,
  {
    label: string;
    singular: string;
    icon: typeof KeyRound;
    placeholder: string;
    description: string;
  }
> = {
  secret: {
    label: "Secrets",
    singular: "Secret",
    icon: KeyRound,
    placeholder: "DATABASE_PASSWORD",
    description: "Manage encrypted secrets",
  },
  api_key: {
    label: "API Keys",
    singular: "API Key",
    icon: Key,
    placeholder: "OPENAI_API_KEY",
    description: "Manage external API keys",
  },
  env_var: {
    label: "Env Variables",
    singular: "Env Variable",
    icon: Terminal,
    placeholder: "DATABASE_URL",
    description: "Manage environment variables",
  },
  token: {
    label: "Tokens",
    singular: "Token",
    icon: Shield,
    placeholder: "OAUTH_REFRESH_TOKEN",
    description: "Manage authentication tokens",
  },
};

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

interface VaultPageProps {
  category: SecretCategory;
}

export default function VaultPage({ category }: VaultPageProps) {
  const {
    projects,
    setProjects,
    selectedProject,
    selectProject,
    selectedEnv,
    selectEnv,
    secrets,
    setSecrets,
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

  const meta = CATEGORY_META[category];
  const CatIcon = meta.icon;

  useEffect(() => {
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
  }, [projects.length, setProjects, selectProject, selectedProject]);

  const loadSecrets = useCallback(async () => {
    if (!selectedProject) return;
    try {
      const { data } = await secretsApi.list(
        selectedProject.id,
        selectedEnv,
        category
      );
      setSecrets(data);
    } catch {
      setSecrets([]);
    }
  }, [selectedProject, selectedEnv, category, setSecrets]);

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
        key: newKey,
        value: newValue,
        description: newDesc || undefined,
        tags: newTags ? newTags.split(",").map((t) => t.trim()) : undefined,
        category,
      });
      await loadSecrets();
      setShowCreate(false);
      setNewKey("");
      setNewValue("");
      setNewDesc("");
      setNewTags("");
      addToast({
        type: "success",
        title: `${meta.singular} saved`,
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
    if (!confirm(`Delete ${meta.singular.toLowerCase()} "${key}"?`)) return;
    try {
      await secretsApi.delete(selectedProject.id, selectedEnv, key);
      await loadSecrets();
      addToast({
        type: "success",
        title: `${meta.singular} deleted`,
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
    <motion.div variants={stagger} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {meta.label}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedProject
              ? `${meta.description} for ${selectedProject.name}`
              : "Select a project to get started"}
          </p>
        </div>
        {projects.length > 0 && (
          <Button
            onClick={() => {
              if (!selectedProject && projects.length > 0)
                selectProject(projects[0]);
              setShowCreate(true);
            }}
          >
            <Plus className="size-4" />
            Add {meta.singular}
          </Button>
        )}
      </motion.div>

      {/* Project Selector */}
      <motion.div variants={fadeUp} className="mb-4">
        <div className="flex gap-2 flex-wrap">
          {projects.map((p) => (
            <Button
              key={p.id}
              variant={selectedProject?.id === p.id ? "default" : "outline"}
              size="sm"
              onClick={() => selectProject(p)}
            >
              {p.name}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Environment Tabs */}
      {selectedProject && (
        <motion.div variants={fadeUp} className="mb-4">
          <Tabs value={selectedEnv} onValueChange={selectEnv}>
            <TabsList>
              <TabsTrigger value="development">
                <TestTube className="size-3.5" />
                Development
              </TabsTrigger>
              <TabsTrigger value="staging">
                <Globe className="size-3.5" />
                Staging
              </TabsTrigger>
              <TabsTrigger value="production">
                <Rocket className="size-3.5" />
                Production
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>
      )}

      {/* Search */}
      {selectedProject && (
        <motion.div variants={fadeUp} className="mb-5 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${meta.label.toLowerCase()}...`}
            className="pl-9"
          />
        </motion.div>
      )}

      {/* List */}
      {!selectedProject ? (
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center justify-center py-28"
        >
          <div className="size-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
            <AlertCircle className="size-8 text-muted-foreground" />
          </div>
          <p className="text-base font-medium">Select a project first</p>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a project from the list above
          </p>
        </motion.div>
      ) : filtered.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center justify-center py-28"
        >
          <div className="size-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
            <CatIcon className="size-8 text-muted-foreground" />
          </div>
          <p className="text-base font-medium">
            No {meta.label.toLowerCase()} found
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {search
              ? "Try a different search term"
              : `Add your first ${meta.singular.toLowerCase()} to get started`}
          </p>
          {!search && (
            <Button onClick={() => setShowCreate(true)} className="mt-5">
              <Plus className="size-4" />
              Add {meta.singular}
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((secret, i) => (
            <motion.div
              key={secret.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: i * 0.04,
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Card className="group">
                <CardContent className="pt-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="font-mono text-sm font-semibold">
                          {secret.key}
                        </code>
                        <Badge variant="secondary">v{secret.version}</Badge>
                      </div>
                      {secret.description && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {secret.description}
                        </p>
                      )}
                      {secret.tags && secret.tags.length > 0 && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {secret.tags.map((tag) => (
                            <Badge key={tag} variant="outline">
                              <Tag className="size-3" />
                              {tag}
                            </Badge>
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
                            transition={{ duration: 0.15 }}
                            className="mt-3"
                          >
                            <code className="block font-mono text-xs text-primary bg-muted border rounded-lg px-4 py-3 break-all">
                              {revealedValues[secret.key]}
                            </code>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleReveal(secret.key)}
                          >
                            {revealedKeys.has(secret.key) ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {revealedKeys.has(secret.key) ? "Hide" : "Reveal"}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyValue(secret.key)}
                          >
                            {copiedKey === secret.key ? (
                              <Check className="size-4 text-primary" />
                            ) : (
                              <Copy className="size-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy value</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(secret.key)}
                            className="opacity-0 group-hover:opacity-100 hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {meta.singular}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secret-key">Key</Label>
              <Input
                id="secret-key"
                value={newKey}
                onChange={(e) =>
                  setNewKey(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_")
                  )
                }
                className="font-mono"
                placeholder={meta.placeholder}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret-value">Value</Label>
              <Textarea
                id="secret-value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="font-mono resize-none h-24"
                placeholder="sk-..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret-desc">Description</Label>
              <Input
                id="secret-desc"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret-tags">Tags (comma-separated)</Label>
              <Input
                id="secret-tags"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="ai, openai, production"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Add {meta.singular}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
