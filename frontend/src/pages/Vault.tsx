import { useEffect, useState, useCallback, useRef } from "react";
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
  Layers,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Secret, SecretCategory } from "@/types";

type FilterCategory = SecretCategory | "all";

const CATEGORIES: {
  value: SecretCategory;
  label: string;
  singular: string;
  icon: typeof KeyRound;
  placeholder: string;
}[] = [
  { value: "secret", label: "Secrets", singular: "Secret", icon: KeyRound, placeholder: "DATABASE_PASSWORD" },
  { value: "api_key", label: "API Keys", singular: "API Key", icon: Key, placeholder: "OPENAI_API_KEY" },
  { value: "env_var", label: "Env Vars", singular: "Env Variable", icon: Terminal, placeholder: "DATABASE_URL" },
  { value: "token", label: "Tokens", singular: "Token", icon: Shield, placeholder: "OAUTH_REFRESH_TOKEN" },
];

const CATEGORY_BADGE: Record<SecretCategory, { label: string; icon: typeof KeyRound }> = {
  secret: { label: "Secret", icon: KeyRound },
  api_key: { label: "API Key", icon: Key },
  env_var: { label: "Env Var", icon: Terminal },
  token: { label: "Token", icon: Shield },
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

export default function Vault() {
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

  const composingRef = useRef(false);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [createCategory, setCreateCategory] = useState<SecretCategory>("secret");
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
  const [deleteTarget, setDeleteTarget] = useState<{ key: string; secret: Secret } | null>(null);

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

  const ENVS = ["development", "staging", "production"];

  const loadSecrets = useCallback(async () => {
    const targetProjects = selectedProject ? [selectedProject] : projects;
    if (targetProjects.length === 0) return;
    try {
      const category = filterCategory === "all" ? undefined : filterCategory;
      const targetEnvs = selectedEnv === "all" ? ENVS : [selectedEnv];
      const calls = targetProjects.flatMap((p) =>
        targetEnvs.map((env) => ({ projectId: p.id, env }))
      );
      const results = await Promise.all(
        calls.map((c) => secretsApi.list(c.projectId, c.env, category))
      );
      const all = results.flatMap((r, i) =>
        r.data.map((s) => ({ ...s, _project_id: calls[i].projectId, _env_name: calls[i].env }))
      );
      setSecrets(all);
    } catch {
      setSecrets([]);
    }
  }, [selectedProject, projects, selectedEnv, filterCategory, setSecrets]);

  useEffect(() => {
    setSecrets([]);
    loadSecrets();
    setRevealedKeys(new Set());
    setRevealedValues({});
  }, [loadSecrets, setSecrets]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    const env = selectedEnv === "all" ? "development" : selectedEnv;
    setLoading(true);
    const cat = CATEGORIES.find((c) => c.value === createCategory)!;
    try {
      await secretsApi.set(selectedProject.id, env, newKey, {
        key: newKey,
        value: newValue,
        description: newDesc || undefined,
        tags: newTags ? newTags.split(",").map((t) => t.trim()) : undefined,
        category: createCategory,
      });
      await loadSecrets();
      setShowCreate(false);
      setNewKey("");
      setNewValue("");
      setNewDesc("");
      setNewTags("");
      addToast({
        type: "success",
        title: `${cat.singular} saved`,
        message: `${newKey} has been encrypted and stored`,
      });
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { key, secret } = deleteTarget;
    const pid = secret._project_id || selectedProject?.id;
    const env = secret._env_name || selectedEnv;
    if (!pid || env === "all") return;
    setDeleteTarget(null);
    try {
      await secretsApi.delete(pid, env, key);
      await loadSecrets();
      addToast({
        type: "success",
        title: "Deleted",
        message: `${key} has been moved to trash`,
      });
    } catch {
      // handled by interceptor
    }
  };

  const toggleReveal = async (key: string, secret: typeof secrets[0]) => {
    if (revealedKeys.has(key)) {
      setRevealedKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      return;
    }
    const pid = secret._project_id || selectedProject?.id;
    const env = secret._env_name || selectedEnv;
    if (!pid || env === "all") return;
    try {
      const { data } = await secretsApi.get(pid, env, key);
      setRevealedValues((prev) => ({ ...prev, [key]: data.value || "" }));
      setRevealedKeys((prev) => new Set(prev).add(key));
    } catch {
      // handled by interceptor
    }
  };

  const copyValue = async (key: string, secret: typeof secrets[0]) => {
    const pid = secret._project_id || selectedProject?.id;
    const env = secret._env_name || selectedEnv;
    if (!pid || env === "all") return;
    try {
      let value = revealedValues[key];
      if (!value) {
        const { data } = await secretsApi.get(pid, env, key);
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

  const currentLabel =
    filterCategory === "all"
      ? "items"
      : CATEGORIES.find((c) => c.value === filterCategory)!.label.toLowerCase();

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vault</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedProject
              ? `Managing all secrets for ${selectedProject.name}`
              : projects.length > 0
                ? "Managing secrets across all projects"
                : "Select a project to manage your vault"}
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
            Add New
          </Button>
        )}
      </motion.div>

      {/* Project Selector */}
      <motion.div variants={fadeUp} className="mb-4">
        <div className="flex gap-2 flex-wrap">
          {projects.length > 1 && (
            <Button
              variant={selectedProject === null ? "default" : "outline"}
              size="sm"
              onClick={() => selectProject(null)}
            >
              <Layers className="size-3.5" />
              All
            </Button>
          )}
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
      {(selectedProject || projects.length > 0) && (
        <motion.div variants={fadeUp} className="mb-4">
          <Tabs value={selectedEnv} onValueChange={selectEnv}>
            <TabsList>
              <TabsTrigger value="all">
                <Layers className="size-3.5" />
                All
              </TabsTrigger>
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

      {/* Category Filter Tabs */}
      {(selectedProject || projects.length > 0) && (
        <motion.div variants={fadeUp} className="mb-4">
          <Tabs
            value={filterCategory}
            onValueChange={(v) => setFilterCategory(v as FilterCategory)}
          >
            <TabsList>
              <TabsTrigger value="all">
                <Layers className="size-3.5" />
                All
              </TabsTrigger>
              {CATEGORIES.map(({ value, label, icon: Icon }) => (
                <TabsTrigger key={value} value={value}>
                  <Icon className="size-3.5" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>
      )}

      {/* Search */}
      {(selectedProject || projects.length > 0) && (
        <motion.div variants={fadeUp} className="mb-5 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${currentLabel}...`}
            className="pl-9"
          />
        </motion.div>
      )}

      {/* Secrets List */}
      {!selectedProject && projects.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center justify-center py-28"
        >
          <div className="size-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
            <AlertCircle className="size-8 text-muted-foreground" />
          </div>
          <p className="text-base font-medium">No projects yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create a project to get started
          </p>
        </motion.div>
      ) : filtered.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center justify-center py-28"
        >
          <div className="size-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
            <KeyRound className="size-8 text-muted-foreground" />
          </div>
          <p className="text-base font-medium">No {currentLabel} found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search
              ? "Try a different search term"
              : "Add your first item to get started"}
          </p>
          {!search && (
            <Button onClick={() => setShowCreate(true)} className="mt-5">
              <Plus className="size-4" />
              Add New
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((secret, i) => {
            const catBadge = CATEGORY_BADGE[secret.category as SecretCategory];
            const CatBadgeIcon = catBadge?.icon;
            return (
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
                          {catBadge && (
                            <Badge variant="outline" className="gap-1">
                              {CatBadgeIcon && <CatBadgeIcon className="size-3" />}
                              {catBadge.label}
                            </Badge>
                          )}
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
                              onClick={() => toggleReveal(secret.key, secret)}
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
                              onClick={() => copyValue(secret.key, secret)}
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
                              onClick={() => setDeleteTarget({ key: secret.key, secret })}
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
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <code className="font-mono font-semibold text-foreground">{deleteTarget?.key}</code>? It will be moved to the trash.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Vault</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={createCategory}
                onValueChange={(v) => setCreateCategory(v as SecretCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(({ value, label, icon: Icon }) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <Icon className="size-3.5" />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret-key">Key</Label>
              <Input
                id="secret-key"
                value={newKey}
                onChange={(e) => {
                  if (composingRef.current) {
                    setNewKey(e.target.value);
                  } else {
                    setNewKey(
                      e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_")
                    );
                  }
                }}
                onCompositionStart={() => { composingRef.current = true; }}
                onCompositionEnd={(e) => {
                  composingRef.current = false;
                  setNewKey(
                    (e.target as HTMLInputElement).value.toUpperCase().replace(/[^A-Z0-9_]/g, "_")
                  );
                }}
                className="font-mono"
                placeholder={CATEGORIES.find((c) => c.value === createCategory)?.placeholder}
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
              Add {CATEGORIES.find((c) => c.value === createCategory)?.singular}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
