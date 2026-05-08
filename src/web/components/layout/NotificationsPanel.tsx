import { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle, DollarSign, FileText, Music, User, X, Calendar } from "lucide-react";
import { api } from "../../lib/api";

const typeIcons: Record<string, any> = {
  lead: User,
  contract: FileText,
  payment: DollarSign,
  music: Music,
  event: CheckCircle,
  appointment: Calendar,
  info: Bell,
};

const typeColors: Record<string, string> = {
  lead: "#10B981",
  contract: "#7C3AED",
  payment: "#F59E0B",
  music: "#3B82F6",
  event: "#06B6D4",
  appointment: "#9D6FEF",
  info: "#64748B",
};

function timeAgo(createdAt: string) {
  const ms = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NotificationsPanel({ open, onClose }: Props) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) load();
  }, [open]);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<any[]>("/notifications");
      // Sort newest first
      setNotifications(data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  const unread = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    try {
      await Promise.all(notifications.filter(n => !n.read).map(n => api.put(`/notifications/${n.id}`, { ...n, read: true })));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  const dismiss = async (id: string) => {
    try {
      await api.del(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="fixed z-50 w-96 shadow-2xl"
      style={{
        top: 64,
        right: 16,
        background: "#151820",
        border: "1px solid #252A3A",
        borderRadius: 16,
        maxHeight: "80vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #252A3A" }}>
        <div className="flex items-center gap-2">
          <Bell size={16} color="#7C3AED" />
          <span className="font-semibold text-white">Notifications</span>
          {unread > 0 && (
            <span className="text-xs font-bold rounded-full px-1.5 py-0.5" style={{ background: "#7C3AED", color: "white" }}>
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs cursor-pointer" style={{ color: "#7C3AED" }}>
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="cursor-pointer">
            <X size={16} color="#475569" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-5 h-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell size={32} color="#252A3A" className="mx-auto mb-2" />
            <p className="text-sm" style={{ color: "#475569" }}>All caught up!</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const Icon = typeIcons[notif.type] || Bell;
            return (
              <div
                key={notif.id}
                className="flex items-start gap-3 px-5 py-4 relative transition-colors cursor-pointer group"
                style={{
                  background: notif.read ? "transparent" : "rgba(124,58,237,0.04)",
                  borderBottom: "1px solid #1C2030",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1C2030")}
                onMouseLeave={(e) => (e.currentTarget.style.background = notif.read ? "transparent" : "rgba(124,58,237,0.04)")}
                onClick={async () => {
                  if (!notif.read) {
                    try { await api.put(`/notifications/${notif.id}`, { ...notif, read: true }); } catch {}
                    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                  }
                }}
              >
                <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 36, height: 36, background: `${typeColors[notif.type] || "#64748B"}15` }}>
                  <Icon size={16} color={typeColors[notif.type] || "#64748B"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{notif.title}</p>
                    {!notif.read && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#7C3AED" }} />}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{notif.message}</p>
                  {notif.createdAt && <p className="text-xs mt-1" style={{ color: "#475569" }}>{timeAgo(notif.createdAt)}</p>}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                  className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                >
                  <X size={12} color="#475569" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
