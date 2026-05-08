import { useState, useEffect } from "react";
import Layout from "../components/layout/Layout";
import { api } from "../lib/api";
import { toast } from "../lib/toast";
import { Mail, Phone, DollarSign, Clock, Tag, X, Plus, Edit2, Trash2, Loader2, ArrowRight } from "lucide-react";

type Lead = {
  id: string; name: string; email: string; phone?: string; event?: string;
  eventDate?: string; budget?: number; status: string; source?: string;
  notes?: string; lastContact?: string;
};

const statusConfig: Record<string, { text: string; bg: string }> = {
  hot:  { text: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  warm: { text: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  cold: { text: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  new:  { text: "#10B981", bg: "rgba(16,185,129,0.1)" },
};
const columns = [
  { id: "new",  label: "New",  color: "#10B981" },
  { id: "warm", label: "Warm", color: "#F59E0B" },
  { id: "hot",  label: "Hot",  color: "#EF4444" },
  { id: "cold", label: "Cold", color: "#3B82F6" },
];
const EMPTY: Partial<Lead> = { name:"", email:"", phone:"", event:"Wedding", budget:0, status:"new", source:"Website Form", notes:"" };
const SOURCES = ["Website Form","Referral","Instagram","Google Ads","Direct","Facebook","TikTok","Other"];
const EVENT_TYPES = ["Wedding","Corporate","Birthday","Residency","Anniversary","Club Night","Other"];

function LeadForm({ initial, onSave, onClose, loading }: {
  initial: Partial<Lead>; onSave: (d: Partial<Lead>) => void; onClose: () => void; loading: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-8" style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <div className="empire-card p-6 w-full max-w-xl my-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white text-xl" style={{ fontFamily: "Syne, sans-serif" }}>{initial.id?"Edit Lead":"New Lead"}</h3>
          <button onClick={onClose}><X size={20} color="#94A3B8" /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label:"Full Name", key:"name", span:2 },
            { label:"Email", key:"email", type:"email" },
            { label:"Phone", key:"phone" },
            { label:"Budget ($)", key:"budget", type:"number" },
            { label:"Event Date", key:"eventDate", type:"date" },
          ].map(f => (
            <div key={f.key} className={f.span===2?"col-span-2":""}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>{f.label}</label>
              <input type={f.type||"text"} value={(form as any)[f.key]||""} onChange={e => set(f.key, f.type==="number"?parseFloat(e.target.value)||0:e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#F1F5F9" }}
                onFocus={e=>(e.target.style.borderColor="#7C3AED")} onBlur={e=>(e.target.style.borderColor="#252A3A")} />
            </div>
          ))}
          {[
            { label:"Event Type", key:"event", options:EVENT_TYPES },
            { label:"Status", key:"status", options:["new","warm","hot","cold"] },
            { label:"Source", key:"source", options:SOURCES, span:2 },
          ].map(f => (
            <div key={f.key} className={f.span===2?"col-span-2":""}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>{f.label}</label>
              <select value={(form as any)[f.key]||""} onChange={e=>set(f.key,e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#F1F5F9" }}>
                {f.options.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div className="col-span-2">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Notes</label>
            <textarea value={form.notes||""} onChange={e=>set("notes",e.target.value)} rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#F1F5F9" }} />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={() => onSave(form)} disabled={loading || !form.name || !form.email}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white cursor-pointer flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #7C3AED, #9D6FEF)", opacity: (!form.name||!form.email)?0.5:1 }}>
            {loading ? <><Loader2 size={14} className="animate-spin"/> Saving...</> : (initial.id?"Save Changes":"Add Lead")}
          </button>
          <button onClick={onClose} className="px-5 py-3 rounded-xl text-sm cursor-pointer"
            style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#94A3B8" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"kanban"|"list">("kanban");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partial<Lead>|null>(null);
  const [deleting, setDeleting] = useState<string|null>(null);

  const load = async () => {
    try { setLeads(await api.get<Lead[]>("/leads")); }
    catch { toast.error("Failed to load leads"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (form: Partial<Lead>) => {
    setSaving(true);
    try {
      if (form.id) {
        const updated = await api.put<Lead>(`/leads/${form.id}`, { ...form, updatedAt: new Date().toISOString() });
        setLeads(l => l.map(x => x.id===updated.id?updated:x));
        toast.success("Lead updated");
      } else {
        const { nanoid } = await import("nanoid");
        const created = await api.post<Lead>("/leads", { ...form, id: nanoid(), lastContact:"Just now" });
        setLeads(l => [...l, created]);
        toast.success("Lead added");
      }
      setShowForm(false); setEditing(null);
    } catch { toast.error("Failed to save lead"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.del(`/leads/${id}`);
      setLeads(l => l.filter(x => x.id!==id));
      setDeleting(null);
      toast.success("Lead deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const updated = await api.put<Lead>(`/leads/${id}`, { status });
      setLeads(l => l.map(x => x.id===id?{...x,...updated}:x));
      toast.success(`Lead moved to ${status}`);
    } catch { toast.error("Failed to update status"); }
  };

  return (
    <Layout title="Leads" subtitle={`${leads.length} total leads`} action={{ label: "Add Lead", onClick: () => { setEditing(EMPTY); setShowForm(true); } }}>
      <div className="flex items-center gap-2 mb-6">
        {(["kanban","list"] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className="px-4 py-2 rounded-lg text-sm font-medium capitalize cursor-pointer"
            style={{ background: view===v?"rgba(124,58,237,0.2)":"#1C2030", border:`1px solid ${view===v?"#7C3AED":"#252A3A"}`, color:view===v?"#9D6FEF":"#94A3B8" }}>
            {v==="kanban"?"Kanban":"List"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin" color="#7C3AED" /></div>
      ) : view==="kanban" ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map(col => {
            const colLeads = leads.filter(l => l.status===col.id);
            return (
              <div key={col.id}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                    <span className="text-sm font-semibold text-white">{col.label}</span>
                  </div>
                  <span className="text-xs font-bold rounded-full px-2 py-0.5" style={{ background:`${col.color}1A`, color:col.color }}>{colLeads.length}</span>
                </div>
                <div className="space-y-3">
                  {colLeads.map(lead => (
                    <div key={lead.id} className="empire-card p-4 cursor-pointer hover:scale-[1.01] transition-all group">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background:"rgba(124,58,237,0.15)", color:"#9D6FEF" }}>{lead.name.charAt(0)}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{lead.name}</p>
                          <p className="text-xs truncate" style={{ color:"#475569" }}>{lead.event}</p>
                        </div>
                      </div>
                      {lead.budget ? <p className="text-xs font-mono font-medium mb-1" style={{ color:"#F59E0B" }}>${lead.budget.toLocaleString()}</p> : null}
                      {lead.lastContact && <p className="text-xs mb-2" style={{ color:"#475569" }}>{lead.lastContact}</p>}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <select value={lead.status} onChange={e => updateStatus(lead.id, e.target.value)} onClick={e=>e.stopPropagation()}
                          className="flex-1 px-2 py-1 rounded text-xs outline-none cursor-pointer"
                          style={{ background:"#1C2030", border:"1px solid #252A3A", color:"#94A3B8" }}>
                          {["new","warm","hot","cold"].map(s=><option key={s}>{s}</option>)}
                        </select>
                        <button onClick={()=>{setEditing(lead);setShowForm(true);}} className="p-1.5 rounded cursor-pointer" style={{ background:"#1C2030", border:"1px solid #252A3A" }}><Edit2 size={11} color="#9D6FEF"/></button>
                        <button onClick={()=>setDeleting(lead.id)} className="p-1.5 rounded cursor-pointer" style={{ background:"#1C2030", border:"1px solid #252A3A" }}><Trash2 size={11} color="#EF4444"/></button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => { setEditing({...EMPTY, status:col.id}); setShowForm(true); }}
                    className="w-full py-2 rounded-lg text-xs text-center cursor-pointer"
                    style={{ background:"transparent", border:"1px dashed #252A3A", color:"#475569" }}>
                    + Add lead
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empire-card overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr style={{ borderBottom:"1px solid #252A3A" }}>
                {["Name","Event","Budget","Source","Status",""].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color:"#475569" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead,i) => (
                <tr key={lead.id} style={{ borderBottom:i<leads.length-1?"1px solid #1C2030":"none" }}
                  onMouseEnter={e=>(e.currentTarget.style.background="#1C2030")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background:"rgba(124,58,237,0.15)", color:"#9D6FEF" }}>{lead.name.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-medium text-white">{lead.name}</p>
                        <p className="text-xs" style={{ color:"#475569" }}>{lead.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color:"#94A3B8" }}>{lead.event}</td>
                  <td className="px-4 py-3 text-sm font-mono font-medium" style={{ color:"#F59E0B" }}>${(lead.budget||0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm" style={{ color:"#94A3B8" }}>{lead.source}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium rounded-full px-2 py-0.5" style={{ color:statusConfig[lead.status]?.text, background:statusConfig[lead.status]?.bg }}>{lead.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={()=>{setEditing(lead);setShowForm(true);}} className="p-1.5 rounded cursor-pointer" style={{ background:"#1C2030", border:"1px solid #252A3A" }}><Edit2 size={13} color="#9D6FEF"/></button>
                      <button onClick={()=>setDeleting(lead.id)} className="p-1.5 rounded cursor-pointer" style={{ background:"#1C2030", border:"1px solid #252A3A" }}><Trash2 size={13} color="#EF4444"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.75)" }}>
          <div className="empire-card p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background:"rgba(239,68,68,0.1)" }}><Trash2 size={24} color="#EF4444"/></div>
            <h3 className="font-bold text-white mb-2">Delete Lead?</h3>
            <p className="text-sm mb-5" style={{ color:"#94A3B8" }}>This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={()=>handleDelete(deleting)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer" style={{ background:"#EF4444", color:"white" }}>Delete</button>
              <button onClick={()=>setDeleting(null)} className="flex-1 py-2.5 rounded-xl text-sm cursor-pointer" style={{ background:"#1C2030", border:"1px solid #252A3A", color:"#94A3B8" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showForm && editing && <LeadForm initial={editing} onSave={handleSave} onClose={()=>{setShowForm(false);setEditing(null);}} loading={saving}/>}
    </Layout>
  );
}
