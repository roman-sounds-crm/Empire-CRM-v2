import { useEffect, useState } from "react";
import { toast } from "../../lib/toast";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};
const colors = {
  success: { text: "#10B981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
  error:   { text: "#EF4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.25)" },
  info:    { text: "#9D6FEF", bg: "rgba(124,58,237,0.12)", border: "rgba(124,58,237,0.25)" },
};

export default function Toaster() {
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success"|"error"|"info" }[]>([]);

  useEffect(() => toast.subscribe(setToasts), []);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2" style={{ minWidth: 300 }}>
      {toasts.map(t => {
        const Icon = icons[t.type];
        const c = colors[t.type];
        return (
          <div
            key={t.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-fade-in-up"
            style={{ background: c.bg, border: `1px solid ${c.border}`, backdropFilter: "blur(12px)" }}
          >
            <Icon size={16} color={c.text} />
            <span className="text-sm font-medium flex-1" style={{ color: "#F1F5F9" }}>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
