import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useStore } from "../store";

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: "border-accent-500/30 bg-accent-500/5",
  error: "border-danger-500/30 bg-danger-500/5",
  warning: "border-warn-500/30 bg-warn-500/5",
  info: "border-blue-500/30 bg-blue-500/5",
};

const iconStyles = {
  success: "text-accent-500",
  error: "text-danger-400",
  warning: "text-warn-400",
  info: "text-blue-400",
};

export default function ToastContainer() {
  const { toasts, removeToast } = useStore();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: { id: string; type: "success" | "error" | "warning" | "info"; title: string; message?: string; duration?: number };
  onDismiss: () => void;
}) {
  const Icon = icons[toast.type];

  useEffect(() => {
    const timer = setTimeout(onDismiss, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [onDismiss, toast.duration]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`pointer-events-auto border rounded-xl p-3.5 shadow-lg shadow-black/20 backdrop-blur-sm ${styles[toast.type]}`}
    >
      <div className="flex items-start gap-2.5">
        <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${iconStyles[toast.type]}`} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-vault-100 leading-tight">
            {toast.title}
          </p>
          {toast.message && (
            <p className="text-[11px] text-vault-400 mt-0.5 leading-normal">
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="p-0.5 rounded text-vault-500 hover:text-vault-300 transition-colors flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
