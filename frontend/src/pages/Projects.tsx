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

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Projects() {
  const { projects, setProjects, selectProject, selectEnv } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    projectsApi.list().then((r) => setProjects(r.data)).catch(() => {});
  }, [setProjects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await projectsApi.create(name, description);
      const { data } = await projectsApi.list();
      setProjects(data);
      setShowCreate(false);
      setName("");
      setDescription("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this project and all its secrets?")) return;
    try {
      await projectsApi.delete(id);
      const { data } = await projectsApi.list();
      setProjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  const openProject = (project: Project, env: string = "development") => {
    selectProject(project);
    selectEnv(env);
    navigate("/secrets");
  };

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-vault-50 tracking-tight">
            Projects
          </h1>
          <p className="text-sm text-vault-400 mt-1">
            Organize secrets by project and environment
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-vault-950 font-semibold text-sm rounded-xl transition-all glow-accent"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </motion.div>

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
                  New Project
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
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-vault-800 border border-vault-600/50 rounded-xl text-vault-50 placeholder-vault-500 focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all text-sm"
                    placeholder="my-app"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-vault-300 mb-1.5 uppercase tracking-wider">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-vault-800 border border-vault-600/50 rounded-xl text-vault-50 placeholder-vault-500 focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all text-sm"
                    placeholder="Optional description"
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
                      Create Project
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center justify-center py-20 text-vault-500"
        >
          <div className="w-16 h-16 rounded-2xl bg-vault-800 flex items-center justify-center mb-4">
            <FolderKey className="w-8 h-8 opacity-40" />
          </div>
          <p className="text-sm font-medium">No projects yet</p>
          <p className="text-xs text-vault-500 mt-1">
            Create your first project to get started
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <motion.div
              key={project.id}
              variants={fadeUp}
              className="bg-vault-900 border border-vault-700/50 rounded-xl p-5 hover:border-vault-600 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => openProject(project)}
                >
                  <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center">
                    <FolderKey className="w-5 h-5 text-accent-500" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-vault-50">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-xs text-vault-400 mt-0.5">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(project.id, e)}
                  className="text-vault-500 hover:text-danger-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Environment Buttons */}
              <div className="flex gap-2">
                {["development", "staging", "production"].map((env) => {
                  const Icon = envIcons[env] || Globe;
                  return (
                    <button
                      key={env}
                      onClick={() => openProject(project, env)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-vault-800 hover:bg-vault-700 border border-vault-700/50 hover:border-vault-600 transition-all text-xs text-vault-300 hover:text-vault-100 group/env"
                    >
                      <Icon className="w-3 h-3" />
                      <span className="capitalize">
                        {env === "development" ? "dev" : env === "production" ? "prod" : env}
                      </span>
                      <ChevronRight className="w-3 h-3 opacity-0 -ml-1 group-hover/env:opacity-100 group-hover/env:ml-0 transition-all" />
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] text-vault-500 mt-3 font-mono">
                Created {new Date(project.created_at).toLocaleDateString()}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
