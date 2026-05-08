import { useState, useEffect } from "react";
import Layout from "../components/layout/Layout";
import { api } from "../lib/api";
import { toast } from "../lib/toast";
import { Calendar, MapPin, DollarSign, FileText, CheckCircle, Clock, X, Plus, Edit2, Trash2, Loader2, ExternalLink, Mail, Users, Copy } from "lucide-react";

type Event = {
  id: string; title: string; type: string; date: string; time: string;
  venue: string; status: string; clientName: string; clientEmail?: string;
  clientPhone?: string; value: number; contractSigned: boolean; depositPaid: boolean; notes?: string;
};

const statusColors: Record<string, { text: string; bg: string }> = {
  confirmed: { text: "#10B981", bg: "rgba(16,185,129,0.1)" },
  pending:   { text: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  cancelled: { text: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};
const typeColors: Record<string, string> = {
  Wedding: "#7C3AED", Corporate: "#3B82F6", Birthday: "#F59E0B",
  "Club Night": "#EF4444", Anniversary: "#10B981", Residency: "#F97316", University: "#06B6D4",
};

const EVENT_TYPES = ["Wedding","Corporate","Birthday","Club Night","Anniversary","Residency","University","Private Party","Other"];

const EMPTY: Partial<Event> = { title:"", type:"Wedding", date:"", time:"", venue:"", status:"pending", clientName:"", clientEmail:"", clientPhone:"", value:0, notes:"", contractSigned:false, depositPaid:false };

function EventForm({ initial, onSave, onClose, loading }: {
  initial: Partial<Event>; onSave: (d: Partial<Event>) => void; onClose: () => void; loading: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <div className="empire-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white text-xl" style={{ fontFamily: "Syne, sans-serif" }}>
            {initial.id ? "Edit Event" : "New Event"}
          </h3>
          <button onClick={onClose}><X size={20} color="#94A3B8" /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label:"Event Title", key:"title", span:2 },
            { label:"Client Name", key:"clientName" },
            { label:"Client Email", key:"clientEmail", type:"email" },
            { label:"Client Phone", key:"clientPhone" },
            { label:"Venue", key:"venue" },
            { label:"Date", key:"date", type:"date" },
            { label:"Time", key:"time", type:"time" },
            { label:"Value ($)", key:"value", type:"number" },
          ].map(f => (
            <div key={f.key} className={f.span === 2 ? "col-span-2" : ""}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>{f.label}</label>
              <input
                type={f.type || "text"}
                value={(form as any)[f.key] || ""}
                onChange={e => set(f.key, f.type === "number" ? parseFloat(e.target.value)||0 : e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#F1F5F9" }}
                onFocus={e => (e.target.style.borderColor = "#7C3AED")}
                onBlur={e => (e.target.style.borderColor = "#252A3A")}
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Event Type</label>
            <select value={form.type} onChange={e => set("type", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#F1F5F9" }}>
              {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Status</label>
            <select value={form.status} onChange={e => set("status", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#F1F5F9" }}>
              {["pending","confirmed","cancelled"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Notes</label>
            <textarea value={form.notes||""} onChange={e => set("notes", e.target.value)} rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#F1F5F9" }} />
          </div>
          <div className="col-span-2 flex items-center gap-6">
            {[
              { key:"contractSigned", label:"Contract Signed" },
              { key:"depositPaid", label:"Deposit Paid" },
            ].map(cb => (
              <label key={cb.key} className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => set(cb.key, !(form as any)[cb.key])}
                  className="w-5 h-5 rounded flex items-center justify-center cursor-pointer"
                  style={{ background: (form as any)[cb.key] ? "#7C3AED" : "#1C2030", border: `1px solid ${(form as any)[cb.key] ? "#7C3AED" : "#252A3A"}` }}
                >
                  {(form as any)[cb.key] && <CheckCircle size={12} color="white" />}
                </div>
                <span className="text-sm" style={{ color: "#94A3B8" }}>{cb.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => onSave(form)} disabled={loading || !form.title || !form.clientName}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white cursor-pointer flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #7C3AED, #9D6FEF)", opacity: (!form.title || !form.clientName) ? 0.5 : 1 }}>
            {loading ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : (initial.id ? "Save Changes" : "Create Event")}
          </button>
          <button onClick={onClose} className="px-5 py-3 rounded-xl text-sm cursor-pointer"
            style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#94A3B8" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partial<Event> | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [detail, setDetail] = useState<Event | null>(null);

  const load = async () => {
    try {
      const data = await api.get<Event[]>("/events");
      setEvents(data);
    } catch { toast.error("Failed to load events"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (form: Partial<Event>) => {
    setSaving(true);
    try {
      if (form.id) {
        const updated = await api.put<Event>(`/events/${form.id}`, form);
        setEvents(ev => ev.map(e => e.id === updated.id ? updated : e));
        toast.success("Event updated");
      } else {
        const { nanoid } = await import("nanoid");
        const created = await api.post<Event>("/events", { ...form, id: nanoid() });
        setEvents(ev => [...ev, created]);
        toast.success("Event created");
      }
      setShowForm(false); setEditing(null);
    } catch { toast.error("Failed to save event"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.del(`/events/${id}`);
      setEvents(ev => ev.filter(e => e.id !== id));
      setDeleting(null); setDetail(null);
      toast.success("Event deleted");
    } catch { toast.error("Failed to delete event"); }
  };

  const filtered = filter === "all" ? events : events.filter(e => e.status === filter);

  return (
    <Layout title="Events" subtitle={`${events.length} total events`} action={{ label: "New Event", onClick: () => { setEditing(EMPTY); setShowForm(true); } }}>
      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        {["all","confirmed","pending","cancelled"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-lg text-sm font-medium capitalize cursor-pointer"
            style={{ background: filter===f ? "rgba(124,58,237,0.2)" : "#1C2030", border: `1px solid ${filter===f ? "#7C3AED" : "#252A3A"}`, color: filter===f ? "#9D6FEF" : "#94A3B8" }}>
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs" style={{ color: "#475569" }}>{filtered.length} events</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" color="#7C3AED" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empire-card p-16 text-center">
          <Calendar size={40} color="#252A3A" className="mx-auto mb-3" />
          <p className="font-semibold text-white mb-1">No events yet</p>
          <p className="text-sm mb-4" style={{ color: "#475569" }}>Create your first event to get started</p>
          <button onClick={() => { setEditing(EMPTY); setShowForm(true); }}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
            style={{ background: "linear-gradient(135deg, #7C3AED, #9D6FEF)" }}>
            <Plus size={14} className="inline mr-1" /> New Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(event => (
            <div key={event.id} className="empire-card p-4 cursor-pointer hover:scale-[1.01] transition-all group"
              style={{ borderLeft: `3px solid ${typeColors[event.type]||"#7C3AED"}` }}
              onClick={() => setDetail(event)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium rounded-full px-2 py-0.5" style={{ color: typeColors[event.type]||"#94A3B8", background: `${typeColors[event.type]||"#94A3B8"}1A` }}>{event.type}</span>
                  </div>
                  <h3 className="font-semibold text-white">{event.title}</h3>
                  <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{event.clientName}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-sm" style={{ color: "#F59E0B" }}>${event.value?.toLocaleString()}</p>
                  <span className="text-xs font-medium rounded-full px-2 py-0.5" style={{ color: statusColors[event.status]?.text, background: statusColors[event.status]?.bg }}>{event.status}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs mb-2" style={{ color: "#475569" }}>
                <span className="flex items-center gap-1"><Calendar size={11} />{event.date}</span>
                <span className="flex items-center gap-1"><Clock size={11} />{event.time}</span>
              </div>
              <p className="text-xs truncate flex items-center gap-1 mb-3" style={{ color: "#475569" }}><MapPin size={11} />{event.venue}</p>
              <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid #252A3A" }}>
                <div className="flex items-center gap-3">
                  <span className="text-xs flex items-center gap-1" style={{ color: event.contractSigned?"#10B981":"#475569" }}><FileText size={11} /> Contract {event.contractSigned?"✓":"–"}</span>
                  <span className="text-xs flex items-center gap-1" style={{ color: event.depositPaid?"#10B981":"#475569" }}><CheckCircle size={11} /> Deposit {event.depositPaid?"✓":"–"}</span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e => { e.stopPropagation(); setEditing(event); setShowForm(true); }}
                    className="p-1.5 rounded-lg cursor-pointer" style={{ background: "#1C2030", border: "1px solid #252A3A" }}>
                    <Edit2 size={13} color="#9D6FEF" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setDeleting(event.id); }}
                    className="p-1.5 rounded-lg cursor-pointer" style={{ background: "#1C2030", border: "1px solid #252A3A" }}>
                    <Trash2 size={13} color="#EF4444" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }} onClick={() => setDetail(null)}>
          <div className="empire-card p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium rounded-full px-2 py-0.5" style={{ color: typeColors[detail.type]||"#94A3B8", background: `${typeColors[detail.type]||"#94A3B8"}1A` }}>{detail.type}</span>
                  <span className="text-xs font-medium rounded-full px-2 py-0.5" style={{ color: statusColors[detail.status]?.text, background: statusColors[detail.status]?.bg }}>{detail.status}</span>
                </div>
                <h3 className="font-bold text-white text-xl" style={{ fontFamily: "Syne, sans-serif" }}>{detail.title}</h3>
              </div>
              <button onClick={() => setDetail(null)}><X size={20} color="#94A3B8" /></button>
            </div>
            <div className="space-y-2 mb-5">
              {[
                { icon: Calendar, v: `${detail.date} · ${detail.time}`, c: "#7C3AED" },
                { icon: MapPin, v: detail.venue, c: "#F59E0B" },
                { icon: DollarSign, v: `$${detail.value?.toLocaleString()}`, c: "#10B981" },
              ].map(({ icon: Icon, v, c }) => (
                <div key={v} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "#1C2030" }}>
                  <Icon size={15} color={c} />
                  <span className="text-sm" style={{ color: "#94A3B8" }}>{v}</span>
                </div>
              ))}
              {(detail.clientEmail || detail.clientPhone) && (
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "#1C2030" }}>
                  <Users size={15} color="#3B82F6" />
                  <div className="flex flex-col gap-0.5">
                    {detail.clientEmail && <span className="text-sm" style={{ color: "#94A3B8" }}>✉ {detail.clientEmail}</span>}
                    {detail.clientPhone && <span className="text-sm" style={{ color: "#94A3B8" }}>📞 {detail.clientPhone}</span>}
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "#1C2030" }}>
                <FileText size={14} color={detail.contractSigned?"#10B981":"#EF4444"} />
                <span className="text-xs" style={{ color: detail.contractSigned?"#10B981":"#EF4444" }}>{detail.contractSigned?"Contract Signed":"No Contract"}</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "#1C2030" }}>
                <CheckCircle size={14} color={detail.depositPaid?"#10B981":"#EF4444"} />
                <span className="text-xs" style={{ color: detail.depositPaid?"#10B981":"#EF4444" }}>{detail.depositPaid?"Deposit Paid":"Deposit Pending"}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setEditing(detail); setShowForm(true); setDetail(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #7C3AED, #9D6FEF)" }}>
                <Edit2 size={14} /> Edit Event
              </button>
              <button onClick={async () => {
                if (detail.clientEmail) {
                  try {
                    const res = await api.post<{success:boolean;url:string;token:string}>("/email/portal-link", {
                      eventId: detail.id,
                      clientName: detail.clientName || "Client",
                      clientEmail: detail.clientEmail,
                    });
                    if (res.success) {
                      toast.success(`Portal link emailed to ${detail.clientEmail}`);
                    } else {
                      try { await navigator.clipboard.writeText(res.url); } catch {
                        const ta = document.createElement("textarea");
                        ta.value = res.url; document.body.appendChild(ta);
                        ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
                      }
                      toast.info("Email unavailable — link copied to clipboard");
                    }
                  } catch { toast.error("Failed to send portal link"); }
                } else {
                  // No email — just copy link
                  try {
                    const res = await api.post<{url:string;token:string}>("/portal/generate-token", {
                      eventId: detail.id,
                      clientName: detail.clientName || "Client",
                      clientEmail: detail.clientEmail || "",
                    });
                    try {
                      await navigator.clipboard.writeText(res.url);
                    } catch {
                      const ta = document.createElement("textarea");
                      ta.value = res.url; document.body.appendChild(ta);
                      ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
                    }
                    toast.success("Portal link copied! (No email on file)");
                  } catch { toast.error("Failed to generate portal link"); }
                }
              }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm cursor-pointer"
                style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#9D6FEF" }}>
                <Mail size={14} /> {detail.clientEmail ? "Email Portal" : "Copy Link"}
              </button>
              <button onClick={() => { setDeleting(detail.id); setDetail(null); }}
                className="px-4 py-2.5 rounded-xl text-sm cursor-pointer"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="empire-card p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(239,68,68,0.1)" }}>
              <Trash2 size={24} color="#EF4444" />
            </div>
            <h3 className="font-bold text-white mb-2">Delete Event?</h3>
            <p className="text-sm mb-5" style={{ color: "#94A3B8" }}>This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleting)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                style={{ background: "#EF4444", color: "white" }}>Delete</button>
              <button onClick={() => setDeleting(null)}
                className="flex-1 py-2.5 rounded-xl text-sm cursor-pointer"
                style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#94A3B8" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showForm && editing && (
        <EventForm initial={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} loading={saving} />
      )}
    </Layout>
  );
}
