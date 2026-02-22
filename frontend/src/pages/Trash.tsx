import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Trash2,
  RotateCcw,
  X,
  KeyRound,
  Key,
  Terminal,
  Shield,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useStore } from "@/store";
import { trashApi, type TrashItem } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const categoryIcons: Record<string, typeof KeyRound> = {
  secret: KeyRound,
  api_key: Key,
  env_var: Terminal,
  token: Shield,
};

const categoryLabels: Record<string, string> = {
  secret: "Secret",
  api_key: "API Key",
  env_var: "Env Var",
  token: "Token",
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

function daysUntilPurge(deletedAt: number): number {
  const deletedMs = deletedAt * 1000;
  const purgeMs = deletedMs + 30 * 86400 * 1000;
  const remaining = purgeMs - Date.now();
  return Math.max(0, Math.ceil(remaining / (86400 * 1000)));
}

export default function Trash() {
  const { addToast } = useStore();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTrash = useCallback(async () => {
    try {
      const { data } = await trashApi.list();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  const handleRestore = async (item: TrashItem) => {
    try {
      await trashApi.restore(item.id);
      await loadTrash();
      addToast({
        type: "success",
        title: "Restored",
        message: `${item.key} has been restored`,
      });
    } catch {
      // handled by interceptor
    }
  };

  const handlePurge = async (item: TrashItem) => {
    if (!confirm(`Permanently delete "${item.key}"? This cannot be undone.`))
      return;
    try {
      await trashApi.purge(item.id);
      await loadTrash();
      addToast({
        type: "success",
        title: "Deleted permanently",
        message: `${item.key} has been permanently removed`,
      });
    } catch {
      // handled by interceptor
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm("Permanently delete all items in trash? This cannot be undone."))
      return;
    try {
      await trashApi.empty();
      await loadTrash();
      addToast({
        type: "success",
        title: "Trash emptied",
        message: "All items have been permanently deleted",
      });
    } catch {
      // handled by interceptor
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trash</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Deleted items are kept for 30 days before permanent removal
          </p>
        </div>
        {items.length > 0 && (
          <Button variant="destructive" onClick={handleEmptyTrash}>
            <Trash2 className="size-4" />
            Empty Trash
          </Button>
        )}
      </motion.div>

      {/* List */}
      {loading ? (
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center justify-center py-28"
        >
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </motion.div>
      ) : items.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center justify-center py-28"
        >
          <div className="size-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
            <Trash2 className="size-8 text-muted-foreground" />
          </div>
          <p className="text-base font-medium">Trash is empty</p>
          <p className="text-sm text-muted-foreground mt-1">
            Deleted items will appear here
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => {
            const CatIcon = categoryIcons[item.category] || AlertCircle;
            const days = daysUntilPurge(item.deleted_at);
            return (
              <motion.div
                key={item.id}
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
                          <CatIcon className="size-4 text-muted-foreground" />
                          <code className="font-mono text-sm font-semibold">
                            {item.key}
                          </code>
                          <Badge variant="secondary">
                            {categoryLabels[item.category] || item.category}
                          </Badge>
                          <Badge variant="outline">v{item.version}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span>{item.project_name} / {item.env_name}</span>
                          <span className={days <= 7 ? "text-destructive font-medium" : ""}>
                            {days} days remaining
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRestore(item)}
                            >
                              <RotateCcw className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Restore</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePurge(item)}
                              className="hover:text-destructive"
                            >
                              <X className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete permanently</TooltipContent>
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
    </motion.div>
  );
}
