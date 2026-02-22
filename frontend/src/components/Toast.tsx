import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useStore } from "@/store";

export function ToastBridge() {
  const { toasts, removeToast } = useStore();
  const shownRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const t of toasts) {
      if (shownRef.current.has(t.id)) continue;
      shownRef.current.add(t.id);

      const method =
        t.type === "success"
          ? toast.success
          : t.type === "error"
            ? toast.error
            : t.type === "warning"
              ? toast.warning
              : toast.info;

      method(t.title, {
        description: t.message,
        duration: t.duration || 4000,
        onDismiss: () => removeToast(t.id),
        onAutoClose: () => removeToast(t.id),
      });
    }
  }, [toasts, removeToast]);

  return null;
}
