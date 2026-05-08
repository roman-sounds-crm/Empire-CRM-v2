import { useState, useEffect } from "react";
import Layout from "../components/layout/Layout";
import { api } from "../lib/api";
import { toast } from "../lib/toast";
import { Disc3, Star, Mail, Phone, Plus, X, Edit2, Trash2, CheckCircle, Clock } from "lucide-react";

interface Contractor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  skills?: string;
  rating?: number;
  status?: string;
  eventsCompleted?: number;
  hourlyRate?: number;
  notes?: string;
}

const EMPTY: Partial<Contractor> = { name: "", email: "", phone: "", skills: "", rating: 5, status: "active", eventsCompleted: 0, hourlyRate: 0, notes: "" };

const statusConfig: Record<string, { text: string; bg: string }> = {
  active:   { text: "#10B981", bg: "rgba(16,185,129,0.1)" },
  inactive: { text: "#475569", bg: "rgba(71,85,105,0.1)" },
  busy:     { text: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
};

export default function Contractors() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState<Contractor | null>(null);
  const [form, setForm]         = useState<Partial<Contractor>>(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await api.get<Contractor[]>("/contractors");
      setContractors(data || []);
    } catch { toast.error("Failed to load contractors"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew  = () => { setEditing(null); setForm({...EMPTY}); setShowModal(true); };
  const openEdit = (c: Contractor) => { setEditing(c); setForm({...c, skills: Array.isArray(c.skills) ? (c.skills as any).join(", ") : c.skills || ""}); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name?.trim()) { toast.error("Name required"); return; }
    setSaving(true);
    try {
      const { nanoid } = await import("nanoid");
      const payload = { ...form, skills: JSON.stringify((form.skills||"").split(",").map((s:string)=>s.trim()).filter(Boolean)) };
      if (editing) {
        await api.put(`/contractors/${editing.id}`, payload);
        toast.success("Contractor updated");
      } else {
        await api.post("/contractors", { ...payload, id: nanoid() });
        toast.success("Contractor added");
      }
      setShowModal(false); load();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.del(`/contractors/${id}`);
      toast.success("Contractor removed");
      setDeleting(null); load();
    } catch { toast.error("Failed to delete"); }
  };

  const parseSkills = (s: any): string[] => {
    if (Array.isArray(s)) return s;
    try { return JSON.parse(s); } catch { return s ? [s] : []; }
  };

  if (loading) return (
    <Layout title="Contractors" subtitle="Manage your DJ team & sub-contractors">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    </Layout>
  );

  return (
    <Layout title="Contractors" subtitle="Manage your DJ team & sub-contractors" action={{ label: "Add Contractor", onClick: openNew }}>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total",    value: contractors.length },
          { label: "Active",   value: contractors.filter(c=>c.status==="active").length },
          { label: "Avg Rating", value: contractors.length ? (contractors.reduce((s,c)=>s+(c.rating||0),0)/contractors.length).toFixed(1) : "—" },
          { label: "Events Done", value: contractors.reduce((s,c)=>s+(c.eventsCompleted||0),0) },
        ].map(stat => (
          <div key={stat.label} className="empire-card p-4">
            <p className="text-2xl font-bold text-white font-mono">{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      {contractors.length === 0 ? (
        <div className="empire-card flex flex-col items-center justify-center py-16 gap-3">
          <Disc3 size={40} color="#334155" />
          <p className="text-sm" style={{ color: "#475569" }}>No contractors yet</p>
          <button onClick={openNew} className="empire-btn-primary text-sm px-4 py-2">Add Contractor</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contractors.map(c => {
            const sc = statusConfig[c.status||"active"];
            const skills = parseSkills(c.skills);
            return (
              <div key={c.id} className="empire-card p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#7C3AED,#9D6FEF)", color: "white" }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{c.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ color: sc.text, background: sc.bg }}>{c.status||"active"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={13} color="#F59E0B" fill="#F59E0B" />
                    <span className="text-sm font-bold text-white">{c.rating || 5}</span>
                  </div>
                </div>

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s:string) => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(124,58,237,0.1)", color: "#9D6FEF" }}>{s}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs" style={{ color: "#475569" }}>
                  <span className="flex items-center gap-1"><CheckCircle size={11} /> {c.eventsCompleted||0} events</span>
                  {c.hourlyRate ? <span>${c.hourlyRate}/hr</span> : null}
                </div>

                <div className="flex items-center gap-2 pt-2" style={{ borderTop: "1px solid #252A3A" }}>
                  <button onClick={() => openEdit(c)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs cursor-pointer"
                    style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#94A3B8" }}>
                    <Edit2 size={12} /> Edit
                  </button>
                  {c.email && (
                    <button onClick={() => window.open(`mailto:${c.email}`, "_blank")}
                      className="p-2 rounded-lg cursor-pointer hover:bg-[#252A3A]" title="Email">
                      <Mail size={14} color="#94A3B8" />
                    </button>
                  )}
                  {c.phone && (
                    <button onClick={() => window.open(`tel:${c.phone}`, "_blank")}
                      className="p-2 rounded-lg cursor-pointer hover:bg-[#252A3A]" title="Call">
                      <Phone size={14} color="#94A3B8" />
                    </button>
                  )}
                  <button onClick={() => setDeleting(c.id)}
                    className="p-2 rounded-lg cursor-pointer hover:bg-red-900/20">
                    <Trash2 size={14} color="#EF4444" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl p-6 w-full max-w-sm text-center" style={{ background: "#141824", border: "1px solid #252A3A" }}>
            <p className="font-bold text-white mb-2">Remove contractor?</p>
            <p className="text-sm mb-5" style={{ color: "#94A3B8" }}>This can't be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)} className="flex-1 py-2.5 rounded-xl text-sm cursor-pointer"
                style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#94A3B8" }}>Cancel</button>
              <button onClick={() => handleDelete(deleting)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
                style={{ background: "#EF4444" }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-2xl w-full max-w-md p-6 my-8 animate-fade-in-up"
            style={{ background: "#141824", border: "1px solid #252A3A" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editing ? "Edit Contractor" : "Add Contractor"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg cursor-pointer hover:bg-[#1C2030]">
                <X size={18} color="#94A3B8" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: "Name *",        key: "name",      type: "text",   placeholder: "DJ Phantom" },
                { label: "Email",         key: "email",     type: "email",  placeholder: "dj@email.com" },
                { label: "Phone",         key: "phone",     type: "tel",    placeholder: "+1 555-0100" },
                { label: "Skills (comma separated)", key: "skills", type: "text", placeholder: "Hip Hop, R&B, House" },
                { label: "Hourly Rate ($)",key: "hourlyRate",type: "number", placeholder: "150" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key] || ""} placeholder={f.placeholder}
                    onChange={e => setForm(p => ({...p, [f.key]: f.type==="number" ? parseFloat(e.target.value)||0 : e.target.value}))}
                    className="empire-input w-full" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Rating (1-5)</label>
                  <input type="number" min="1" max="5" step="0.1" value={form.rating || 5}
                    onChange={e => setForm(p => ({...p, rating: parseFloat(e.target.value)||5}))}
                    className="empire-input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Status</label>
                  <select value={form.status || "active"} onChange={e => setForm(p => ({...p, status: e.target.value}))}
                    className="empire-input w-full">
                    <option value="active">Active</option>
                    <option value="busy">Busy</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Notes</label>
                <textarea rows={2} value={form.notes || ""} onChange={e => setForm(p => ({...p, notes: e.target.value}))}
                  className="empire-input w-full resize-none" placeholder="Any notes..." />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm cursor-pointer"
                style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#94A3B8" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7C3AED, #9D6FEF)" }}>
                {saving ? "Saving…" : editing ? "Save Changes" : "Add Contractor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
