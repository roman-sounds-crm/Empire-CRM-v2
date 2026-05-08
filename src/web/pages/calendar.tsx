import { useState, useEffect } from "react";
import Layout from "../components/layout/Layout";
import { api } from "../lib/api";

import { ChevronLeft, ChevronRight, X, Plus, Clock, MapPin, Trash2 } from "lucide-react";
import { toast } from "../lib/toast";

type Event = {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  venue: string;
  status: string;
  clientName: string;
  value: number;
};

type Appointment = {
  id: string;
  title: string;
  client: string;
  date: string;
  time: string;
  type?: string;
  status: string;
};

type CalEntry = {
  kind: "event" | "appointment";
  id: string;
  title: string;
  subtitle: string;
  time: string;
  color: string;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const eventColors: Record<string, string> = {
  Wedding: "#7C3AED",
  Corporate: "#3B82F6",
  Birthday: "#F59E0B",
  "Club Night": "#EF4444",
  Anniversary: "#10B981",
  Residency: "#F97316",
  University: "#06B6D4",
};

const apptColors: Record<string, string> = {
  Zoom: "#3B82F6",
  "Google Meet": "#10B981",
  Phone: "#F59E0B",
  "In-Person": "#EF4444",
  default: "#9D6FEF",
};

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dayModal, setDayModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [addType, setAddType] = useState<"event" | "appointment">("appointment");
  const [addForm, setAddForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function deleteEntry(entry: CalEntry) {
    if (!confirm(`Delete "${entry.title}"?`)) return;
    setDeletingId(entry.id);
    try {
      if (entry.kind === "appointment") {
        await api.del(`/appointments/${entry.id}`);
        setAppointments(prev => prev.filter(a => a.id !== entry.id));
      } else {
        await api.del(`/events/${entry.id}`);
        setEvents(prev => prev.filter(e => e.id !== entry.id));
      }
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }
  

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const load = async () => {
    setLoading(true);
    try {
      const [evts, appts] = await Promise.all([
        api.get<Event[]>("/events"),
        api.get<Appointment[]>("/appointments"),
      ]);
      setEvents(evts);
      setAppointments(appts);
    } catch {
      toast.error("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEntriesForDay = (day: number): CalEntry[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const evtEntries: CalEntry[] = events
      .filter(e => e.date === dateStr)
      .map(e => ({
        kind: "event",
        id: e.id,
        title: e.title,
        subtitle: e.venue,
        time: e.time,
        color: eventColors[e.type] || "#7C3AED",
      }));
    const apptEntries: CalEntry[] = appointments
      .filter(a => a.date === dateStr && a.status !== "cancelled")
      .map(a => ({
        kind: "appointment",
        id: a.id,
        title: a.title,
        subtitle: a.client,
        time: a.time,
        color: apptColors[a.type || ""] || apptColors.default,
      }));
    return [...evtEntries, ...apptEntries].sort((a, b) => a.time < b.time ? -1 : 1);
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: { day: number; current: boolean }[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: prevMonthDays - firstDay + i + 1, current: false });
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, current: true });
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) cells.push({ day: i, current: false });

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const openDay = (day: number, current: boolean) => {
    if (!current) return;
    setSelectedDay(day);
    setDayModal(true);
  };

  const openAdd = () => {
    const dateStr = selectedDay
      ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
      : "";
    setAddForm({ date: dateStr, time: "10:00", status: "upcoming", type: "Zoom" });
    setAddType("appointment");
    setAddModal(true);
  };

  const saveAdd = async () => {
    if (!addForm.date) { toast.error("Date required"); return; }
    setSaving(true);
    try {
      if (addType === "appointment") {
        if (!addForm.title || !addForm.client) { toast.error("Title and client required"); setSaving(false); return; }
        const created = await api.post<Appointment>("/appointments", addForm);
        setAppointments(prev => [...prev, created]);
      } else {
        if (!addForm.title || !addForm.clientName || !addForm.venue) {
          toast.error("Title, client, and venue required"); setSaving(false); return;
        }
        const created = await api.post<Event>("/events", {
          ...addForm,
          type: addForm.type || "Corporate",
          value: parseFloat(addForm.value || "0"),
          status: "pending",
        });
        setEvents(prev => [...prev, created]);
      }
      toast.success("Added to calendar");
      setAddModal(false);
      setAddForm({});
    } catch {
      toast.error("Failed to add entry");
    } finally {
      setSaving(false);
    }
  };

  const selectedDateStr = selectedDay
    ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    : "";
  const selectedEntries = selectedDay ? getEntriesForDay(selectedDay) : [];

  return (
    <Layout title="Calendar" subtitle="Events and appointments at a glance">
      <div className="flex gap-6">
        {/* Main calendar */}
        <div className="flex-1 empire-card p-5">
          {/* Nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:opacity-80" style={{ background: "#1E293B", color: "#94A3B8" }}>
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-lg font-bold text-white">{MONTHS[month]} {year}</h2>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:opacity-80" style={{ background: "#1E293B", color: "#94A3B8" }}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium py-1" style={{ color: "#475569" }}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="text-center py-16" style={{ color: "#475569" }}>Loading...</div>
          ) : (
            <div className="grid grid-cols-7 gap-px" style={{ background: "#1E293B" }}>
              {cells.map((cell, idx) => {
                const entries = cell.current ? getEntriesForDay(cell.day) : [];
                const today_ = cell.current && isToday(cell.day);
                return (
                  <div
                    key={idx}
                    onClick={() => openDay(cell.day, cell.current)}
                    className="min-h-[80px] p-1.5 transition-colors"
                    style={{
                      background: today_ ? "#7C3AED1A" : "#0F172A",
                      cursor: cell.current ? "pointer" : "default",
                      opacity: cell.current ? 1 : 0.3,
                    }}
                  >
                    <div
                      className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${today_ ? "text-white" : ""}`}
                      style={{
                        background: today_ ? "#7C3AED" : "transparent",
                        color: today_ ? "#fff" : cell.current ? "#94A3B8" : "#334155",
                      }}
                    >
                      {cell.day}
                    </div>
                    <div className="space-y-0.5">
                      {entries.slice(0, 2).map(e => (
                        <div
                          key={e.id}
                          className="text-xs px-1 py-0.5 rounded truncate"
                          style={{ background: `${e.color}22`, color: e.color, fontSize: 10 }}
                        >
                          {e.time} {e.title}
                        </div>
                      ))}
                      {entries.length > 2 && (
                        <div className="text-xs" style={{ color: "#475569", fontSize: 10 }}>+{entries.length - 2} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar: upcoming this month */}
        <div className="empire-card p-4 overflow-y-auto" style={{ width: 240, maxHeight: "calc(100vh - 140px)" }}>
          <h3 className="text-sm font-semibold text-white mb-3">This Month</h3>
          {loading ? (
            <p className="text-xs" style={{ color: "#475569" }}>Loading...</p>
          ) : (() => {
            const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
            const monthEvents = events.filter(e => e.date.startsWith(monthStr));
            const monthAppts = appointments.filter(a => a.date.startsWith(monthStr) && a.status !== "cancelled");
            const all = [
              ...monthEvents.map(e => ({ title: e.title, subtitle: e.venue, date: e.date, time: e.time, color: eventColors[e.type] || "#7C3AED", kind: "event" })),
              ...monthAppts.map(a => ({ title: a.title, subtitle: a.client, date: a.date, time: a.time, color: apptColors[a.type || ""] || apptColors.default, kind: "appointment" })),
            ].sort((a, b) => `${a.date}${a.time}` < `${b.date}${b.time}` ? -1 : 1);

            if (all.length === 0) return <p className="text-xs" style={{ color: "#475569" }}>Nothing scheduled</p>;
            return (
              <div className="space-y-2">
                {all.map((e, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: e.color }} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">{e.title}</p>
                      <p className="text-xs truncate" style={{ color: "#475569" }}>
                        {new Date(e.date).toLocaleDateString([], { month: "short", day: "numeric" })} · {e.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Day detail modal */}
      {dayModal && selectedDay && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="empire-card w-full max-w-md mx-4 p-6 relative">
            <button onClick={() => setDayModal(false)} className="absolute top-4 right-4" style={{ color: "#475569" }}>
              <X size={16} />
            </button>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">
                {MONTHS[month]} {selectedDay}, {year}
              </h2>
              <button
                onClick={openAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "#7C3AED", color: "#fff" }}
              >
                <Plus size={12} /> Add
              </button>
            </div>
            {selectedEntries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: "#475569" }}>Nothing scheduled</p>
                <button onClick={openAdd} className="mt-3 px-4 py-2 rounded-lg text-sm" style={{ background: "#7C3AED22", color: "#9D6FEF" }}>
                  Add entry
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedEntries.map(e => (
                  <div key={e.id} className="flex gap-3 p-3 rounded-lg items-start" style={{ background: "#1E293B" }}>
                    <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ background: e.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{e.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
                        <Clock size={10} className="inline mr-1" />{e.time}
                        {e.subtitle && <><MapPin size={10} className="inline mx-1" />{e.subtitle}</>}
                      </p>
                      <span className="text-xs capitalize" style={{ color: e.color }}>
                        {e.kind}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteEntry(e)}
                      disabled={deletingId === e.id}
                      className="flex-shrink-0 p-1 rounded opacity-50 hover:opacity-100 transition-opacity"
                      style={{ color: "#EF4444" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add entry modal */}
      {addModal && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto py-8" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="empire-card w-full max-w-md mx-4 p-6 relative">
            <button onClick={() => setAddModal(false)} className="absolute top-4 right-4" style={{ color: "#475569" }}>
              <X size={16} />
            </button>
            <h2 className="text-base font-bold text-white mb-4">Add to Calendar</h2>

            {/* Type toggle */}
            <div className="flex gap-2 mb-4">
              {(["appointment", "event"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setAddType(t)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium capitalize"
                  style={{
                    background: addType === t ? "#7C3AED" : "#1E293B",
                    color: addType === t ? "#fff" : "#94A3B8",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#94A3B8" }}>Title *</label>
                <input
                  className="w-full px-3 py-2 rounded-lg text-sm text-white"
                  style={{ background: "#1E293B", border: "1px solid #334155" }}
                  value={addForm.title || ""}
                  onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>

              {addType === "appointment" ? (
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#94A3B8" }}>Client *</label>
                  <input
                    className="w-full px-3 py-2 rounded-lg text-sm text-white"
                    style={{ background: "#1E293B", border: "1px solid #334155" }}
                    value={addForm.client || ""}
                    onChange={e => setAddForm(f => ({ ...f, client: e.target.value }))}
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#94A3B8" }}>Client Name *</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg text-sm text-white"
                      style={{ background: "#1E293B", border: "1px solid #334155" }}
                      value={addForm.clientName || ""}
                      onChange={e => setAddForm(f => ({ ...f, clientName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#94A3B8" }}>Venue *</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg text-sm text-white"
                      style={{ background: "#1E293B", border: "1px solid #334155" }}
                      value={addForm.venue || ""}
                      onChange={e => setAddForm(f => ({ ...f, venue: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#94A3B8" }}>Event Type</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg text-sm text-white"
                      style={{ background: "#1E293B", border: "1px solid #334155" }}
                      value={addForm.type || "Corporate"}
                      onChange={e => setAddForm(f => ({ ...f, type: e.target.value }))}
                    >
                      {["Wedding","Corporate","Birthday","Club Night","Anniversary","Residency","University"].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#94A3B8" }}>Value ($)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 rounded-lg text-sm text-white"
                      style={{ background: "#1E293B", border: "1px solid #334155" }}
                      value={addForm.value || ""}
                      onChange={e => setAddForm(f => ({ ...f, value: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#94A3B8" }}>Date *</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white"
                    style={{ background: "#1E293B", border: "1px solid #334155" }}
                    value={addForm.date || ""}
                    onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#94A3B8" }}>Time</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white"
                    style={{ background: "#1E293B", border: "1px solid #334155" }}
                    value={addForm.time || ""}
                    onChange={e => setAddForm(f => ({ ...f, time: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setAddModal(false)} className="flex-1 px-4 py-2 rounded-lg text-sm" style={{ background: "#1E293B", color: "#94A3B8" }}>Cancel</button>
              <button onClick={saveAdd} disabled={saving} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#7C3AED", color: "#fff", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
