import { useState, useEffect } from "react";
import Layout from "../components/layout/Layout";
import { api } from "../lib/api";
import { toast } from "../lib/toast";
import {
  DollarSign, CheckCircle, AlertCircle, Clock, Send, Plus, X, Edit2, Trash2,
  ExternalLink, Download, FileText, CreditCard, Mail
} from "lucide-react";

interface Invoice {
  id: string;
  clientName: string;
  clientEmail?: string;
  eventId?: string;
  amount: number;
  paid: number;
  due: number;
  dueDate?: string;
  issuedDate?: string;
  status: string;
  notes?: string;
  stripeCheckoutUrl?: string;
  payToken?: string;
}

const statusConfig: Record<string, { text: string; bg: string; label: string }> = {
  paid:    { text: "#10B981", bg: "rgba(16,185,129,0.1)",  label: "Paid" },
  partial: { text: "#F59E0B", bg: "rgba(245,158,11,0.1)",  label: "Partial" },
  overdue: { text: "#EF4444", bg: "rgba(239,68,68,0.1)",   label: "Overdue" },
  pending: { text: "#3B82F6", bg: "rgba(59,130,246,0.1)",  label: "Pending" },
};

const EMPTY: Partial<Invoice> = {
  clientName: "", clientEmail: "", eventId: "", amount: 0, paid: 0, due: 0,
  dueDate: "", status: "pending", notes: "",
};

