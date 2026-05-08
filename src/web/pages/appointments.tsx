import { useState, useEffect } from "react";
import Layout from "../components/layout/Layout";
import { api } from "../lib/api";

import { Clock, Video, Phone, MapPin, Plus, Pencil, Trash2, X, ExternalLink, CheckCircle, Calendar } from "lucide-react";
import { toast } from "../lib/toast";

type Appointment = {
  id: string;
  title: string;
  client: string;
  date: string;
  time: string;
  duration?: string;
  type?: string;
  status: string;
  meetingLink?: string;
  createdAt?: string;
};

const typeIcons: Record<string, any> = {
  Zoom: Video,
  "Google Meet": Video,
  "Microsoft Teams": Video,
  Phone: Phone,
  "In-Person": MapPin,
};

const typeColors: Record<string, string> = {
  Zoom: "#3B82F6",
  "Google Meet": "#10B981",
  "Microsoft Teams": "#6366F1",
  Phone: "#F59E0B",
  "In-Person": "#EF4444",
};

const TYPES = ["Zoom", "Google Meet", "Microsoft Teams", "Phone", "In-Person"];
const DURATIONS = ["15 min", "30 min", "45 min", "1 hour", "1.5 hours", "2 hours"];

const blank = (): Partial<Appointment> => ({
  title: "",
  client: "",
  date: "",
  time: "",
  duration: "30 min",
  type: "Zoom",
  status: "upcoming",
  meetingLink: "",
});

