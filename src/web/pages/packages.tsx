import { useState, useEffect } from "react";
import Layout from "../components/layout/Layout";
import { api } from "../lib/api";
import { toast } from "../lib/toast";
import { Package, Star, Plus, X, Edit2, Trash2, Check } from "lucide-react";

interface Pkg {
  id: string;
  name: string;
  description?: string;
  duration?: string;
  price?: number;
  includes?: string;
  addons?: string;
  popular?: boolean | number;
}

const EMPTY: Partial<Pkg> = { name: "", description: "", duration: "", price: 0, includes: "[]", addons: "[]", popular: false };

export default function Packages() {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState<Pkg | null>(null);
  const [form, setForm]         = useState<Partial<Pkg>>(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [newInclude, setNewInclude] = useState("");
  const [newAddon, setNewAddon]     = useState("");

  const load = async () => {
    try {
      const data = await api.get<Pkg[]>("/packages");
      setPackages(data || []);
    } catch { toast.error("Failed to load packages"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const parseList = (s: any): string[] => {
    if (Array.isArray(s)) return s;
    try { return JSON.parse(s); } catch { return s ? [s] : []; }
  };

  const openNew  = () => { setEditing(null); setForm({...EMPTY}); setShowModal(true); };
  const openEdit = (p: Pkg) => { setEditing(p); setForm({...p}); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name?.trim()) { toast.error("Name required"); return; }
    setSaving(true);
    try {
      const { nanoid } = await import("nanoid");
      const payload = {
        ...form,
        includes: Array.isArray(form.includes) ? JSON.stringify(form.includes) : form.includes,
        addons: Array.isArray(form.addons) ? JSON.stringify(form.addons) : form.addons,
        popular: form.popular ? 1 : 0,
      };
      if (editing) {
        await api.put(`/packages/${editing.id}`, payload);
        toast.success("Package updated");
      } else {
        await api.post("/packages", { ...payload, id: nanoid() });
        toast.success("Package created");
      }
      setShowModal(false); load();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.del(`/packages/${id}`);
      toast.success("Package deleted");
      setDeleting(null); load();
    } catch { toast.error("Failed to delete"); }
  };

  const addInclude = () => {
    if (!newInclude.trim()) return;
    const cur = parseList(form.includes);
    setForm(p => ({...p, includes: JSON.stringify([...cur, newInclude.trim()])}));
    setNewInclude("");
  };
  const removeInclude = (i: number) => {
    const cur = parseList(form.includes); cur.splice(i,1);
    setForm(p => ({...p, includes: JSON.stringify(cur)}));
  };
  const addAddon = () => {
    if (!newAddon.trim()) return;
    const cur = parseList(form.addons);
    setForm(p => ({...p, addons: JSON.stringify([...cur, newAddon.trim()])}));
    setNewAddon("");
  };
  const removeAddon = (i: number) => {
    const cur = parseList(form.addons); cur.splice(i,1);
    setForm(p => ({...p, addons: JSON.stringify(cur)}));
  };

  if (loading) return (
    <Layout title="Packages & Pricing" subtitle="Service packages and pricing tiers">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"/>
      </div>
    </Layout>
  );

  return (
    <Layout title="Packages & Pricing" subtitle="Service packages and pricing tiers" action={{ label: "New Package", onClick: openNew }}>
      {packages.length === 0 ? (
        <div className="empire-card flex flex-col items-center justify-center py-16 gap-3">
          <Package size={40} color="#334155"/>
          <p className="text-sm" style={{ color: "#475569" }}>No packages yet</p>
          <button onClick={openNew} className="empire-btn-primary text-sm px-4 py-2">Create Package</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {packages.map(pkg => {
            const includes = parseList(pkg.includes);
            const addons = parseList(pkg.addons);
            const isPopular = pkg.popular === 1 || pkg.popular === true;
            return (
              <div key={pkg.id} className="empire-card p-5 flex flex-col relative"
                style={{ border: isPopular ? "1px solid rgba(124,58,237,0.5)" : "1px solid #252A3A" }}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full"
                      style={{ background: "linear-gradient(135deg,#7C3AED,#9D6FEF)", color: "white" }}>
                      <Star size={10} fill="white"/> Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="font-bold text-white text-lg">{pkg.name}</h3>
                  {pkg.description && <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{pkg.description}</p>}
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">${(pkg.price||0).toLocaleString()}</span>
                  {pkg.duration && <span className="text-sm ml-2" style={{ color: "#475569" }}>{pkg.duration}</span>}
                </div>
                {includes.length > 0 && (
                  <div className="flex-1 space-y-2 mb-4">
                    {includes.map((item: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "#94A3B8" }}>
                        <Check size={12} color="#10B981" className="flex-shrink-0 mt-0.5"/>
                        {item}
                      </div>
                    ))}
                  </div>
                )}
                {addons.length > 0 && (
                  <div className="mb-4 pt-3" style={{ borderTop: "1px solid #252A3A" }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: "#475569" }}>ADD-ONS</p>
                    {addons.map((a: string, i: number) => (
                      <p key={i} className="text-xs" style={{ color: "#475569" }}>+ {a}</p>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-3 mt-auto" style={{ borderTop: "1px solid #252A3A" }}>
                  <button onClick={() => openEdit(pkg)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs cursor-pointer"
                    style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#9D6FEF" }}>
                    <Edit2 size={11}/> Edit
                  </button>
                  <button onClick={() => setDeleting(pkg.id)}
                    className="p-2 rounded-lg cursor-pointer hover:bg-red-900/20">
                    <Trash2 size={13} color="#EF4444"/>
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
            <p className="font-bold text-white mb-2">Delete package?</p>
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
              <h2 className="text-lg font-bold text-white">{editing ? "Edit Package" : "New Package"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg cursor-pointer hover:bg-[#1C2030]">
                <X size={18} color="#94A3B8"/>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Package Name *</label>
                  <input value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
                    className="empire-input w-full" placeholder="Gold Package"/>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Price ($) *</label>
                  <input type="number" value={form.price||""} onChange={e=>setForm(p=>({...p,price:parseFloat(e.target.value)||0}))}
                    className="empire-input w-full" placeholder="1400"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Duration</label>
                  <input value={form.duration||""} onChange={e=>setForm(p=>({...p,duration:e.target.value}))}
                    className="empire-input w-full" placeholder="6 hours"/>
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!form.popular} onChange={e=>setForm(p=>({...p,popular:e.target.checked}))}
                      className="w-4 h-4 accent-purple-500"/>
                    <span className="text-sm" style={{ color: "#94A3B8" }}>Most Popular</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Description</label>
                <input value={form.description||""} onChange={e=>setForm(p=>({...p,description:e.target.value}))}
                  className="empire-input w-full" placeholder="Short description..."/>
              </div>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "#94A3B8" }}>What's Included</label>
                <div className="space-y-1.5 mb-2">
                  {parseList(form.includes).map((item:string,i:number)=>(
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background:"#1C2030",border:"1px solid #252A3A" }}>
                      <Check size={11} color="#10B981"/>
                      <span className="flex-1 text-xs" style={{ color:"#94A3B8" }}>{item}</span>
                      <button onClick={()=>removeInclude(i)}><X size={11} color="#EF4444"/></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newInclude} onChange={e=>setNewInclude(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&addInclude()}
                    className="empire-input flex-1 text-xs" placeholder="e.g. Full sound system"/>
                  <button onClick={addInclude} className="px-3 py-2 rounded-lg text-xs cursor-pointer"
                    style={{ background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.3)",color:"#10B981" }}>
                    <Plus size={13}/>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "#94A3B8" }}>Add-Ons Available</label>
                <div className="space-y-1.5 mb-2">
                  {parseList(form.addons).map((a:string,i:number)=>(
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background:"#1C2030",border:"1px solid #252A3A" }}>
                      <span className="flex-1 text-xs" style={{ color:"#94A3B8" }}>+ {a}</span>
                      <button onClick={()=>removeAddon(i)}><X size={11} color="#EF4444"/></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newAddon} onChange={e=>setNewAddon(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&addAddon()}
                    className="empire-input flex-1 text-xs" placeholder="e.g. Extra hour: $150"/>
                  <button onClick={addAddon} className="px-3 py-2 rounded-lg text-xs cursor-pointer"
                    style={{ background:"rgba(124,58,237,0.15)",border:"1px solid rgba(124,58,237,0.3)",color:"#9D6FEF" }}>
                    <Plus size={13}/>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm cursor-pointer"
                style={{ background:"#1C2030",border:"1px solid #252A3A",color:"#94A3B8" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
                style={{ background:"linear-gradient(135deg,#7C3AED,#9D6FEF)" }}>
                {saving?"Saving…":editing?"Save Changes":"Create Package"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
