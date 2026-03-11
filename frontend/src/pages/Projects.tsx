import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  FolderKey,
  Plus,
  Trash2,
  Loader2,
  Globe,
  TestTube,
  Rocket,
  ChevronLeft,
  Check,
  Search,
  X,
} from "lucide-react";
import { useStore } from "@/store";
import { projectsApi, platformsApi, secretsApi } from "@/api/client";
import type { PlatformCategory } from "@/api/client";
import { useNavigate } from "react-router-dom";
import type { Project } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlatformIcon } from "@/components/PlatformIcon";

// ─── Template categories ─────────────────────────────────────────────────────

interface ProjectTemplate {
  id: string;
  label: string;
  description: string;
}

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  { id: "blank",   label: "Blank",        description: "Start from scratch" },
  { id: "ai",      label: "AI / LLM",     description: "LLM integrations & agents" },
  { id: "webapp",  label: "Web App",      description: "Full-stack web application" },
  { id: "backend", label: "Backend API",  description: "Server-side API & infrastructure" },
  { id: "mobile",  label: "Mobile App",   description: "iOS / Android application" },
  { id: "devops",  label: "DevOps",       description: "CI/CD & cloud infrastructure" },
];

// Which category to scroll to when each template is selected
const TEMPLATE_CATEGORY_HINT: Record<string, string> = {
  ai:      "ai_ml",
  webapp:  "devtools",
  backend: "cloud",
  mobile:  "mobile",
  devops:  "devops",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePlatforms(desc?: string): string[] {
  if (!desc) return [];
  const m = desc.match(/\[stack:([^\]]+)\]/);
  return m ? m[1].split(",").map((s) => s.trim()).filter(Boolean) : [];
}

function visibleDesc(desc?: string): string | undefined {
  if (!desc) return undefined;
  const cleaned = desc.replace(/\s*\[stack:[^\]]+\]/, "").trim();
  return cleaned || undefined;
}

// ─── Env config ───────────────────────────────────────────────────────────────

const envIcons: Record<string, typeof Globe> = {
  development: TestTube,
  staging: Globe,
  production: Rocket,
};

const envColors: Record<string, string> = {
  development: "text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10",
  staging: "text-blue-400 border-blue-500/20 hover:bg-blue-500/10",
  production: "text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/10",
};

