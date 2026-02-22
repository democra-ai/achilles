import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderKey,
  Plus,
  Trash2,
  X,
  Loader2,
  ChevronRight,
  Globe,
  TestTube,
  Rocket,
  Layers,
} from "lucide-react";
import { useStore } from "../store";
import { projectsApi } from "../api/client";
import { useNavigate } from "react-router-dom";
import type { Project } from "../types";

const envIcons: Record<string, typeof Globe> = {
  development: TestTube,
  staging: Globe,
  production: Rocket,
};

const envStyles: Record<string, { hover: string; badge: string }> = {
  development: {
    hover: "hover:border-blue-500/20 hover:text-blue-400 hover:bg-blue-500/[0.04]",
    badge: "badge-blue",
  },
  staging: {
    hover: "hover:border-warn-500/20 hover:text-warn-400 hover:bg-warn-500/[0.04]",
    badge: "badge-amber",
  },
  production: {
    hover: "hover:border-accent-500/20 hover:text-accent-400 hover:bg-accent-500/[0.04]",
    badge: "badge-green",
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
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

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  return (
    <>
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
                  New Project
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
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-premium w-full"
                    placeholder="my-app"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-vault-400 mb-2 uppercase tracking-[0.1em]">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-premium w-full"
                    placeholder="Optional description"
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
                      Create Project
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
    </AnimatePresence>

    <motion.div initial="hidden" animate="show" variants={stagger}>
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex items-center justify-between mb-10"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent-500/10 border border-accent-500/15 flex items-center justify-center">
              <Layers className="w-4 h-4 text-accent-400" />
            </div>
            <h1 className="font-display text-[28px] font-bold text-vault-50 tracking-tight">
              Projects
            </h1>
          </div>
          <p className="text-[14px] text-vault-400 ml-11">
            Organize secrets by project and environment
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-semibold text-[14px] rounded-xl transition-all duration-200 shadow-lg shadow-accent-500/20"
        >
          <Plus className="w-4 h-4" />
          New Project
        </motion.button>
      </motion.div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center justify-center py-24 text-vault-500"
        >
          <div className="w-20 h-20 rounded-3xl glass-card flex items-center justify-center mb-5">
            <FolderKey className="w-9 h-9 text-vault-500 opacity-40" />
          </div>
          <p className="text-[16px] font-medium text-vault-300 font-display">
            No projects yet
          </p>
          <p className="text-[13px] text-vault-500 mt-1.5">
            Create your first project to get started
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreate(true)}
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold text-[14px] rounded-xl shadow-lg shadow-accent-500/20"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </motion.button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const }}
              className="glass-card rounded-2xl p-5 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="flex items-center gap-3.5 cursor-pointer min-w-0 flex-1"
                  onClick={() => openProject(project)}
                >
                  <div className="w-11 h-11 rounded-xl bg-accent-500/10 border border-accent-500/15 flex items-center justify-center flex-shrink-0">
                    <FolderKey className="w-5 h-5 text-accent-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold text-vault-50 leading-tight truncate font-display">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-[13px] text-vault-400 mt-0.5 leading-tight truncate">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(project.id, e)}
                  className="p-2 rounded-lg text-vault-500 hover:text-danger-400 hover:bg-danger-500/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Environment Buttons */}
              <div className="flex gap-2">
                {(["development", "staging", "production"] as const).map(
                  (env) => {
                    const Icon = envIcons[env] || Globe;
                    const style = envStyles[env];
                    return (
                      <button
                        key={env}
                        onClick={() => openProject(project, env)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl glass-subtle transition-all duration-200 text-[12px] font-medium text-vault-400 group/env ${style.hover}`}
                      >
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>
                          {env === "development"
                            ? "Dev"
                            : env === "production"
                              ? "Prod"
                              : "Staging"}
                        </span>
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover/env:opacity-100 transition-opacity flex-shrink-0" />
                      </button>
                    );
                  }
                )}
              </div>

              <p className="text-[11px] text-vault-500 mt-3.5 font-mono">
                Created{" "}
                {new Date(project.created_at * 1000).toLocaleDateString()}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
    </>
  );
}
