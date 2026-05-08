// Simple toast store
type ToastType = "success" | "error" | "info";
type Toast = { id: string; message: string; type: ToastType };
type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
const listeners: Listener[] = [];

const emit = () => listeners.forEach(l => l([...toasts]));

export const toast = {
  show(message: string, type: ToastType = "info") {
    const id = Math.random().toString(36).slice(2);
    toasts = [...toasts, { id, message, type }];
    emit();
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
      emit();
    }, 3500);
  },
  success: (msg: string) => toast.show(msg, "success"),
  error: (msg: string) => toast.show(msg, "error"),
  info: (msg: string) => toast.show(msg, "info"),
  subscribe: (fn: Listener) => {
    listeners.push(fn);
    return () => { const i = listeners.indexOf(fn); if (i > -1) listeners.splice(i, 1); };
  },
};
