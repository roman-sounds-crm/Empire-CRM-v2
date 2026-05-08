import { useState, useEffect } from "react";
import Layout from "../components/layout/Layout";
import { api } from "../lib/api";
import { toast } from "../lib/toast";
import { FileText, CheckCircle, Send, Edit, Eye, X, Loader2, Trash2, Plus, Copy, Mail } from "lucide-react";

type Contract = {
  id: string; title: string; clientName: string; clientEmail?: string;
  eventId?: string; template?: string; content?: string; status: string;
  value?: number; signedAt?: string; signedIp?: string; signToken?: string;
};

const statusConfig: Record<string, { text: string; bg: string }> = {
  signed: { text: "#10B981", bg: "rgba(16,185,129,0.1)" },
  sent:   { text: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  draft:  { text: "#475569", bg: "rgba(71,85,105,0.1)" },
};

const BRAND = "Randy Delgado dba DJ Randy Roman - Roman Sounds";
const DEFAULT_CONTENT = (name: string, date: string, value: number) => `DJ SERVICES AGREEMENT
Roman Sounds — Randy Delgado dba DJ Randy Roman
═══════════════════════════════════════════

This agreement is entered into between ${name} ("Client") and Roman Sounds ("DJ Service Provider").

EVENT DETAILS
Event Date: ${date}
Total Amount: $${value.toLocaleString()}
Deposit (50%): $${(value/2).toLocaleString()} — due upon signing
Balance due 7 days before event date.

SERVICES PROVIDED
The DJ Service Provider agrees to provide professional DJ services for the duration agreed.

CANCELLATION POLICY
Deposit is non-refundable. Cancellation within 14 days of event forfeits full payment.

SIGNATURE
By signing below, both parties agree to the terms of this contract.

Client: ____________________________  Date: __________
Roman Sounds: ____________________  Date: __________

Contract ID: [AUTO-GENERATED] | IP tracked for legal compliance`;

function ContractForm({ initial, onSave, onClose, loading }: {
  initial: Partial<Contract>; onSave: (d: Partial<Contract>) => void; onClose: () => void; loading: boolean;
}) {
  const [form, setForm] = useState<Partial<Contract>>({
    title: initial.title || "", clientName: initial.clientName || "",
    clientEmail: initial.clientEmail || "", value: initial.value || 0,
    status: initial.status || "draft", template: initial.template || "General",
    content: initial.content || DEFAULT_CONTENT(initial.clientName||"Client", "TBD", initial.value||0),
    ...initial,
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <div className="empire-card p-6 w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white text-xl" style={{ fontFamily: "Syne, sans-serif" }}>{initial.id?"Edit Contract":"New Contract"}</h3>
          <button onClick={onClose}><X size={20} color="#94A3B8"/></button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[{ label:"Contract Title", key:"title", span:2 }, { label:"Client Name", key:"clientName" }, { label:"Client Email", key:"clientEmail", type:"email" }, { label:"Value ($)", key:"value", type:"number" }].map(f => (
            <div key={f.key} className={f.span===2?"col-span-2":""}>
              <label className="block text-xs font-medium mb-1.5" style={{ color:"#94A3B8" }}>{f.label}</label>
              <input type={f.type||"text"} value={(form as any)[f.key]||""} onChange={e=>set(f.key,f.type==="number"?parseFloat(e.target.value)||0:e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background:"#1C2030", border:"1px solid #252A3A", color:"#F1F5F9" }}
                onFocus={e=>(e.target.style.borderColor="#7C3AED")} onBlur={e=>(e.target.style.borderColor="#252A3A")} />
            </div>
          ))}
        </div>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium" style={{ color:"#94A3B8" }}>Contract Content</label>
            <button onClick={() => set("content", DEFAULT_CONTENT(form.clientName||"Client","TBD",form.value||0))}
              className="text-xs cursor-pointer" style={{ color:"#7C3AED" }}>Reset to template</button>
          </div>
          <textarea value={form.content||""} onChange={e=>set("content",e.target.value)} rows={12}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none font-mono"
            style={{ background:"#1C2030", border:"1px solid #252A3A", color:"#94A3B8", fontSize:11 }} />
        </div>
        <div className="flex gap-3">
          <button onClick={() => onSave(form)} disabled={loading||!form.title||!form.clientName}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white cursor-pointer flex items-center justify-center gap-2"
            style={{ background:"linear-gradient(135deg, #7C3AED, #9D6FEF)", opacity:(!form.title||!form.clientName)?0.5:1 }}>
            {loading?<><Loader2 size={14} className="animate-spin"/>Saving...</>:(initial.id?"Save Changes":"Create Contract")}
          </button>
          <button onClick={onClose} className="px-5 py-3 rounded-xl text-sm cursor-pointer"
            style={{ background:"#1C2030", border:"1px solid #252A3A", color:"#94A3B8" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function ContractPreview({ contract, onClose }: { contract: Contract; onClose: () => void }) {
  const signLink = `${window.location.origin}/portal/sign/${contract.signToken||contract.id}`;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ background:"rgba(0,0,0,0.85)" }} onClick={onClose}>
      <div className="empire-card p-6 w-full max-w-3xl my-8" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white" style={{ fontFamily:"Syne, sans-serif" }}>{contract.title}</h3>
          <button onClick={onClose}><X size={20} color="#94A3B8"/></button>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-medium rounded-full px-2 py-0.5" style={{ color:statusConfig[contract.status]?.text, background:statusConfig[contract.status]?.bg }}>{contract.status}</span>
          {contract.signedAt && <span className="text-xs" style={{ color:"#10B981" }}>Signed {contract.signedAt}</span>}
        </div>
        <div className="rounded-xl p-5 mb-4 font-mono text-xs whitespace-pre-wrap leading-relaxed overflow-y-auto"
          style={{ background:"#1C2030", color:"#94A3B8", border:"1px solid #252A3A", maxHeight: "50vh", minHeight: "200px" }}>
          {contract.content || DEFAULT_CONTENT(contract.clientName, "TBD", contract.value||0)}
        </div>
        {contract.status !== "signed" && (
          <div className="p-3 rounded-xl mb-4" style={{ background:"rgba(124,58,237,0.08)", border:"1px solid rgba(124,58,237,0.2)" }}>
            <p className="text-xs font-semibold mb-1" style={{ color:"#9D6FEF" }}>Signing Link</p>
            <div className="flex items-center gap-2">
              <code className="text-xs flex-1 truncate" style={{ color:"#94A3B8" }}>{signLink}</code>
              <button onClick={() => { navigator.clipboard.writeText(signLink); toast.success("Link copied!"); }}
                className="p-1.5 rounded cursor-pointer" style={{ background:"#252A3A" }}><Copy size={12} color="#9D6FEF"/></button>
            </div>
          </div>
        )}
        <div className="flex gap-3">
          {contract.status!=="signed" && (
            <button onClick={async () => {
              try {
                const res = await api.post<{success:boolean;signUrl?:string;error?:string}>("/email/contract", { contractId: contract.id });
                if (res.success) {
                  toast.success(`Contract emailed to ${contract.clientEmail || "client"}`);
                } else {
                  // Email failed but update status anyway, copy link
                  await api.put(`/contracts/${contract.id}`, { status:"sent" });
                  navigator.clipboard?.writeText(signLink).catch(()=>{});
                  toast.info("Email unavailable — sign link copied to clipboard");
                }
                onClose();
              } catch { toast.error("Failed to send contract"); }
            }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer flex items-center justify-center gap-2"
              style={{ background:"linear-gradient(135deg, #7C3AED, #9D6FEF)" }}>
              <Mail size={14}/> Email to Client
            </button>
          )}
          <button onClick={() => window.open(`/api/pdf/contract/${contract.id}`, "_blank")}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
            style={{ background:"#1C2030", border:"1px solid #252A3A", color:"#94A3B8" }}>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"contracts"|"templates">("contracts");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partial<Contract>|null>(null);
  const [preview, setPreview] = useState<Contract|null>(null);
  const [deleting, setDeleting] = useState<string|null>(null);

  const load = async () => {
    try { setContracts(await api.get<Contract[]>("/contracts")); }
    catch { toast.error("Failed to load contracts"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (form: Partial<Contract>) => {
    setSaving(true);
    try {
      const { nanoid } = await import("nanoid");
      const signToken = nanoid(32);
      if (form.id) {
        const u = await api.put<Contract>(`/contracts/${form.id}`, form);
        setContracts(c => c.map(x => x.id===u.id?u:x));
        toast.success("Contract updated");
      } else {
        const c = await api.post<Contract>("/contracts", { ...form, id: nanoid(), signToken });
        setContracts(prev => [...prev, c]);
        toast.success("Contract created");
      }
      setShowForm(false); setEditing(null);
    } catch { toast.error("Failed to save contract"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.del(`/contracts/${id}`);
      setContracts(c => c.filter(x => x.id!==id));
      setDeleting(null);
      toast.success("Contract deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const shortcodes = ["{{client_name}}","{{event_date}}","{{event_time}}","{{venue}}","{{total_price}}","{{deposit_amount}}","{{dj_name}}","{{contract_id}}","{{signed_date}}","{{business_name}}"];

  return (
    <Layout title="Contracts" subtitle="Manage contracts & templates" action={{ label:"New Contract", onClick:()=>{setEditing({title:"",clientName:"",status:"draft"});setShowForm(true);} }}>
      <div className="flex items-center gap-1 mb-6 p-1 rounded-lg w-fit" style={{ background:"#1C2030" }}>
        {(["contracts","templates"] as const).map(t => (
          <button key={t} onClick={()=>setTab(t)}
            className="px-4 py-2 rounded-lg text-sm font-medium capitalize cursor-pointer"
            style={{ background:tab===t?"#252A3A":"transparent", color:tab===t?"#F1F5F9":"#94A3B8" }}>{t}</button>
        ))}
      </div>

      {tab==="contracts" ? (
        loading ? <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin" color="#7C3AED"/></div> :
        contracts.length===0 ? (
          <div className="empire-card p-16 text-center">
            <FileText size={40} color="#252A3A" className="mx-auto mb-3"/>
            <p className="font-semibold text-white mb-1">No contracts yet</p>
            <p className="text-sm mb-4" style={{ color:"#475569" }}>Create your first contract</p>
            <button onClick={()=>{setEditing({title:"",clientName:"",status:"draft"});setShowForm(true);}}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
              style={{ background:"linear-gradient(135deg, #7C3AED, #9D6FEF)" }}>
              <Plus size={14} className="inline mr-1"/> New Contract
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map(c => (
              <div key={c.id} className="empire-card p-5 flex items-center gap-4 hover:scale-[1.005] transition-all">
                <div className="flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{ width:44, height:44, background:statusConfig[c.status]?.bg }}>
                  <FileText size={20} color={statusConfig[c.status]?.text}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-white text-sm">{c.title}</h3>
                    <span className="text-xs font-medium rounded-full px-2 py-0.5" style={{ color:statusConfig[c.status]?.text, background:statusConfig[c.status]?.bg }}>{c.status}</span>
                  </div>
                  <p className="text-xs" style={{ color:"#94A3B8" }}>{c.clientName}{c.clientEmail?` · ${c.clientEmail}`:""}</p>
                  {c.signedAt && <p className="text-xs mt-0.5" style={{ color:"#10B981" }}>Signed {c.signedAt}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono font-bold text-sm" style={{ color:"#F59E0B" }}>${(c.value||0).toLocaleString()}</p>
                  {c.status==="signed" && <p className="text-xs mt-0.5" style={{ color:"#10B981" }}>✓ Binding</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={()=>setPreview(c)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                    style={{ background:"#1C2030", border:"1px solid #252A3A", color:"#94A3B8" }}><Eye size={12}/> View</button>
                  <button onClick={()=>{setEditing(c);setShowForm(true);}} className="p-1.5 rounded-lg cursor-pointer"
                    style={{ background:"#1C2030", border:"1px solid #252A3A" }}><Edit size={13} color="#9D6FEF"/></button>
                  <button onClick={()=>setDeleting(c.id)} className="p-1.5 rounded-lg cursor-pointer"
                    style={{ background:"#1C2030", border:"1px solid #252A3A" }}><Trash2 size={13} color="#EF4444"/></button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {["Wedding DJ Contract","Corporate Event Agreement","Club/Residency Contract","Birthday Party Contract","Contractor Agreement"].map(t => (
              <div key={t} className="empire-card p-5 cursor-pointer hover:scale-[1.01] transition-all"
                onClick={()=>{setEditing({title:t,clientName:"",status:"draft"});setShowForm(true);}}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center justify-center rounded-lg" style={{ width:40,height:40,background:"rgba(124,58,237,0.15)" }}>
                    <FileText size={18} color="#9D6FEF"/>
                  </div>
                  <span className="text-xs px-2 py-1 rounded cursor-pointer" style={{ background:"#1C2030", border:"1px solid #252A3A", color:"#94A3B8" }}>Use</span>
                </div>
                <h3 className="font-semibold text-white text-sm mb-1">{t}</h3>
                <p className="text-xs" style={{ color:"#475569" }}>Roman Sounds template</p>
              </div>
            ))}
            <button onClick={()=>{setEditing({title:"",clientName:"",status:"draft"});setShowForm(true);}}
              className="empire-card p-5 flex flex-col items-center justify-center cursor-pointer hover:scale-[1.01] transition-all"
              style={{ border:"1px dashed #252A3A", background:"transparent" }}>
              <div className="flex items-center justify-center rounded-full mb-2" style={{ width:40,height:40,background:"rgba(124,58,237,0.1)" }}>
                <Plus size={20} color="#7C3AED"/>
              </div>
              <p className="text-sm font-medium" style={{ color:"#7C3AED" }}>New Template</p>
            </button>
          </div>
          <div className="empire-card p-5">
            <h3 className="font-semibold text-white mb-3">Available Shortcodes</h3>
            <p className="text-xs mb-4" style={{ color:"#94A3B8" }}>Auto-replaced with real values when a contract is generated.</p>
            <div className="flex flex-wrap gap-2">
              {shortcodes.map(code => (
                <button key={code} onClick={() => { navigator.clipboard.writeText(code); toast.info("Copied!"); }}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg cursor-pointer"
                  style={{ background:"#1C2030", border:"1px solid #252A3A", color:"#9D6FEF" }}>{code}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.75)" }}>
          <div className="empire-card p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background:"rgba(239,68,68,0.1)" }}><Trash2 size={24} color="#EF4444"/></div>
            <h3 className="font-bold text-white mb-2">Delete Contract?</h3>
            <p className="text-sm mb-5" style={{ color:"#94A3B8" }}>This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={()=>handleDelete(deleting)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer" style={{ background:"#EF4444", color:"white" }}>Delete</button>
              <button onClick={()=>setDeleting(null)} className="flex-1 py-2.5 rounded-xl text-sm cursor-pointer" style={{ background:"#1C2030", border:"1px solid #252A3A", color:"#94A3B8" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showForm && editing && <ContractForm initial={editing} onSave={handleSave} onClose={()=>{setShowForm(false);setEditing(null);}} loading={saving}/>}
      {preview && <ContractPreview contract={preview} onClose={()=>setPreview(null)}/>}
    </Layout>
  );
}
