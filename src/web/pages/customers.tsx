import { useState, useEffect } from "react";
import Layout from "../components/layout/Layout";
import { api } from "../lib/api";
import { toast } from "../lib/toast";
import { UserCheck, Mail, Phone, Calendar, Plus, X, Edit2, Trash2, MessageSquare, ExternalLink, Link, Copy, Check, Loader2 } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  eventType?: string;
  totalSpend?: number;
  lastEvent?: string;
  status?: string;
  notes?: string;
  createdAt?: string;
}

const EMPTY: Partial<Customer> = { name: "", email: "", phone: "", eventType: "", totalSpend: 0, status: "active", notes: "" };

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Customer | null>(null);
  const [form, setForm]           = useState<Partial<Customer>>(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [portalModal, setPortalModal] = useState<{name:string;email:string;phone?:string} | null>(null);
  const [portalLink, setPortalLink]   = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  const [copied, setCopied]           = useState(false);

  const load = async () => {
    try {
      // Customers are leads that are "won" / booked events clients
      // We pull from leads + events and deduplicate by email
      const [leads, events] = await Promise.all([
        api.get<any[]>("/leads"),
        api.get<any[]>("/events"),
      ]);
      // Build customer list from events (actual booked clients)
      const fromEvents: Customer[] = events.map(e => ({
        id: `evt-${e.id}`,
        name: e.clientName || "Unknown",
        email: e.clientEmail || "",
        phone: e.clientPhone || "",
        eventType: e.type || "",
        totalSpend: e.value || 0,
        lastEvent: e.date || "",
        status: "active",
        notes: e.notes || "",
      }));
      // Also pull manually-added customers stored as leads with status=won
      const wonLeads: Customer[] = leads
        .filter((l: any) => l.status === "won")
        .map((l: any) => ({
          id: `lead-${l.id}`,
          name: l.name,
          email: l.email || "",
          phone: l.phone || "",
          eventType: l.event || "",
          totalSpend: l.budget || 0,
          lastEvent: l.eventDate || "",
          status: "active",
          notes: l.notes || "",
        }));
      // Dedupe by email — events take priority
      const eventEmails = new Set(fromEvents.map(c => c.email?.toLowerCase()).filter(Boolean));
      const uniqueLeads = wonLeads.filter(l => !l.email || !eventEmails.has(l.email.toLowerCase()));
      setCustomers([...fromEvents, ...uniqueLeads]);
    } catch { toast.error("Failed to load customers"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.eventType?.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setEditing(null); setForm({...EMPTY}); setShowModal(true); };
  const openEdit = (c: Customer) => { setEditing(c); setForm({...c}); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name?.trim()) { toast.error("Name required"); return; }
    setSaving(true);
    try {
      if (editing) {
        if (editing.id.startsWith("lead-")) {
          const leadId = editing.id.replace("lead-", "");
          await api.put(`/leads/${leadId}`, {
            name: form.name,
            email: form.email || "",
            phone: form.phone || "",
            event: form.eventType || "",
            budget: form.totalSpend || 0,
            notes: form.notes || "",
          });
        } else if (editing.id.startsWith("evt-")) {
          const eventId = editing.id.replace("evt-", "");
          await api.put(`/events/${eventId}`, {
            clientName: form.name,
            clientEmail: form.email || "",
            clientPhone: form.phone || "",
            notes: form.notes || "",
          });
        }
        toast.success("Customer updated");
      } else {
        // Store in leads table — proper home for contacts without events yet
        await api.post("/leads", {
          name: form.name,
          email: form.email || "",
          phone: form.phone || "",
          event: form.eventType || "",
          budget: form.totalSpend || 0,
          status: "won",
          notes: form.notes || "",
          source: "manual",
        });
        toast.success("Customer added");
      }
      setShowModal(false);
      load();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleEmail = (c: Customer) => {
    if (!c.email) { toast.error("No email on file"); return; }
    window.open(`mailto:${c.email}`, "_blank");
  };

  const handleSMS = (c: Customer) => {
    if (!c.phone) { toast.error("No phone on file"); return; }
    window.open(`sms:${c.phone}`, "_blank");
  };

  const openPortalModal = (c: Customer) => {
    if (!c.email) { toast.error("No email — can't generate portal link"); return; }
    setPortalLink("");
    setCopied(false);
    setPortalModal({ name: c.name, email: c.email, phone: c.phone });
  };

  const handleDelete = async (c: Customer) => {
    if (!confirm(`Delete ${c.name}? This cannot be undone.`)) return;
    setDeleting(c.id);
    try {
      if (c.id.startsWith("lead-")) {
        await api.delete(`/leads/${c.id.replace("lead-", "")}`);
      } else if (c.id.startsWith("evt-")) {
        await api.delete(`/events/${c.id.replace("evt-", "")}`);
      }
      toast.success(`${c.name} deleted`);
      load();
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(null); }
  };

  const generatePortalLink = async () => {
    if (!portalModal) return;
    setPortalLoading(true);
    try {
      const res = await api.post<{success:boolean;url:string}>("/email/portal-link", {
        clientName: portalModal.name,
        clientEmail: portalModal.email,
      });
      setPortalLink(res.url);
      if (res.success) toast.success(`Portal link emailed to ${portalModal.email}`);
    } catch { toast.error("Failed to generate portal link"); }
    finally { setPortalLoading(false); }
  };

  const copyPortalLink = async () => {
    if (!portalLink) return;
    await navigator.clipboard.writeText(portalLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <Layout title="Customers" subtitle="Your client database">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    </Layout>
  );

  return (
    <Layout title="Customers" subtitle="Your client database" action={{ label: "Add Customer", onClick: openNew }}>

      {/* Search */}
      <div className="mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="empire-input w-full max-w-sm" placeholder="Search customers..." />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Clients",   value: customers.length },
          { label: "Total Revenue",   value: `$${customers.reduce((s,c) => s+(c.totalSpend||0),0).toLocaleString()}` },
          { label: "Avg Spend",       value: customers.length ? `$${Math.round(customers.reduce((s,c)=>s+(c.totalSpend||0),0)/customers.length).toLocaleString()}` : "$0" },
          { label: "Active",          value: customers.filter(c=>c.status==="active").length },
        ].map(stat => (
          <div key={stat.label} className="empire-card p-4">
            <p className="text-2xl font-bold text-white font-mono">{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="empire-card overflow-hidden overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <UserCheck size={40} color="#334155" />
            <p className="text-sm" style={{ color: "#475569" }}>No customers yet</p>
            <button onClick={openNew} className="empire-btn-primary text-sm px-4 py-2">Add Customer</button>
          </div>
        ) : (
          <table className="w-full min-w-[640px]">
            <thead>
              <tr style={{ borderBottom: "1px solid #252A3A" }}>
                {["Client","Contact","Event Type","Spend","Last Event","Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#475569" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < filtered.length-1 ? "1px solid #1C2030" : "none" }}
                  className="hover:bg-[#1C2030] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: "rgba(124,58,237,0.2)", color: "#9D6FEF" }}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-sm font-medium text-white">{c.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.email && <p className="text-xs" style={{ color: "#94A3B8" }}>{c.email}</p>}
                    {c.phone && <p className="text-xs" style={{ color: "#475569" }}>{c.phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(124,58,237,0.1)", color: "#9D6FEF" }}>
                      {c.eventType || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono font-bold text-white">${(c.totalSpend||0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#475569" }}>{c.lastEvent || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(c)} title="Edit"
                        className="p-1.5 rounded cursor-pointer hover:bg-[#252A3A]"><Edit2 size={13} color="#94A3B8" /></button>
                      <button onClick={() => handleEmail(c)} title="Send email"
                        className="p-1.5 rounded cursor-pointer hover:bg-[#252A3A]"><Mail size={13} color="#94A3B8" /></button>
                      <button onClick={() => handleSMS(c)} title="Send SMS"
                        className="p-1.5 rounded cursor-pointer hover:bg-[#252A3A]"><MessageSquare size={13} color="#94A3B8" /></button>
                      <button onClick={() => openPortalModal(c)} title="Generate portal link"
                        className="flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-[#252A3A] text-xs font-medium"
                        style={{ color: "#9D6FEF" }}>
                        <Link size={12} /> Portal
                      </button>
                      <button onClick={() => handleDelete(c)} title="Delete customer"
                        disabled={deleting === c.id}
                        className="p-1.5 rounded cursor-pointer hover:bg-[#252A3A] disabled:opacity-40">
                        {deleting === c.id
                          ? <Loader2 size={13} className="animate-spin" style={{ color: "#EF4444" }} />
                          : <Trash2 size={13} color="#EF4444" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-2xl w-full max-w-md p-6 my-8 animate-fade-in-up"
            style={{ background: "#141824", border: "1px solid #252A3A" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editing ? "Edit Customer" : "Add Customer"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg cursor-pointer hover:bg-[#1C2030]">
                <X size={18} color="#94A3B8" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: "Full Name *",    key: "name",      type: "text",   placeholder: "Sarah Mitchell" },
                { label: "Email",          key: "email",     type: "email",  placeholder: "sarah@example.com" },
                { label: "Phone",          key: "phone",     type: "tel",    placeholder: "+1 555-0100" },
                { label: "Event Type",     key: "eventType", type: "text",   placeholder: "Wedding, Corporate..." },
                { label: "Total Spend ($)",key: "totalSpend",type: "number", placeholder: "0" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key] || ""} placeholder={f.placeholder}
                    onChange={e => setForm(p => ({...p, [f.key]: f.type==="number" ? parseFloat(e.target.value)||0 : e.target.value}))}
                    className="empire-input w-full" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Notes</label>
                <textarea rows={3} value={form.notes || ""} onChange={e => setForm(p => ({...p, notes: e.target.value}))}
                  className="empire-input w-full resize-none" placeholder="Any notes about this client..." />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm cursor-pointer"
                style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#94A3B8" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7C3AED, #9D6FEF)" }}>
                {saving ? "Saving…" : editing ? "Save Changes" : "Add Customer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portal Link Modal */}
      {portalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-5"
            style={{ background: "#141824", border: "1px solid #1E2435" }}>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link size={18} color="#9D6FEF" />
                <h2 className="text-lg font-bold text-white">Send Portal Link</h2>
              </div>
              <button onClick={() => setPortalModal(null)} className="cursor-pointer" style={{ color: "#475569" }}><X size={18} /></button>
            </div>

            {/* Customer info */}
            <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#1C2030", border: "1px solid #252A3A" }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: "rgba(124,58,237,0.2)", color: "#9D6FEF" }}>
                {portalModal.name[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{portalModal.name}</p>
                <p className="text-xs" style={{ color: "#475569" }}>{portalModal.email}{portalModal.phone ? ` · ${portalModal.phone}` : ""}</p>
              </div>
            </div>

            {/* Step 1 — Generate */}
            {!portalLink ? (
              <div className="space-y-3">
                <p className="text-sm" style={{ color: "#94A3B8" }}>
                  Generates a private magic link — no password needed. Good for viewing their event, signing contracts, paying invoices, and song requests.
                </p>
                <button
                  onClick={generatePortalLink}
                  disabled={portalLoading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}
                >
                  {portalLoading
                    ? <><Loader2 size={14} className="animate-spin" /> Generating...</>
                    : <><Link size={14} /> Generate Link</>}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* The link */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#475569" }}>PORTAL LINK</p>
                  <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "#1C2030", border: "1px solid #252A3A" }}>
                    <p className="text-xs flex-1 truncate font-mono" style={{ color: "#9D6FEF" }}>{portalLink}</p>
                    <button
                      onClick={copyPortalLink}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex-shrink-0 transition-all"
                      style={{
                        background: copied ? "rgba(16,185,129,0.15)" : "rgba(124,58,237,0.15)",
                        color: copied ? "#10B981" : "#9D6FEF",
                        border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(124,58,237,0.3)"}`
                      }}
                    >
                      {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                    </button>
                  </div>
                </div>

                {/* Send options */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#475569" }}>SEND VIA</p>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Email */}
                    <a
                      href={`mailto:${portalModal.email}?subject=Your Roman Sounds Portal&body=Hi ${encodeURIComponent(portalModal.name)},%0A%0AHere's your personal portal link for your upcoming event:%0A%0A${encodeURIComponent(portalLink)}%0A%0AUse this link to view your event details, sign your contract, make payments, and submit song requests.%0A%0A— Randy Roman`}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold cursor-pointer"
                      style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: "#3B82F6" }}
                    >
                      <Mail size={16} />
                      Email
                    </a>

                    {/* SMS */}
                    <a
                      href={`sms:${portalModal.phone || ""}?body=Hi ${encodeURIComponent(portalModal.name)}, here's your Roman Sounds portal link: ${encodeURIComponent(portalLink)}`}
                      onClick={!portalModal.phone ? (e) => { e.preventDefault(); toast.error("No phone number on file"); } : undefined}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold cursor-pointer"
                      style={{
                        background: portalModal.phone ? "rgba(16,185,129,0.1)" : "rgba(71,85,105,0.1)",
                        border: `1px solid ${portalModal.phone ? "rgba(16,185,129,0.25)" : "rgba(71,85,105,0.2)"}`,
                        color: portalModal.phone ? "#10B981" : "#475569"
                      }}
                    >
                      <MessageSquare size={16} />
                      SMS
                    </a>

                    {/* Copy */}
                    <button
                      onClick={copyPortalLink}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold cursor-pointer"
                      style={{
                        background: copied ? "rgba(16,185,129,0.1)" : "rgba(124,58,237,0.1)",
                        border: `1px solid ${copied ? "rgba(16,185,129,0.25)" : "rgba(124,58,237,0.25)"}`,
                        color: copied ? "#10B981" : "#9D6FEF"
                      }}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  {!portalModal.phone && (
                    <p className="text-xs mt-2" style={{ color: "#475569" }}>Add a phone number to this customer to enable SMS.</p>
                  )}
                </div>

                <button
                  onClick={generatePortalLink}
                  disabled={portalLoading}
                  className="w-full py-2 rounded-xl text-xs font-medium cursor-pointer"
                  style={{ background: "#1C2030", color: "#475569", border: "1px solid #252A3A" }}
                >
                  Generate a new link
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
