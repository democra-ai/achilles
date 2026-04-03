import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Eye,
  EyeOff,
  Copy,
  Check,
  Pencil,
  Search,
  Loader2,
  TestTube,
  Globe,
  Rocket,
  Tag,
  AlertCircle,
  Layers,
  Eraser,
  Trash2,
} from "lucide-react";
import { useStore } from "@/store";
import { secretsApi, projectsApi, platformsApi } from "@/api/client";
import type { PlatformSummary, Platform, PlatformSecret } from "@/api/client";
import { PlatformIcon } from "@/components/PlatformIcon";
import { CATEGORY_META, CATEGORY_LIST, SOURCE_LABELS, SOURCE_KEY_HINTS, SOURCE_PLATFORM_ID } from "@/lib/categories";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { Secret, SecretCategory } from "@/types";

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
    serverStatus,
  } = useStore();

  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newValueHint, setNewValueHint] = useState("");
  const [loading, setLoading] = useState(false);

  // Platform template picker state
  const [platforms, setPlatforms] = useState<PlatformSummary[]>([]);
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>("");
  const [platformDetail, setPlatformDetail] = useState<Platform | null>(null);
  const [platformLoading, setPlatformLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [revealedValues, setRevealedValues] = useState<
    Record<string, string>
  >({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ key: string; secret: Secret } | null>(null);
  const [clearTarget, setClearTarget] = useState<{ key: string; secret: Secret } | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<Secret | null>(null);
  const [editKey, setEditKey] = useState("");
  const [editValue, setEditValue] = useState("");
  const [editHint, setEditHint] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editCategory, setEditCategory] = useState<SecretCategory>(category);
  const [editLoading, setEditLoading] = useState(false);

  const meta = CATEGORY_META[category];
  const CatIcon = meta.icon;
  const composingRef = useRef(false);
  const platformCacheRef = useRef<Map<string, Platform>>(new Map());

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
  }, [serverStatus.running, projects.length, setProjects, selectProject, selectedProject]);

  // Load platform catalog once server is online
  useEffect(() => {
    if (!serverStatus.running) return;
    platformsApi.list()
      .then((r) => setPlatforms(r.data.platforms))
      .catch(() => {});
  }, [serverStatus.running]);

  // Fetch platform detail when user picks a platform in the create dialog
  useEffect(() => {
    if (!selectedPlatformId) {
      setPlatformDetail(null);
      return;
    }
    setPlatformLoading(true);
    platformsApi.get(selectedPlatformId)
      .then((r) => setPlatformDetail(r.data))
      .catch(() => setPlatformDetail(null))
      .finally(() => setPlatformLoading(false));
  }, [selectedPlatformId]);

  const applyPlatformSecret = (secret: PlatformSecret) => {
    setNewKey(secret.key);
    setNewDesc(secret.description);
    setNewTags(`source:${selectedPlatformId}`);
    setNewValueHint(secret.placeholder || "");
  };

  const ENVS = ["development", "staging", "production"];

  const loadSecrets = useCallback(async () => {
    const targetProjects = selectedProject ? [selectedProject] : projects;
    if (targetProjects.length === 0) return;
    try {
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
  }, [selectedProject, projects, selectedEnv, category, setSecrets]);

  useEffect(() => {
    if (!serverStatus.running) {
      setSecrets([]);
      return;
    }
    setSecrets([]);
    loadSecrets();
    setRevealedKeys(new Set());
    setRevealedValues({});
  }, [serverStatus.running, loadSecrets, setSecrets]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    const env = selectedEnv === "all" ? "development" : selectedEnv;
    setLoading(true);
    try {
      await secretsApi.set(selectedProject.id, env, newKey, {
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
      setNewValueHint("");
      setSelectedPlatformId("");
      setPlatformDetail(null);
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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { key, secret } = deleteTarget;
    const pid = secret._project_id || selectedProject?.id;
    const env = secret._env_name || selectedEnv;
    if (!pid || env === "all") {
      setDeleteTarget(null);
      return;
    }
    try {
      await secretsApi.delete(pid, env, key);
      setDeleteTarget(null);
      await loadSecrets();
      addToast({
        type: "success",
        title: `${meta.singular} deleted`,
        message: `${key} has been removed`,
      });
    } catch {
      setDeleteTarget(null);
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

  const confirmClear = async () => {
    if (!clearTarget) return;
    const { key, secret } = clearTarget;
    const pid = secret._project_id || selectedProject?.id;
    const env = secret._env_name || selectedEnv;
    if (!pid || env === "all") {
      setClearTarget(null);
      return;
    }
    try {
      await secretsApi.set(pid, env, key, {
        key,
        value: "",
        description: secret.description,
        tags: secret.tags,
        category: secret.category as Parameters<typeof secretsApi.set>[3]["category"],
      });
      setRevealedKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setRevealedValues((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setClearTarget(null);
      await loadSecrets();
      addToast({ type: "success", title: "Value cleared", message: `${key} value has been wiped` });
    } catch {
      setClearTarget(null);
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

  const formatSourceLabel = (raw: string): string => {
    const key = raw
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split(/[\/:@|,;\s]/)[0]
      .split(".")[0];
    if (!key) return "";
    if (SOURCE_LABELS[key]) return SOURCE_LABELS[key];
    return key
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getSourceFromTag = (tag: string): string | null => {
    const chunks = String(tag)
      .split(",")
      .map((chunk) => chunk.trim())
      .filter(Boolean);
    for (const chunk of chunks) {
      const sourceMatch = chunk.match(/^source[:=]\s*(.+)$/i);
      if (sourceMatch?.[1]) {
        return formatSourceLabel(sourceMatch[1]);
      }
      const normalized = chunk
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split(/[\/:@|,;\s]/)[0]
        .split(".")[0];
      if (normalized && SOURCE_LABELS[normalized]) {
        return SOURCE_LABELS[normalized];
      }
    }
    return null;
  };

  const getSourceFromSecret = (secret: Secret): string | null => {
    for (const tag of secret.tags || []) {
      const source = getSourceFromTag(String(tag));
      if (source) return source;
    }
    const m = secret.description?.match(/(?:^|[|,;])\s*source[:=]\s*([^|,;]+)/i);
    if (m?.[1]) return formatSourceLabel(m[1]);

    const keyUpper = secret.key.toUpperCase();
    const hintedSource = SOURCE_KEY_HINTS.find((item) => item.pattern.test(keyUpper));
    if (hintedSource) return SOURCE_LABELS[hintedSource.source];

    const keyPrefix = secret.key.split("_")[0]?.toLowerCase();
    if (keyPrefix && SOURCE_LABELS[keyPrefix]) return SOURCE_LABELS[keyPrefix];
    return null;
  };

  const openEdit = async (secret: Secret) => {
    const pid = secret._project_id || selectedProject?.id;
    const env = secret._env_name || selectedEnv;
    if (!pid || env === "all") return;
    try {
      const { data } = await secretsApi.get(pid, env, secret.key);
      // Derive hint from platform definition (not from tags)
      let hint = "";
      const sourceTag = (secret.tags || []).find((t) => String(t).startsWith("source:"));
      const platformId = sourceTag ? String(sourceTag).replace(/^source:/, "").trim() : null;
      if (platformId) {
        let pd = platformCacheRef.current.get(platformId);
        if (!pd) {
          try {
            const { data: pdata } = await platformsApi.get(platformId);
            pd = pdata;
            platformCacheRef.current.set(platformId, pdata);
          } catch { /* no hint */ }
        }
        if (pd) {
          const ps = pd.secrets.find((s) => s.key === secret.key);
          hint = ps?.placeholder ?? "";
        }
      }
      setEditTarget(secret);
      setEditKey(secret.key);
      setEditValue(data.value || "");
      setEditHint(hint);
      setEditDesc(secret.description || "");
      // Strip internal _hint: tags from the editable tags field
      setEditTags((secret.tags || []).filter((t) => !String(t).startsWith("_hint:")).join(", "));
      setEditCategory((secret.category as SecretCategory) || category);
      setShowEdit(true);
    } catch {
      // handled by interceptor
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    const pid = editTarget._project_id || selectedProject?.id;
    const env = editTarget._env_name || selectedEnv;
    if (!pid || env === "all") return;
    setEditLoading(true);
    try {
      const nextKey = editKey.trim();
      if (!nextKey) return;
      const tags = editTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await secretsApi.set(pid, env, nextKey, {
        key: nextKey,
        value: editValue,
        description: editDesc || undefined,
        tags,
        category: editCategory,
      });
      if (nextKey !== editTarget.key) {
        await secretsApi.delete(pid, env, editTarget.key);
      }
      await loadSecrets();
      setShowEdit(false);
      setEditTarget(null);
      addToast({
        type: "success",
        title: `${meta.singular} updated`,
        message: `${nextKey} has been updated`,
      });
    } catch {
      // handled by interceptor
    } finally {
      setEditLoading(false);
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
              : projects.length > 0
                ? `${meta.description} across all projects`
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

      {/* Search */}
      {(selectedProject || projects.length > 0) && (
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
          {filtered.map((secret, i) => {
            const source = getSourceFromSecret(secret);
            const visibleTags = (secret.tags || []).filter((tag) => {
              const text = String(tag).trim();
              if (!text) return false;
              if (/^source[:=]/i.test(text)) return false;
              if (/^_hint:/i.test(text)) return false;
              const normalized = text
                .toLowerCase()
                .replace(/^https?:\/\//, "")
                .replace(/^www\./, "")
                .split(/[\/:@|,;\s]/)[0]
                .split(".")[0];
              return !SOURCE_LABELS[normalized];
            });
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
                        <Badge variant="outline" className="gap-1">
                          <CatIcon className="size-3" />
                          {meta.singular}
                        </Badge>
                        {source && (
                          <Badge variant="outline" className="p-1">
                            <PlatformIcon
                              platformId={SOURCE_PLATFORM_ID[source] ?? source.toLowerCase()}
                              size={12}
                            />
                          </Badge>
                        )}
                      </div>
                      {secret.description && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {secret.description}
                        </p>
                      )}
                      {visibleTags.length > 0 && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {visibleTags.map((tag) => (
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
                            onClick={() => openEdit(secret)}
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <Pencil className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>

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

                      {secret.value !== "" && secret.value !== undefined && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setClearTarget({ key: secret.key, secret })}
                              className="opacity-0 group-hover:opacity-100 hover:text-orange-400"
                            >
                              <Eraser className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Clear value</TooltipContent>
                        </Tooltip>
                      )}

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
      <Dialog open={!!deleteTarget} onOpenChange={() => {}}>
        <DialogContent
          showCloseButton={false}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={() => setDeleteTarget(null)}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <code className="font-mono font-semibold text-foreground">{deleteTarget?.key}</code>?
            It will be moved to the trash.
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <Button autoFocus variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Value Confirmation */}
      <Dialog open={!!clearTarget} onOpenChange={() => {}}>
        <DialogContent
          showCloseButton={false}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={() => setClearTarget(null)}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Clear Value</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to wipe the value of{" "}
            <code className="font-mono font-semibold text-foreground">{clearTarget?.key}</code>?
            The key will remain but its value will be empty.
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <Button autoFocus variant="outline" onClick={() => setClearTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmClear}>Clear Value</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={(open) => {
        setShowCreate(open);
        if (!open) { setSelectedPlatformId(""); setPlatformDetail(null); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {meta.singular}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {/* Platform template picker */}
            {platforms.length > 0 && (
              <div className="space-y-2">
                <Label>Platform template <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Select value={selectedPlatformId} onValueChange={setSelectedPlatformId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a platform to auto-fill key names…" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <PlatformIcon platformId={p.id} size={14} />
                          {p.name}
                          <span className="text-xs text-muted-foreground">({p.secret_count} keys)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Secret chips for selected platform */}
                {platformLoading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" /> Loading templates…
                  </div>
                )}
                {platformDetail && !platformLoading && (() => {
                  const filtered = platformDetail.secrets.filter((s) => s.category === category);
                  if (filtered.length === 0) return (
                    <p className="text-xs text-muted-foreground">
                      No {meta.label.toLowerCase()} keys for this platform.
                    </p>
                  );
                  return (
                    <>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {filtered.map((s) => (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => applyPlatformSecret(s)}
                            title={s.description}
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-mono hover:bg-accent hover:border-primary transition-colors"
                          >
                            {s.key}
                            {s.required && <span className="text-destructive">*</span>}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Click a key to auto-fill the form. <span className="text-destructive">*</span> = required.
                      </p>
                    </>
                  );
                })()}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="secret-key">Key</Label>
              <Input
                id="secret-key"
                value={newKey}
                onChange={(e) => {
                  if (composingRef.current) {
                    // During composition, store raw value without transformation
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
                placeholder={newValueHint || "sk-..."}
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

      {/* Edit Modal */}
      <Dialog
        open={showEdit}
        onOpenChange={(open) => {
          setShowEdit(open);
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {meta.singular}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={editCategory}
                onValueChange={(v) => setEditCategory(v as SecretCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_LIST.map(({ value, label, icon: Icon }) => (
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
              <Label htmlFor="edit-key">Key</Label>
              <Input
                id="edit-key"
                value={editKey}
                onChange={(e) => {
                  if (composingRef.current) {
                    setEditKey(e.target.value);
                  } else {
                    setEditKey(
                      e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_")
                    );
                  }
                }}
                onCompositionStart={() => { composingRef.current = true; }}
                onCompositionEnd={(e) => {
                  composingRef.current = false;
                  setEditKey(
                    (e.target as HTMLInputElement).value.toUpperCase().replace(/[^A-Z0-9_]/g, "_")
                  );
                }}
                className="font-mono"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-value">Value</Label>
              <Textarea
                id="edit-value"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="font-mono resize-none h-24"
                placeholder={editHint || "(empty — fill in your value)"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Input
                id="edit-desc"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
              <Input
                id="edit-tags"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="source:github, scope:repo"
              />
            </div>
            <Button type="submit" className="w-full" disabled={editLoading}>
              {editLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Pencil className="size-4" />
              )}
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