export default function Invoices() {
  const [invoices, setInvoices]   = useState<Invoice[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Invoice | null>(null);
  const [form, setForm]           = useState<Partial<Invoice>>(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [paying, setPaying]       = useState<string | null>(null);
  const [emailing, setEmailing]   = useState<string | null>(null);
  const [events, setEvents]       = useState<{id:string;title:string}[]>([]);

  const load = async () => {
    try {
      const [invRes, evtRes] = await Promise.all([
        api.get<Invoice[]>("/invoices"),
        api.get<{id:string;title:string}[]>("/events"),
      ]);
      setInvoices(invRes);
      setEvents(evtRes);
    } catch { toast.error("Failed to load invoices"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const totalRevenue = invoices.reduce((s, i) => s + i.amount, 0);
  const totalPaid    = invoices.reduce((s, i) => s + i.paid,   0);
  const totalDue     = invoices.reduce((s, i) => s + i.due,    0);

  const filtered = filter === "all" ? invoices : invoices.filter(i => i.status === filter);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, issuedDate: new Date().toISOString().split("T")[0] });
    setShowModal(true);
  };

  const openEdit = (inv: Invoice) => {
    setEditing(inv);
    setForm({ ...inv });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); setForm(EMPTY); };

  const handleSave = async () => {
    if (!form.clientName?.trim()) { toast.error("Client name required"); return; }
    if (!form.amount || form.amount <= 0) { toast.error("Amount must be > 0"); return; }
    setSaving(true);
    try {
      const { nanoid } = await import("nanoid");
      const amt  = Number(form.amount) || 0;
      const paid = Number(form.paid)   || 0;
      const due  = amt - paid;
      const status =
        paid >= amt ? "paid" :
        paid > 0    ? "partial" :
        form.dueDate && new Date(form.dueDate) < new Date() ? "overdue" : "pending";

      if (editing) {
        await api.put(`/invoices/${editing.id}`, { ...form, amount: amt, paid, due, status });
        toast.success("Invoice updated");
      } else {
        const id = `INV-${nanoid(6).toUpperCase()}`;
        await api.post("/invoices", { ...form, id, amount: amt, paid, due, status });
        toast.success("Invoice created");
      }
      closeModal();
      load();
    } catch { toast.error("Failed to save invoice"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this invoice?")) return;
    try {
      await api.del(`/invoices/${id}`);
      toast.success("Invoice deleted");
      load();
    } catch { toast.error("Failed to delete"); }
  };

  const handleMarkPaid = async (inv: Invoice) => {
    try {
      await api.put(`/invoices/${inv.id}`, { ...inv, paid: inv.amount, due: 0, status: "paid" });
      toast.success("Marked as paid");
      load();
    } catch { toast.error("Failed to update"); }
  };

  const handleSendPayLink = async (inv: Invoice) => {
    setPaying(inv.id);
    try {
      const res = await api.post<{ url: string; token: string }>("/stripe/checkout", {
        invoiceId: inv.id,
        amount: inv.due,
        clientEmail: inv.clientEmail,
        clientName: inv.clientName,
        description: `Invoice ${inv.id} — Roman Sounds / DJ Randy Roman`,
      });
      // Store URL on invoice
      await api.put(`/invoices/${inv.id}`, { ...inv, stripeCheckoutUrl: res.url, payToken: res.token });
      // Copy to clipboard
      navigator.clipboard?.writeText(res.url).catch(() => {});
      toast.success("Payment link copied to clipboard!");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to create payment link");
    } finally { setPaying(null); }
  };

  const handleDownloadPDF = (inv: Invoice) => {
    window.open(`/api/pdf/invoice/${inv.id}`, "_blank");
  };

  const handleEmailInvoice = async (inv: Invoice) => {
    if (!inv.clientEmail) { toast.error("No client email on this invoice"); return; }
    setEmailing(inv.id);
    try {
      await api.post("/email/invoice", { invoiceId: inv.id });
      toast.success(`Invoice emailed to ${inv.clientEmail}`);
    } catch { toast.error("Failed to send email"); }
    finally { setEmailing(null); }
  };

  if (loading) return (
    <Layout title="Invoices & Payments" subtitle="Track all payments and outstanding balances">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    </Layout>
  );

  return (
    <Layout
      title="Invoices & Payments"
      subtitle="Track all payments and outstanding balances"
      action={{ label: "New Invoice", onClick: openNew }}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Invoiced",    value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign,   color: "#7C3AED", bg: "rgba(124,58,237,0.1)" },
          { label: "Amount Collected",  value: `$${totalPaid.toLocaleString()}`,    icon: CheckCircle,  color: "#10B981", bg: "rgba(16,185,129,0.1)" },
          { label: "Outstanding",       value: `$${totalDue.toLocaleString()}`,     icon: AlertCircle,  color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
        ].map(card => (
          <div key={card.label} className="empire-card p-5 flex items-center gap-4">
            <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 48, height: 48, background: card.bg }}>
              <card.icon size={22} color={card.color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white font-mono">{card.value}</p>
              <p className="text-sm" style={{ color: "#94A3B8" }}>{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5">
        {["all","paid","partial","overdue","pending"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-lg text-sm font-medium capitalize cursor-pointer transition-all"
            style={{
              background: filter === f ? "rgba(124,58,237,0.2)" : "#1C2030",
              border: `1px solid ${filter === f ? "#7C3AED" : "#252A3A"}`,
              color: filter === f ? "#9D6FEF" : "#94A3B8",
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="empire-card overflow-hidden mb-6 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FileText size={40} color="#334155" />
            <p className="text-sm" style={{ color: "#475569" }}>No invoices yet</p>
            <button onClick={openNew} className="empire-btn-primary text-sm px-4 py-2">Create Invoice</button>
          </div>
        ) : (
          <table className="w-full min-w-[700px]">
            <thead>
              <tr style={{ borderBottom: "1px solid #252A3A" }}>
                {["Invoice","Client","Amount","Paid","Due","Due Date","Status","Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#475569" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => {
                const sc = statusConfig[inv.status] ?? statusConfig.pending;
                return (
                  <tr key={inv.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #1C2030" : "none" }}
                    className="transition-colors hover:bg-[#1C2030]">
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "#94A3B8" }}>{inv.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-white">{inv.clientName}</p>
                      {inv.clientEmail && <p className="text-xs" style={{ color: "#475569" }}>{inv.clientEmail}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono font-bold text-white">${(inv.amount||0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-mono" style={{ color: "#10B981" }}>${(inv.paid||0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-mono" style={{ color: inv.due > 0 ? "#EF4444" : "#10B981" }}>
                      ${(inv.due||0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#475569" }}>{inv.dueDate || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium rounded-full px-2 py-0.5"
                        style={{ color: sc.text, background: sc.bg }}>{sc.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <button onClick={() => openEdit(inv)}
                          className="p-1.5 rounded cursor-pointer transition-colors hover:bg-[#252A3A]"
                          title="Edit"><Edit2 size={13} color="#94A3B8" /></button>
                        <button onClick={() => handleDownloadPDF(inv)}
                          className="p-1.5 rounded cursor-pointer transition-colors hover:bg-[#252A3A]"
                          title="Download PDF"><Download size={13} color="#94A3B8" /></button>
                        {inv.status !== "paid" && (
                          <>
                            <button onClick={() => handleMarkPaid(inv)}
                              className="flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer"
                              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10B981" }}>
                              <CheckCircle size={10} /> Paid
                            </button>
                            <button onClick={() => handleSendPayLink(inv)}
                              disabled={paying === inv.id}
                              className="flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer disabled:opacity-50"
                              style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#9D6FEF" }}>
                              {paying === inv.id ? (
                                <span className="w-3 h-3 rounded-full border border-purple-400 border-t-transparent animate-spin" />
                              ) : <><CreditCard size={10} /> Pay Link</>}
                            </button>
                          </>
                        )}
                        {inv.stripeCheckoutUrl && (
                          <button onClick={() => window.open(inv.stripeCheckoutUrl, "_blank")}
                            className="p-1.5 rounded cursor-pointer transition-colors hover:bg-[#252A3A]"
                            title="Open payment link"><ExternalLink size={13} color="#9D6FEF" /></button>
                        )}
                        <button onClick={() => handleEmailInvoice(inv)}
                          disabled={emailing === inv.id}
                          className="p-1.5 rounded cursor-pointer transition-colors hover:bg-[#252A3A] disabled:opacity-50"
                          title="Email invoice to client">
                          {emailing === inv.id
                            ? <span className="w-3 h-3 rounded-full border border-purple-400 border-t-transparent animate-spin inline-block" />
                            : <Mail size={13} color="#94A3B8" />}
                        </button>
                        <button onClick={() => handleDelete(inv.id)}
                          className="p-1.5 rounded cursor-pointer transition-colors hover:bg-red-900/20"
                          title="Delete"><Trash2 size={13} color="#EF4444" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment progress bars */}
      {filtered.length > 0 && (
        <div className="empire-card p-5">
          <h3 className="font-semibold text-white mb-4">Payment Breakdown</h3>
          <div className="space-y-3">
            {filtered.map(inv => (
              <div key={inv.id} className="flex items-center gap-4">
                <span className="text-sm font-medium text-white w-44 truncate">{inv.clientName}</span>
                <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, background: "#1C2030" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${inv.amount > 0 ? Math.min(100, (inv.paid/inv.amount)*100) : 0}%`,
                      background: inv.status === "paid" ? "#10B981" : inv.status === "overdue" ? "#EF4444" : "#F59E0B",
                    }} />
                </div>
                <span className="text-xs font-mono w-12 text-right" style={{ color: "#94A3B8" }}>
                  {inv.amount > 0 ? Math.round((inv.paid/inv.amount)*100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-2xl w-full max-w-lg p-6 my-8 animate-fade-in-up" style={{ background: "#141824", border: "1px solid #252A3A" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{editing ? "Edit Invoice" : "New Invoice"}</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg cursor-pointer hover:bg-[#1C2030]"><X size={18} color="#94A3B8" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Client Name *</label>
                  <input value={form.clientName || ""} onChange={e => setForm(p => ({...p, clientName: e.target.value}))}
                    className="empire-input w-full" placeholder="John Smith" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Client Email</label>
                  <input type="email" value={form.clientEmail || ""} onChange={e => setForm(p => ({...p, clientEmail: e.target.value}))}
                    className="empire-input w-full" placeholder="john@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Event</label>
                <select value={form.eventId || ""} onChange={e => setForm(p => ({...p, eventId: e.target.value}))}
                  className="empire-input w-full">
                  <option value="">— Select Event —</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Total Amount ($) *</label>
                  <input type="number" min="0" value={form.amount || ""} onChange={e => setForm(p => ({...p, amount: parseFloat(e.target.value)||0}))}
                    className="empire-input w-full" placeholder="2500" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Amount Paid ($)</label>
                  <input type="number" min="0" value={form.paid || ""} onChange={e => setForm(p => ({...p, paid: parseFloat(e.target.value)||0}))}
                    className="empire-input w-full" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Due Date</label>
                <input type="date" value={form.dueDate || ""} onChange={e => setForm(p => ({...p, dueDate: e.target.value}))}
                  className="empire-input w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Notes</label>
                <textarea rows={3} value={form.notes || ""} onChange={e => setForm(p => ({...p, notes: e.target.value}))}
                  className="empire-input w-full resize-none" placeholder="Deposit 50%, balance due 7 days before event..." />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={closeModal} className="px-4 py-2 rounded-lg text-sm cursor-pointer"
                style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#94A3B8" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="empire-btn-primary px-6 py-2 text-sm disabled:opacity-50">
                {saving ? "Saving…" : editing ? "Save Changes" : "Create Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