// ─── Animations ───────────────────────────────────────────────────────────────

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Projects() {
  const { projects, setProjects, selectProject, selectEnv, serverStatus, addToast } = useStore();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<{ id: string; name: string } | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate>(PROJECT_TEMPLATES[0]);

  // Step 2 — platform multi-select
  const [categories, setCategories] = useState<PlatformCategory[]>([]);
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<Set<string>>(new Set());
  const [platformSearch, setPlatformSearch] = useState("");
  const [scrollToCategoryId, setScrollToCategoryId] = useState<string | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Step 3 — project details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [addPresetKeys, setAddPresetKeys] = useState(true);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Load platform catalog once
  useEffect(() => {
    platformsApi.categories()
      .then((r) => setCategories(r.data.categories))
      .catch(() => {});
  }, []);

  // Load projects when server is running
  useEffect(() => {
    if (!serverStatus.running) return;
    projectsApi.list().then((r) => setProjects(r.data)).catch(() => {});
  }, [setProjects, serverStatus.running]);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const resetDialog = () => {
    setStep(1);
    setSelectedTemplate(PROJECT_TEMPLATES[0]);
    setSelectedPlatformIds(new Set());
    setPlatformSearch("");
    setScrollToCategoryId(null);
    setName("");
    setDescription("");
    setAddPresetKeys(true);
  };

  // Never pre-select — user chooses themselves. Scroll to relevant category.
  const pickTemplate = (tpl: ProjectTemplate) => {
    setSelectedTemplate(tpl);
    setSelectedPlatformIds(new Set());
    const hint = TEMPLATE_CATEGORY_HINT[tpl.id] ?? null;
    setScrollToCategoryId(hint);
    setStep(tpl.id === "blank" ? 3 : 2);
  };

  // Scroll to hinted category once step 2 renders
  useEffect(() => {
    if (step !== 2 || !scrollToCategoryId) return;
    const el = categoryRefs.current[scrollToCategoryId];
    if (el) {
      // Small delay to let layout settle
      setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
    setScrollToCategoryId(null);
  }, [step, scrollToCategoryId]);

  const togglePlatform = (id: string) => {
    setSelectedPlatformIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allPlatforms = categories.flatMap((c) => c.platforms);

  const totalKeys = allPlatforms
    .filter((p) => selectedPlatformIds.has(p.id))
    .reduce((sum, p) => sum + p.secret_count, 0);

  // Filtered categories for search
  const searchLower = platformSearch.toLowerCase();
  const filteredCategories = platformSearch
    ? categories
        .map((cat) => ({
          ...cat,
          platforms: cat.platforms.filter(
            (p) =>
              p.name.toLowerCase().includes(searchLower) ||
              p.id.toLowerCase().includes(searchLower)
          ),
        }))
        .filter((cat) => cat.platforms.length > 0)
    : categories.filter((cat) => cat.platforms.length > 0);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverStatus.running) {
      addToast({ type: "error", title: "Server offline", message: "Start the server before creating projects" });
      return;
    }
    setLoading(true);
    try {
      const ids = [...selectedPlatformIds];
      const platformHint = ids.length > 0 ? ` [stack:${ids.join(",")}]` : "";
      const fullDesc = description ? `${description}${platformHint}` : platformHint.trim() || undefined;
      const { data: project } = await projectsApi.create(name, fullDesc);

      // Auto-create all preset secret keys for selected platforms in all 3 envs
      if (ids.length > 0 && addPresetKeys) {
        const platformResults = await Promise.allSettled(
          ids.map((id) => platformsApi.get(id))
        );
        const envs = ["development", "staging", "production"];
        const createCalls: Array<{ env: string; key: string; payload: object }> = [];
        for (const result of platformResults) {
          if (result.status !== "fulfilled") continue;
          const platform = result.value.data;
          for (const env of envs) {
            for (const secret of platform.secrets) {
              const tags = [`source:${platform.id}`];
              createCalls.push({
                env,
                key: secret.key,
                payload: {
                  key: secret.key,
                  value: "",
                  description: secret.description,
                  category: secret.category,
                  tags,
                },
              });
            }
          }
        }
        await Promise.allSettled(
          createCalls.map(({ env, key, payload }) =>
            secretsApi.set(project.id, env, key, payload as Parameters<typeof secretsApi.set>[3])
          )
        );
      }

      const { data } = await projectsApi.list();
      setProjects(data);
      setShowCreate(false);
      resetDialog();
      addToast({
        type: "success",
        title: "Project created",
        message: ids.length > 0
          ? `"${name}" created with ${totalKeys} preset keys ready to fill`
          : `"${name}" is ready to use`,
      });
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteProjectTarget({ id, name });
  };

  const confirmDeleteProject = async () => {
    if (!deleteProjectTarget) return;
    const { id } = deleteProjectTarget;
    try {
      await projectsApi.delete(id);
      setDeleteProjectTarget(null);
      const { data } = await projectsApi.list();
      setProjects(data);
      addToast({ type: "success", title: "Project deleted" });
    } catch {
      setDeleteProjectTarget(null);
    }
  };

  const openProject = (project: Project, env = "development") => {
    selectProject(project);
    selectEnv(env);
    navigate("/vault");
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Create Modal ── */}
      <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) resetDialog(); }}>
        <DialogContent className={step === 2 ? "max-w-2xl" : "max-w-lg"}>
          <DialogHeader>
            <DialogTitle>
              {step === 1 ? "New Project — Choose Template" :
               step === 2 ? "Select Platforms" :
               "Project Details"}
            </DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-1">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* ── Step 1: Template picker ── */}
          {step === 1 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {PROJECT_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => pickTemplate(tpl)}
                  className="flex flex-col items-start gap-2 rounded-lg border border-border p-3 text-left hover:bg-accent hover:border-primary transition-colors"
                >
                  <div className="size-8 rounded-md bg-muted flex items-center justify-center">
                    <FolderKey className="size-4 text-muted-foreground" />
                  </div>
                  <span className="text-xs font-semibold">{tpl.label}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{tpl.description}</span>
                </button>
              ))}
            </div>
          )}

          {/* ── Step 2: Platform multi-select ── */}
          {step === 2 && (
            <div className="mt-2 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  value={platformSearch}
                  onChange={(e) => setPlatformSearch(e.target.value)}
                  placeholder="Search platforms…"
                  className="pl-8 h-8 text-sm"
                  autoFocus
                />
                {platformSearch && (
                  <button
                    type="button"
                    onClick={() => setPlatformSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Selected chips */}
              {selectedPlatformIds.size > 0 && (
                <div className="flex flex-wrap gap-1 p-2 rounded-lg bg-muted/40 border min-h-[36px]">
                  {[...selectedPlatformIds].map((pid) => {
                    const p = allPlatforms.find((x) => x.id === pid);
                    return (
                      <span
                        key={pid}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 px-2 py-0.5 text-[11px] font-medium"
                      >
                        <PlatformIcon platformId={pid} size={11} />
                        {p?.name ?? pid}
                        <button
                          type="button"
                          onClick={() => togglePlatform(pid)}
                          className="ml-0.5 text-muted-foreground hover:text-foreground"
                        >
                          <X className="size-2.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Category grid */}
              <div className="max-h-80 overflow-y-auto space-y-3 pr-1 scrollbar-thin" id="platform-scroll-area">
                {filteredCategories.map((cat) => (
                  <div key={cat.id} ref={(el) => { categoryRefs.current[cat.id] = el; }}>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5 sticky top-0 bg-background py-0.5">
                      {cat.name}
                      <span className="ml-1.5 normal-case font-normal">({cat.platforms.length})</span>
                    </p>
                    <div className="grid grid-cols-3 gap-1">
                      {cat.platforms.map((p) => {
                        const selected = selectedPlatformIds.has(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => togglePlatform(p.id)}
                            title={`${p.name} · ${p.secret_count} keys`}
                            className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-all text-left ${
                              selected
                                ? "border-primary bg-primary/10 text-foreground font-medium"
                                : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                            }`}
                          >
                            <PlatformIcon platformId={p.id} size={13} />
                            <span className="truncate flex-1">{p.name}</span>
                            {selected && <Check className="size-3 text-primary shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {filteredCategories.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No platforms match your search</p>
                )}
              </div>

              {/* Summary */}
              <div className="flex items-center justify-between pt-1 border-t">
                <span className="text-xs text-muted-foreground">
                  {selectedPlatformIds.size > 0
                    ? `${selectedPlatformIds.size} selected · ${totalKeys} keys will be created`
                    : "No platforms selected"}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" type="button" onClick={() => setStep(1)}>
                    <ChevronLeft className="size-3.5" /> Back
                  </Button>
                  <Button size="sm" type="button" onClick={() => setStep(3)}>
                    Next →
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Project details ── */}
          {step === 3 && (
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              {/* Platform summary + preset keys toggle */}
              {selectedPlatformIds.size > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-muted/50 border">
                    {[...selectedPlatformIds].map((pid) => {
                      const p = allPlatforms.find((x) => x.id === pid);
                      return (
                        <span key={pid} className="inline-flex items-center gap-1 text-xs bg-background border rounded-full px-2 py-0.5">
                          <PlatformIcon platformId={pid} size={12} />
                          {p?.name ?? pid}
                        </span>
                      );
                    })}
                    <span className="text-xs text-muted-foreground self-center ml-1">
                      → {totalKeys} keys
                    </span>
                  </div>
                  <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={addPresetKeys}
                      onChange={(e) => setAddPresetKeys(e.target.checked)}
                      className="size-4 rounded accent-primary cursor-pointer"
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      Create preset keys for selected platforms
                    </span>
                  </label>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="my-app"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-desc">
                  Description <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="project-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this project do?"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setStep(selectedTemplate.id === "blank" ? 1 : 2)}
                >
                  <ChevronLeft className="size-3.5" /> Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  Create Project
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Page ── */}
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <motion.div variants={fadeUp} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">Organize secrets by project and environment</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="size-4" />
            New Project
          </Button>
        </motion.div>

        {projects.length === 0 ? (
          <motion.div variants={fadeUp} className="flex flex-col items-center justify-center py-28">
            <div className="size-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
              <FolderKey className="size-8 text-muted-foreground" />
            </div>
            <p className="text-base font-medium">No projects yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first project to get started</p>
            <Button onClick={() => setShowCreate(true)} className="mt-5">
              <Plus className="size-4" />
              Create Project
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="group">
                  <CardContent className="pt-0">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 cursor-pointer min-w-0 flex-1" onClick={() => openProject(project)}>
                        {(() => {
                          const pids = parsePlatforms(project.description);
                          return pids.length > 0 ? (
                            <div className="size-10 rounded-lg bg-muted border border-border flex items-center justify-center gap-0.5 shrink-0 flex-wrap p-1.5">
                              {pids.slice(0, 4).map((pid) => (
                                <PlatformIcon key={pid} platformId={pid} size={pids.length > 2 ? 10 : 14} />
                              ))}
                            </div>
                          ) : (
                            <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                              <FolderKey className="size-5 text-primary" />
                            </div>
                          );
                        })()}
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold truncate">{project.name}</h3>
                          {visibleDesc(project.description) && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {visibleDesc(project.description)}
                            </p>
                          )}
                        </div>
                      </div>
                      {project.is_global ? (
                        <span className="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5 shrink-0 select-none">
                          System
                        </span>
                      ) : (
                        <Button
                          variant="ghost" size="icon"
                          onClick={(e) => handleDelete(project.id, project.name, e)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>

                    {/* Environment Buttons */}
                    <div className="flex gap-2">
                      {(["development", "staging", "production"] as const).map((env) => {
                        const Icon = envIcons[env] || Globe;
                        return (
                          <Button
                            key={env} variant="outline" size="sm"
                            onClick={() => openProject(project, env)}
                            className={`flex-1 ${envColors[env]}`}
                          >
                            <Icon className="size-3.5" />
                            {env === "development" ? "Dev" : env === "production" ? "Prod" : "Staging"}
                          </Button>
                        );
                      })}
                    </div>

                    <p className="text-[11px] text-muted-foreground mt-3 font-mono">
                      Created {new Date(project.created_at * 1000).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Delete Project Confirmation */}
      <Dialog open={!!deleteProjectTarget} onOpenChange={() => {}}>
        <DialogContent
          showCloseButton={false}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={() => setDeleteProjectTarget(null)}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">{deleteProjectTarget?.name}</span>?
            This will permanently delete all secrets in every environment.
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <Button autoFocus variant="outline" onClick={() => setDeleteProjectTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteProject}>Delete Project</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
