import { useState, useEffect } from "react";
import Layout from "../components/layout/Layout";
import { api } from "../lib/api";
import { toast } from "../lib/toast";
import { Zap, Play, Pause, Plus, X, Edit2, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface Workflow {
  id: string;
  name: string;
  trigger?: string;
  actions?: string;
  status?: string;
  runs?: number;
  description?: string;
}

const EMPTY: Partial<Workflow> = { name: "", trigger: "", actions: "[]", status: "active", runs: 0, description: "" };

const TRIGGERS = [
  "Lead submits form", "Contract signed", "Invoice paid", "Deposit paid",
  "7 days before event", "24 hours before event", "Event date passed",
  "New customer added", "Manual trigger",
];

export default function Workflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Workflow | null>(null);
  const [form, setForm]           = useState<Partial<Workflow>>(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [newAction, setNewAction] = useState("");

  const load = async () => {
    try {
      const data = await api.get<Workflow[]>("/workflows");
      setWorkflows(data || []);
    } catch { toast.error("Failed to load workflows"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const parseActions = (a: any): string[] => {
    if (Array.isArray(a)) return a;
    try { return JSON.parse(a); } catch { return a ? [a] : []; }
  };

  const openNew  = () => { setEditing(null); setForm({...EMPTY}); setShowModal(true); };
  const openEdit = (w: Workflow) => {
    setEditing(w);
    setForm({ ...w, actions: JSON.stringify(parseActions(w.actions)) });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name?.trim()) { toast.error("Name required"); return; }
    setSaving(true);
    try {
      const { nanoid } = await import("nanoid");
      if (editing) {
        await api.put(`/workflows/${editing.id}`, form);
        toast.success("Workflow updated");
      } else {
        await api.post("/workflows", { ...form, id: nanoid(), runs: 0 });
        toast.success("Workflow created");
      }
      setShowModal(false); load();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (wf: Workflow) => {
    const newStatus = wf.status === "active" ? "paused" : "active";
    try {
      await api.put(`/workflows/${wf.id}`, { ...wf, status: newStatus });
      setWorkflows(prev => prev.map(w => w.id === wf.id ? {...w, status: newStatus} : w));
      toast.success(newStatus === "active" ? "Workflow activated" : "Workflow paused");
    } catch { toast.error("Failed to update"); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.del(`/workflows/${id}`);
      toast.success("Workflow deleted");
      setDeleting(null); load();
    } catch { toast.error("Failed to delete"); }
  };

  const addAction = () => {
    if (!newAction.trim()) return;
    const current = parseActions(form.actions);
    setForm(p => ({...p, actions: JSON.stringify([...current, newAction.trim()])}));
    setNewAction("");
  };

  const removeAction = (i: number) => {
    const current = parseActions(form.actions);
    current.splice(i, 1);
    setForm(p => ({...p, actions: JSON.stringify(current)}));
  };

  if (loading) return (
    <Layout title="Workflows" subtitle="Automations & follow-up sequences">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    </Layout>
  );

  const active = workflows.filter(w => w.status === "active").length;

  return (
    <Layout title="Workflows" subtitle="Automations & follow-up sequences" action={{ label: "New Workflow", onClick: openNew }}>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total",   value: workflows.length },
          { label: "Active",  value: active },
          { label: "Paused",  value: workflows.length - active },
          { label: "Total Runs", value: workflows.reduce((s,w)=>s+(w.runs||0),0) },
        ].map(s => (
          <div key={s.label} className="empire-card p-4">
            <p className="text-2xl font-bold text-white font-mono">{s.value}</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {workflows.length === 0 ? (
        <div className="empire-card flex flex-col items-center justify-center py-16 gap-3">
          <Zap size={40} color="#334155" />
          <p className="text-sm" style={{ color: "#475569" }}>No workflows yet</p>
          <button onClick={openNew} className="empire-btn-primary text-sm px-4 py-2">Create Workflow</button>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map(wf => {
            const actions = parseActions(wf.actions);
            const isExpanded = expanded === wf.id;
            const isActive = wf.status === "active";
            return (
              <div key={wf.id} className="empire-card overflow-hidden">
                <div className="p-5 flex items-center gap-4">
                  <div className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ width: 40, height: 40, background: isActive ? "rgba(124,58,237,0.15)" : "rgba(71,85,105,0.15)" }}>
                    <Zap size={18} color={isActive ? "#9D6FEF" : "#475569"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white">{wf.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ color: isActive ? "#10B981" : "#475569", background: isActive ? "rgba(16,185,129,0.1)" : "rgba(71,85,105,0.1)" }}>
                        {isActive ? "Active" : "Paused"}
                      </span>
                    </div>
                    {wf.trigger && <p className="text-xs mt-0.5" style={{ color: "#475569" }}>Trigger: {wf.trigger}</p>}
                    <p className="text-xs mt-0.5" style={{ color: "#334155" }}>{actions.length} actions · {wf.runs||0} runs</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleStatus(wf)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                      style={{ background: isActive ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)", border: `1px solid ${isActive ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)"}`, color: isActive ? "#F59E0B" : "#10B981" }}>
                      {isActive ? <><Pause size={10}/> Pause</> : <><Play size={10}/> Activate</>}
                    </button>
                    <button onClick={() => openEdit(wf)} className="p-1.5 rounded cursor-pointer hover:bg-[#252A3A]">
                      <Edit2 size={13} color="#94A3B8" />
                    </button>
                    <button onClick={() => setDeleting(wf.id)} className="p-1.5 rounded cursor-pointer hover:bg-red-900/20">
                      <Trash2 size={13} color="#EF4444" />
                    </button>
                    <button onClick={() => setExpanded(isExpanded ? null : wf.id)}
                      className="p-1.5 rounded cursor-pointer hover:bg-[#252A3A]">
                      {isExpanded ? <ChevronUp size={14} color="#94A3B8"/> : <ChevronDown size={14} color="#94A3B8"/>}
                    </button>
                  </div>
                </div>
                {isExpanded && actions.length > 0 && (
                  <div className="px-5 pb-5 pt-0">
                    <div className="rounded-xl p-4" style={{ background: "#1C2030", border: "1px solid #252A3A" }}>
                      <p className="text-xs font-semibold mb-3" style={{ color: "#475569" }}>ACTIONS</p>
                      <div className="space-y-2">
                        {actions.map((action: string, i: number) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: "rgba(124,58,237,0.2)", color: "#9D6FEF" }}>{i+1}</div>
                            <span className="text-sm" style={{ color: "#94A3B8" }}>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl p-6 w-full max-w-sm text-center" style={{ background: "#141824", border: "1px solid #252A3A" }}>
            <p className="font-bold text-white mb-2">Delete workflow?</p>
            <p className="text-sm mb-5" style={{ color: "#94A3B8" }}>This can't be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)} className="flex-1 py-2.5 rounded-xl text-sm cursor-pointer"
                style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#94A3B8" }}>Cancel</button>
              <button onClick={() => handleDelete(deleting)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
                style={{ background: "#EF4444" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-2xl w-full max-w-lg p-6 my-8 animate-fade-in-up"
            style={{ background: "#141824", border: "1px solid #252A3A" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editing ? "Edit Workflow" : "New Workflow"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg cursor-pointer hover:bg-[#1C2030]">
                <X size={18} color="#94A3B8" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Workflow Name *</label>
                <input value={form.name || ""} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                  className="empire-input w-full" placeholder="e.g. New Lead Welcome Sequence" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Trigger</label>
                <select value={form.trigger || ""} onChange={e => setForm(p => ({...p, trigger: e.target.value}))}
                  className="empire-input w-full">
                  <option value="">— Select trigger —</option>
                  {TRIGGERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Description</label>
                <input value={form.description || ""} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                  className="empire-input w-full" placeholder="What does this workflow do?" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "#94A3B8" }}>Actions</label>
                <div className="space-y-2 mb-2">
                  {parseActions(form.actions).map((a: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "#1C2030", border: "1px solid #252A3A" }}>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: "rgba(124,58,237,0.2)", color: "#9D6FEF" }}>{i+1}</span>
                      <span className="flex-1 text-sm" style={{ color: "#94A3B8" }}>{a}</span>
                      <button onClick={() => removeAction(i)} className="p-0.5 cursor-pointer">
                        <X size={12} color="#EF4444" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newAction} onChange={e => setNewAction(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addAction()}
                    className="empire-input flex-1 text-sm" placeholder="Add action step..." />
                  <button onClick={addAction} className="px-3 py-2 rounded-lg text-sm cursor-pointer"
                    style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)", color: "#9D6FEF" }}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Status</label>
                <select value={form.status || "active"} onChange={e => setForm(p => ({...p, status: e.target.value}))}
                  className="empire-input w-full">
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm cursor-pointer"
                style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#94A3B8" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7C3AED, #9D6FEF)" }}>
                {saving ? "Saving…" : editing ? "Save Changes" : "Create Workflow"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
