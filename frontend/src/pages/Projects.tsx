import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FolderKey,
  Plus,
  Trash2,
  Loader2,
  Globe,
  TestTube,
  Rocket,
} from "lucide-react";
import { useStore } from "@/store";
import { projectsApi } from "@/api/client";
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

export default function Projects() {
  const {
    projects,
    setProjects,
    selectProject,
    selectEnv,
    serverStatus,
    addToast,
  } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!serverStatus.running) return;
    projectsApi
      .list()
      .then((r) => setProjects(r.data))
      .catch(() => {});
  }, [setProjects, serverStatus.running]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverStatus.running) {
      addToast({
        type: "error",
        title: "Server offline",
        message: "Start the server before creating projects",
      });
      return;
    }
    setLoading(true);
    try {
      await projectsApi.create(name, description);
      const { data } = await projectsApi.list();
      setProjects(data);
      setShowCreate(false);
      setName("");
      setDescription("");
      addToast({
        type: "success",
        title: "Project created",
        message: `"${name}" is ready to use`,
      });
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this project and all its secrets?")) return;
    try {
      await projectsApi.delete(id);
      const { data } = await projectsApi.list();
      setProjects(data);
      addToast({ type: "success", title: "Project deleted" });
    } catch {
      // handled by interceptor
    }
  };

  const openProject = (project: Project, env: string = "development") => {
    selectProject(project);
    selectEnv(env);
    navigate("/secrets");
  };

  return (
    <>
      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
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
              <Label htmlFor="project-desc">Description</Label>
              <Input
                id="project-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Create Project
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <motion.div variants={stagger} initial="hidden" animate="visible">
        {/* Header */}
        <motion.div
          variants={fadeUp}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Organize secrets by project and environment
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="size-4" />
            New Project
          </Button>
        </motion.div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <motion.div
            variants={fadeUp}
            className="flex flex-col items-center justify-center py-28"
          >
            <div className="size-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
              <FolderKey className="size-8 text-muted-foreground" />
            </div>
            <p className="text-base font-medium">No projects yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first project to get started
            </p>
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
                transition={{
                  delay: 0.1 + i * 0.06,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Card className="group">
                  <CardContent className="pt-0">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                        onClick={() => openProject(project)}
                      >
                        <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <FolderKey className="size-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold truncate">
                            {project.name}
                          </h3>
                          {project.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(project.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    {/* Environment Buttons */}
                    <div className="flex gap-2">
                      {(
                        ["development", "staging", "production"] as const
                      ).map((env) => {
                        const Icon = envIcons[env] || Globe;
                        return (
                          <Button
                            key={env}
                            variant="outline"
                            size="sm"
                            onClick={() => openProject(project, env)}
                            className={`flex-1 ${envColors[env]}`}
                          >
                            <Icon className="size-3.5" />
                            {env === "development"
                              ? "Dev"
                              : env === "production"
                                ? "Prod"
                                : "Staging"}
                          </Button>
                        );
                      })}
                    </div>

                    <p className="text-[11px] text-muted-foreground mt-3 font-mono">
                      Created{" "}
                      {new Date(
                        project.created_at * 1000
                      ).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </>
  );
}