export default function Appointments() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState<Partial<Appointment>>(blank());
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed" | "cancelled">("all");
  

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<Appointment[]>("/appointments");
      setItems(data);
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(blank());
    setModal(true);
  };

  const openEdit = (a: Appointment) => {
    setEditing(a);
    setForm({ ...a });
    setModal(true);
  };

  const closeModal = () => { setModal(false); setEditing(null); setForm(blank()); };

  const save = async () => {
    if (!form.title || !form.client || !form.date || !form.time) {
      toast.error("Title, client, date, and time are required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const updated = await api.put<Appointment>(`/appointments/${editing.id}`, form);
        setItems(prev => prev.map(a => a.id === editing.id ? updated : a));
        toast.success("Appointment updated");
      } else {
        const created = await api.post<Appointment>("/appointments", form);
        setItems(prev => [...prev, created]);
        toast.success("Appointment created");
      }
      closeModal();
    } catch {
      toast.error("Failed to save appointment");
    } finally {
      setSaving(false);
    }
  };

  const markComplete = async (a: Appointment) => {
    try {
      const updated = await api.put<Appointment>(`/appointments/${a.id}`, { ...a, status: "completed" });
      setItems(prev => prev.map(x => x.id === a.id ? updated : x));
      toast.success("Marked as completed");
    } catch {
      toast.error("Failed to update");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this appointment?")) return;
    try {
      await api.del(`/appointments/${id}`);
      setItems(prev => prev.filter(a => a.id !== id));
      toast.success("Appointment deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const filtered = filter === "all" ? items : items.filter(a => a.status === filter);
  const upcoming = items.filter(a => a.status === "upcoming").length;
  const completed = items.filter(a => a.status === "completed").length;

  return (
    <Layout
      title="Appointments"
      subtitle="Scheduler with Zoom, Google Meet, and Teams integration"
      action={{ label: "New Appointment", onClick: openNew }}
    >
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total", value: items.length, color: "#7C3AED" },
          { label: "Upcoming", value: upcoming, color: "#3B82F6" },
          { label: "Completed", value: completed, color: "#10B981" },
        ].map(s => (
          <div key={s.label} className="empire-card p-4">
            <p className="text-xs" style={{ color: "#64748B" }}>{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "upcoming", "completed", "cancelled"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize"
            style={{
              background: filter === f ? "#7C3AED" : "#1E293B",
              color: filter === f ? "#fff" : "#94A3B8",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20" style={{ color: "#475569" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="empire-card p-12 text-center">
          <Calendar size={40} style={{ color: "#334155", margin: "0 auto 12px" }} />
          <p style={{ color: "#475569" }}>No appointments yet.</p>
          <button
            onClick={openNew}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "#7C3AED", color: "#fff" }}
          >
            Schedule one
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered
            .slice()
            .sort((a, b) => `${a.date}${a.time}` < `${b.date}${b.time}` ? -1 : 1)
            .map(appt => {
              const Icon = typeIcons[appt.type || ""] || Clock;
              const color = typeColors[appt.type || ""] || "#7C3AED";
              return (
                <div
                  key={appt.id}
                  className="empire-card p-5 flex items-center gap-4 hover:scale-[1.003] transition-all"
                >
                  <div
                    className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ width: 48, height: 48, background: `${color}1A` }}
                  >
                    <Icon size={22} color={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white">{appt.title}</h3>
                    <p className="text-sm mt-0.5" style={{ color: "#94A3B8" }}>{appt.client}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs flex items-center gap-1" style={{ color: "#475569" }}>
                        <Clock size={11} /> {appt.date} · {appt.time}
                      </span>
                      {appt.duration && (
                        <span className="text-xs" style={{ color: "#475569" }}>{appt.duration}</span>
                      )}
                      {appt.type && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}1A`, color }}>
                          {appt.type}
                        </span>
                      )}
                      <span
                        className="text-xs px-2 py-0.5 rounded-full capitalize"
                        style={{
                          background: appt.status === "completed" ? "#10B9811A" : appt.status === "cancelled" ? "#EF44441A" : "#3B82F61A",
                          color: appt.status === "completed" ? "#10B981" : appt.status === "cancelled" ? "#EF4444" : "#3B82F6",
                        }}
                      >
                        {appt.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {appt.meetingLink && (
                      <a
                        href={appt.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg transition-colors hover:opacity-80"
                        style={{ background: "#1E293B", color: "#3B82F6" }}
                        title="Join meeting"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    {appt.status === "upcoming" && (
                      <button
                        onClick={() => markComplete(appt)}
                        className="p-2 rounded-lg transition-colors hover:opacity-80"
                        style={{ background: "#10B9811A", color: "#10B981" }}
                        title="Mark complete"
                      >
                        <CheckCircle size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(appt)}
                      className="p-2 rounded-lg transition-colors hover:opacity-80"
                      style={{ background: "#1E293B", color: "#94A3B8" }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => remove(appt.id)}
                      className="p-2 rounded-lg transition-colors hover:opacity-80"
                      style={{ background: "#EF44441A", color: "#EF4444" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="empire-card w-full max-w-lg mx-4 p-6 relative my-8">
            <button onClick={closeModal} className="absolute top-4 right-4" style={{ color: "#475569" }}>
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold text-white mb-5">{editing ? "Edit Appointment" : "New Appointment"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#94A3B8" }}>Title *</label>
                <input
                  className="w-full px-3 py-2 rounded-lg text-sm text-white"
                  style={{ background: "#1E293B", border: "1px solid #334155" }}
                  value={form.title || ""}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Consultation Call"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#94A3B8" }}>Client *</label>
                <input
                  className="w-full px-3 py-2 rounded-lg text-sm text-white"
                  style={{ background: "#1E293B", border: "1px solid #334155" }}
                  value={form.client || ""}
                  onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
                  placeholder="Client name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#94A3B8" }}>Date *</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white"
                    style={{ background: "#1E293B", border: "1px solid #334155" }}
                    value={form.date || ""}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#94A3B8" }}>Time *</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white"
                    style={{ background: "#1E293B", border: "1px solid #334155" }}
                    value={form.time || ""}
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#94A3B8" }}>Type</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg text-sm text-white"
                    style={{ background: "#1E293B", border: "1px solid #334155" }}
                    value={form.type || "Zoom"}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  >
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#94A3B8" }}>Duration</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg text-sm text-white"
                    style={{ background: "#1E293B", border: "1px solid #334155" }}
                    value={form.duration || "30 min"}
                    onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                  >
                    {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#94A3B8" }}>Status</label>
                <select
                  className="w-full px-3 py-2 rounded-lg text-sm text-white"
                  style={{ background: "#1E293B", border: "1px solid #334155" }}
                  value={form.status || "upcoming"}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#94A3B8" }}>Meeting Link</label>
                <input
                  className="w-full px-3 py-2 rounded-lg text-sm text-white"
                  style={{ background: "#1E293B", border: "1px solid #334155" }}
                  value={form.meetingLink || ""}
                  onChange={e => setForm(f => ({ ...f, meetingLink: e.target.value }))}
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: "#1E293B", color: "#94A3B8" }}
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "#7C3AED", color: "#fff", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Saving..." : editing ? "Save Changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
