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
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

export default function Projects() {
  const { projects, setProjects, selectProject, selectEnv } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    projectsApi
      .list()
      .then((r) => setProjects(r.data))
      .catch(() => {});
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
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.04 } } }}
    >
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="font-display text-xl font-bold text-vault-50 tracking-tight leading-tight">
            Projects
          </h1>
          <p className="text-sm text-vault-400 mt-1 leading-normal">
            Organize secrets by project and environment
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-vault-950 font-semibold text-[13px] rounded-lg transition-colors"
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
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="bg-vault-900 border border-vault-700/50 rounded-xl p-5 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-base font-semibold text-vault-50 leading-tight">
                  New Project
                </h2>
                <button
                  onClick={() => setShowCreate(false)}
                  className="p-1 rounded-md text-vault-400 hover:text-vault-200 hover:bg-vault-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-vault-300 mb-1.5 uppercase tracking-wider leading-tight">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-vault-800 border border-vault-600/40 rounded-lg text-vault-50 placeholder-vault-500 focus:border-accent-500/50 transition-colors text-[13px]"
                    placeholder="my-app"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-vault-300 mb-1.5 uppercase tracking-wider leading-tight">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2.5 bg-vault-800 border border-vault-600/40 rounded-lg text-vault-50 placeholder-vault-500 focus:border-accent-500/50 transition-colors text-[13px]"
                    placeholder="Optional description"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-accent-500 hover:bg-accent-600 text-vault-950 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-[13px] disabled:opacity-50"
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
          className="flex flex-col items-center justify-center py-16 text-vault-500"
        >
          <div className="w-14 h-14 rounded-xl bg-vault-800/80 flex items-center justify-center mb-3">
            <FolderKey className="w-7 h-7 opacity-30" />
          </div>
          <p className="text-[13px] font-medium text-vault-300">
            No projects yet
          </p>
          <p className="text-[11px] text-vault-500 mt-1">
            Create your first project to get started
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projects.map((project) => (
            <motion.div
              key={project.id}
              variants={fadeUp}
              className="bg-vault-900 border border-vault-700/40 rounded-xl p-4 hover:border-vault-600/60 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                  onClick={() => openProject(project)}
                >
                  <div className="w-9 h-9 rounded-lg bg-accent-500/10 flex items-center justify-center flex-shrink-0">
                    <FolderKey className="w-[18px] h-[18px] text-accent-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-semibold text-vault-50 leading-tight truncate">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-[11px] text-vault-400 mt-0.5 leading-tight truncate">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(project.id, e)}
                  className="p-1.5 rounded-md text-vault-500 hover:text-danger-400 hover:bg-danger-500/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Environment Buttons */}
              <div className="flex gap-1.5">
                {["development", "staging", "production"].map((env) => {
                  const Icon = envIcons[env] || Globe;
                  return (
                    <button
                      key={env}
                      onClick={() => openProject(project, env)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-vault-800/60 hover:bg-vault-800 border border-vault-700/30 hover:border-vault-600/50 transition-all duration-150 text-[11px] text-vault-300 hover:text-vault-100 group/env"
                    >
                      <Icon className="w-3 h-3 flex-shrink-0" />
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
                })}
              </div>

              <p className="text-[10px] text-vault-500 mt-2.5 font-mono leading-tight">
                Created {new Date(project.created_at).toLocaleDateString()}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
