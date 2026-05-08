import { useState, useEffect } from "react";
import {
  Music, Calendar, FileText, DollarSign, Star, Clock, MapPin,
  Send, CheckCircle, Edit2, Save, X, Plus, Trash2, Mail,
  Phone, Home, Package, ChevronDown, ChevronUp,
  Loader2, ExternalLink, Link
} from "lucide-react";

interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  website?: string;
  [key: string]: string | undefined;
}

interface ClientInfo {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  socialLinks?: SocialLinks;
}

interface PortalData {
  client: ClientInfo;
  event: any;
  contracts: any[];
  invoices: any[];
  packages: any[];
  songRequests: any[];
  portalTokenId: string;
}

const SOCIAL_ICONS: Record<string, any> = {
  instagram: Link,
  twitter: Link,
  facebook: Link,
  youtube: Link,
};

const SOCIAL_PLACEHOLDERS: Record<string, string> = {
  instagram: "@yourusername",
  tiktok: "@yourtiktok",
  twitter: "@yourtwitter",
  facebook: "facebook.com/yourpage",
  youtube: "youtube.com/@channel",
  website: "yourwebsite.com",
};

function Section({ title, icon: Icon, children, collapsible = false }: any) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#141824", border: "1px solid #1E2435" }}>
      <div
        className={`flex items-center justify-between px-6 py-4 ${collapsible ? "cursor-pointer" : ""}`}
        onClick={collapsible ? () => setOpen(o => !o) : undefined}
        style={{ borderBottom: open ? "1px solid #1E2435" : "none" }}
      >
        <div className="flex items-center gap-2">
          <Icon size={18} color="#7C3AED" />
          <h2 className="font-bold text-white">{title}</h2>
        </div>
        {collapsible && (open ? <ChevronUp size={16} style={{ color: "#475569" }} /> : <ChevronDown size={16} style={{ color: "#475569" }} />)}
      </div>
      {open && <div className="px-6 py-5">{children}</div>}
    </div>
  );
}

export default function Portal() {
  const token = new URLSearchParams(window.location.search).get("token");

  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Editable client state
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<ClientInfo>({ name: "", email: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // Song request
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [reqType, setReqType] = useState("request");
  const [submittingSong, setSubmittingSong] = useState(false);
  const [songSubmitted, setSongSubmitted] = useState(false);

  // Package request modal
  const [pkgModal, setPkgModal] = useState<any | null>(null);
  const [pkgMessage, setPkgMessage] = useState("");
  const [submittingPkg, setSubmittingPkg] = useState(false);

  // Send summary
  const [sendingSummary, setSendingSummary] = useState(false);
  const [summarySent, setSummarySent] = useState(false);

  // Meeting request
  const [meetingModal, setMeetingModal] = useState(false);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingMessage, setMeetingMessage] = useState("");
  const [submittingMeeting, setSubmittingMeeting] = useState(false);
  const [meetingSubmitted, setMeetingSubmitted] = useState(false);

  // Package selection (saved locally + DB)
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [savingSelection, setSavingSelection] = useState(false);
  const [selectionSaved, setSelectionSaved] = useState(false);

  useEffect(() => {
    if (!token) { setError("No access token provided."); setLoading(false); return; }
    fetch(`/api/portal/token/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject("Invalid token"))
      .then((d: PortalData) => {
        setData(d);
        setEditForm({ ...d.client, socialLinks: d.client.socialLinks || {} });
      })
      .catch(() => setError("This link is invalid or has expired."))
      .finally(() => setLoading(false));
  }, [token]);

  const saveProfile = async () => {
    if (!token) return;
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/portal/client/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error();
      setData(prev => prev ? { ...prev, client: { ...editForm } } : prev);
      setEditMode(false);
    } catch { alert("Failed to save — please try again."); }
    finally { setSavingProfile(false); }
  };

  const handleSongRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitle.trim()) return;
    setSubmittingSong(true);
    try {
      await fetch("/api/portal/song-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: data?.event?.id,
          clientName: data?.client?.name,
          songTitle, artist, requestType: reqType, token,
        }),
      });
      setSongSubmitted(true);
      setSongTitle(""); setArtist("");
    } catch { alert("Failed to submit song request."); }
    finally { setSubmittingSong(false); }
  };

  const handlePackageRequest = async () => {
    if (!pkgModal || !token) return;
    setSubmittingPkg(true);
    try {
      await fetch("/api/portal/package-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          packageId: pkgModal.id,
          packageName: pkgModal.name,
          requestType: "addon",
          message: pkgMessage,
        }),
      });
      setPkgModal(null); setPkgMessage("");
      alert("Request sent! Randy will review and follow up.");
    } catch { alert("Failed to submit request."); }
    finally { setSubmittingPkg(false); }
  };

  const handleMeetingRequest = async () => {
    if (!token) return;
    setSubmittingMeeting(true);
    try {
      await fetch("/api/portal/request-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, date: meetingDate, time: meetingTime, message: meetingMessage }),
      });
      setMeetingSubmitted(true);
      setMeetingModal(false);
      setMeetingDate(""); setMeetingTime(""); setMeetingMessage("");
    } catch { alert("Failed to submit — please try again."); }
    finally { setSubmittingMeeting(false); }
  };

  const handleSavePackageSelection = async () => {
    if (!token || !selectedPackageId) return;
    setSavingSelection(true);
    try {
      const pkg = data?.packages.find((p: any) => p.id === selectedPackageId);
      await fetch("/api/portal/package-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          packageId: selectedPackageId,
          packageName: pkg?.name || selectedPackageId,
          requestType: "selection",
          message: selectedAddons.length > 0 ? `Add-ons: ${selectedAddons.join(", ")}` : "",
        }),
      });
      setSelectionSaved(true);
      setTimeout(() => setSelectionSaved(false), 3000);
    } catch { alert("Failed to save selection."); }
    finally { setSavingSelection(false); }
  };

  const handleSendSummary = async () => {
    if (!token) return;
    setSendingSummary(true);
    try {
      const res = await fetch("/api/portal/send-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error();
      setSummarySent(true);
      setTimeout(() => setSummarySent(false), 4000);
    } catch { alert("Failed to send summary email."); }
    finally { setSendingSummary(false); }
  };

  const setSocial = (key: string, val: string) => {
    setEditForm(f => ({ ...f, socialLinks: { ...(f.socialLinks || {}), [key]: val } }));
  };

  // ── Loading / Error states ────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D1117" }}>
      <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8" style={{ background: "#0D1117" }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}>
        <Music size={28} color="#9D6FEF" />
      </div>
      <h1 className="text-2xl font-bold text-white">Roman Sounds</h1>
      <p style={{ color: "#EF4444" }}>{error}</p>
      <p className="text-sm text-center max-w-sm" style={{ color: "#475569" }}>
        Please contact Randy at <a href="mailto:randy@romansounds.com" className="text-purple-400">randy@romansounds.com</a> for a new link.
      </p>
    </div>
  );

  const event = data?.event;
  const contract = data?.contracts?.[0];
  const invoice = data?.invoices?.[0];
  const client = data?.client;
  const socialLinks = editMode ? (editForm.socialLinks || {}) : (client?.socialLinks || {});

  return (
    <div className="min-h-screen" style={{ background: "#0D1117", color: "#F1F5F9" }}>
      {/* Header */}
      <div style={{ background: "#141824", borderBottom: "1px solid #1E2435" }}>
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}>
              <Music size={18} color="white" />
            </div>
            <div>
              <p className="font-bold text-white leading-tight">Roman Sounds</p>
              <p className="text-xs" style={{ color: "#475569" }}>DJ Randy Roman · Client Portal</p>
            </div>
          </div>
          {client && (
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{client.name}</p>
              <p className="text-xs" style={{ color: "#475569" }}>{client.email}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">

        {/* Welcome banner */}
        <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(168,85,247,0.1))", border: "1px solid rgba(124,58,237,0.3)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Welcome, {client?.name?.split(" ")[0]}! 🎵</h1>
              <p style={{ color: "#94A3B8" }}>Your personal event hub with Roman Sounds. Everything in one place.</p>
            </div>
            <button
              onClick={handleSendSummary}
              disabled={sendingSummary}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer flex-shrink-0"
              style={{ background: "rgba(124,58,237,0.3)", border: "1px solid rgba(124,58,237,0.5)", color: "#C4B5FD" }}
            >
              {sendingSummary
                ? <Loader2 size={12} className="animate-spin" />
                : summarySent
                ? <CheckCircle size={12} />
                : <Mail size={12} />}
              {summarySent ? "Sent!" : "Email My Summary"}
            </button>
          </div>
        </div>

        {/* ── Contact Info ─────────────────────────────────────────────────── */}
        <Section title="Your Information" icon={Phone}>
          {!editMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Phone, label: "Phone", val: client?.phone || "—" },
                  { icon: Mail, label: "Email", val: client?.email || "—" },
                  { icon: Home, label: "Address", val: client?.address || "—" },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(124,58,237,0.1)" }}>
                      <item.icon size={14} color="#9D6FEF" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: "#475569" }}>{item.label}</p>
                      <p className="text-sm text-white break-all">{item.val}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social links */}
              {Object.entries(client?.socialLinks || {}).some(([, v]) => v) && (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#475569" }}>Social Links</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(client?.socialLinks || {}).filter(([, v]) => v).map(([k, v]) => (
                      <a key={k} href={v!.startsWith("http") ? v! : `https://${v!}`} target="_blank"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: "#1C2030", color: "#9D6FEF", border: "1px solid #252A3A" }}>
                        <ExternalLink size={11} /> {k}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {client?.notes && (
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#475569" }}>Notes</p>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: "#94A3B8" }}>{client.notes}</p>
                </div>
              )}

              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#9D6FEF" }}
              >
                <Edit2 size={13} /> Edit My Info
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Edit form */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "name", label: "Full Name", icon: null },
                  { key: "phone", label: "Phone", icon: null },
                  { key: "address", label: "Address", icon: null },
                ].map(f => (
                  <div key={f.key} className={f.key === "address" ? "col-span-2" : ""}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>{f.label}</label>
                    <input
                      value={(editForm as any)[f.key] || ""}
                      onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
                      style={{ background: "#1C2030", border: "1px solid #252A3A" }}
                    />
                  </div>
                ))}
              </div>

              {/* Social links */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "#94A3B8" }}>Social Media Links</p>
                <div className="space-y-2">
                  {["instagram", "tiktok", "twitter", "facebook", "youtube", "website"].map(platform => (
                    <div key={platform} className="flex items-center gap-2">
                      <span className="w-20 text-xs capitalize" style={{ color: "#64748B" }}>{platform}</span>
                      <input
                        value={(editForm.socialLinks || {})[platform] || ""}
                        onChange={e => setSocial(platform, e.target.value)}
                        placeholder={SOCIAL_PLACEHOLDERS[platform]}
                        className="flex-1 px-3 py-2 rounded-lg text-sm text-white outline-none"
                        style={{ background: "#1C2030", border: "1px solid #252A3A" }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Personal Notes</label>
                <textarea
                  value={editForm.notes || ""}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Any notes, preferences, or special requests..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none resize-none"
                  style={{ background: "#1C2030", border: "1px solid #252A3A" }}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setEditMode(false); setEditForm({ ...client!, socialLinks: client?.socialLinks || {} }); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                  style={{ background: "#1C2030", color: "#94A3B8", border: "1px solid #252A3A" }}
                >
                  <X size={13} /> Cancel
                </button>
                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white" }}
                >
                  {savingProfile ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </Section>

        {/* ── Event Details ─────────────────────────────────────────────────── */}
        {event && (
          <Section title="Your Event" icon={Calendar}>
            <h3 className="text-xl font-bold text-white mb-4">{event.title}</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Calendar, label: "Date", val: event.date ? new Date(event.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "—" },
                { icon: Clock, label: "Time", val: event.time || "—" },
                { icon: MapPin, label: "Venue", val: event.venue || "—" },
                { icon: Star, label: "Type", val: event.type || "Custom Event" },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(124,58,237,0.1)" }}>
                    <item.icon size={14} color="#9D6FEF" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: "#475569" }}>{item.label}</p>
                    <p className="text-sm text-white">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Contract ──────────────────────────────────────────────────────── */}
        {contract && (
          <Section title="Contract" icon={FileText}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white">{contract.title || "DJ Services Agreement"}</p>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${contract.status === "signed" ? "text-green-400 bg-green-400/10" : "text-yellow-400 bg-yellow-400/10"}`}>
                {contract.status === "signed" ? "✓ Signed" : "Needs Signature"}
              </span>
            </div>
            {contract.status !== "signed" ? (
              <a href={`/portal/sign/${contract.id}${token ? `?token=${token}` : ""}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white" }}>
                <FileText size={15} /> Review & Sign Contract
              </a>
            ) : (
              <a href={`/api/pdf/contract/${contract.id}`} target="_blank"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#9D6FEF" }}>
                <ExternalLink size={14} /> Download Contract PDF
              </a>
            )}
          </Section>
        )}

        {/* ── Invoice ───────────────────────────────────────────────────────── */}
        {invoice && (
          <Section title="Invoice & Payment" icon={DollarSign}>
            <div className="flex items-center justify-between mb-4">
              <div />
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${invoice.status === "paid" ? "text-green-400 bg-green-400/10" : invoice.status === "overdue" ? "text-red-400 bg-red-400/10" : "text-yellow-400 bg-yellow-400/10"}`}>
                {invoice.status === "paid" ? "✓ Paid" : invoice.status === "overdue" ? "Overdue" : "Payment Due"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Total", val: `$${(invoice.amount || 0).toLocaleString()}` },
                { label: "Paid", val: `$${(invoice.paid || 0).toLocaleString()}` },
                { label: "Balance Due", val: `$${(invoice.due || 0).toLocaleString()}` },
              ].map(item => (
                <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: "#1C2030" }}>
                  <p className="text-lg font-bold text-white">{item.val}</p>
                  <p className="text-xs" style={{ color: "#475569" }}>{item.label}</p>
                </div>
              ))}
            </div>
            {invoice.status !== "paid" && invoice.due > 0 && (
              invoice.stripeCheckoutUrl ? (
                <a href={invoice.stripeCheckoutUrl} target="_blank"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white" }}>
                  <DollarSign size={15} /> Pay ${(invoice.due || 0).toLocaleString()} Now
                </a>
              ) : invoice.payToken ? (
                <a href={`/portal/pay/${invoice.payToken}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white" }}>
                  <DollarSign size={15} /> Pay ${(invoice.due || 0).toLocaleString()} Now
                </a>
              ) : (
                <p className="text-sm" style={{ color: "#94A3B8" }}>Contact Randy to arrange payment.</p>
              )
            )}
            {invoice.status === "paid" && (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">Payment complete — thank you!</span>
              </div>
            )}
          </Section>
        )}

        {/* ── Packages ──────────────────────────────────────────────────────── */}
        {(data?.packages?.length ?? 0) > 0 && (
          <Section title="Packages & Add-ons" icon={Package} collapsible>
            <p className="text-sm mb-4" style={{ color: "#94A3B8" }}>Select a package below. Randy will confirm details and pricing.</p>

            {/* View My Selection banner */}
            {selectedPackageId && (
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl mb-4" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)" }}>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} color="#9D6FEF" />
                  <span className="text-sm font-medium" style={{ color: "#C4B5FD" }}>
                    Selected: {data!.packages.find((p: any) => p.id === selectedPackageId)?.name}
                    {selectedAddons.length > 0 ? ` + ${selectedAddons.length} add-on${selectedAddons.length > 1 ? "s" : ""}` : ""}
                  </span>
                </div>
                <button
                  onClick={handleSavePackageSelection}
                  disabled={savingSelection}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: selectionSaved ? "rgba(16,185,129,0.2)" : "#7C3AED", color: selectionSaved ? "#10B981" : "#fff" }}
                >
                  {savingSelection ? <Loader2 size={11} className="animate-spin" /> : selectionSaved ? <CheckCircle size={11} /> : <Send size={11} />}
                  {selectionSaved ? "Sent!" : "Send to Randy"}
                </button>
              </div>
            )}

            <div className="space-y-3">
              {data!.packages.map((pkg: any) => {
                const isSelected = selectedPackageId === pkg.id;
                const addons: string[] = pkg.addons ? (typeof pkg.addons === "string" ? JSON.parse(pkg.addons) : pkg.addons) : [];
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(isSelected ? null : pkg.id)}
                    className="p-4 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: isSelected ? "rgba(124,58,237,0.12)" : "#1C2030",
                      border: `1px solid ${isSelected ? "#7C3AED" : "#252A3A"}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: isSelected ? "#7C3AED" : "#334155" }}>
                            {isSelected && <div className="w-2 h-2 rounded-full" style={{ background: "#7C3AED" }} />}
                          </div>
                          <p className="font-semibold text-white text-sm">{pkg.name}</p>
                          {pkg.popular && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(124,58,237,0.2)", color: "#9D6FEF" }}>Popular</span>}
                        </div>
                        {pkg.description && <p className="text-xs ml-6 mb-1" style={{ color: "#64748B" }}>{pkg.description}</p>}
                        <p className="text-sm font-bold ml-6" style={{ color: "#9D6FEF" }}>${(pkg.price || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    {/* Add-ons */}
                    {isSelected && addons.length > 0 && (
                      <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(124,58,237,0.2)" }}>
                        <p className="text-xs font-semibold mb-2" style={{ color: "#94A3B8" }}>Add-ons (optional)</p>
                        <div className="flex flex-wrap gap-2">
                          {addons.map((addon: string) => {
                            const hasAddon = selectedAddons.includes(addon);
                            return (
                              <button
                                key={addon}
                                onClick={e => { e.stopPropagation(); setSelectedAddons(prev => hasAddon ? prev.filter(a => a !== addon) : [...prev, addon]); }}
                                className="text-xs px-3 py-1 rounded-full font-medium transition-all"
                                style={{
                                  background: hasAddon ? "rgba(124,58,237,0.3)" : "#252A3A",
                                  color: hasAddon ? "#C4B5FD" : "#64748B",
                                  border: `1px solid ${hasAddon ? "rgba(124,58,237,0.5)" : "transparent"}`,
                                }}
                              >
                                {hasAddon ? "✓ " : "+ "}{addon}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── Request a Meeting ─────────────────────────────────────────────── */}
        <Section title="Request a Meeting" icon={Calendar} collapsible>
          {meetingSubmitted ? (
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
              <CheckCircle size={20} color="#10B981" />
              <div>
                <p className="text-sm font-semibold" style={{ color: "#10B981" }}>Meeting request sent!</p>
                <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Randy will reach out to confirm a time.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "#94A3B8" }}>Request a consultation or planning session with Randy.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Preferred Date</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={e => setMeetingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                    style={{ background: "#1C2030", border: "1px solid #252A3A", colorScheme: "dark" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Preferred Time</label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={e => setMeetingTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                    style={{ background: "#1C2030", border: "1px solid #252A3A", colorScheme: "dark" }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>What's this about? (optional)</label>
                <textarea
                  value={meetingMessage}
                  onChange={e => setMeetingMessage(e.target.value)}
                  rows={2}
                  placeholder="Planning discussion, music selection, timeline review..."
                  className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
                  style={{ background: "#1C2030", border: "1px solid #252A3A" }}
                />
              </div>
              <button
                onClick={handleMeetingRequest}
                disabled={submittingMeeting}
                className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                style={{ background: submittingMeeting ? "#5B21B6" : "#7C3AED" }}
              >
                {submittingMeeting ? <Loader2 size={15} className="animate-spin" /> : <Calendar size={15} />}
                {submittingMeeting ? "Sending..." : "Request Meeting"}
              </button>
            </div>
          )}
        </Section>

        {/* ── Song Requests ─────────────────────────────────────────────────── */}
        <Section title="Song Requests" icon={Music}>
          <p className="text-sm mb-4" style={{ color: "#94A3B8" }}>Request songs, must-plays, do-not-plays, or special dance songs.</p>

          {/* Existing requests */}
          {(data?.songRequests?.length ?? 0) > 0 && (
            <div className="mb-4 space-y-2">
              {data!.songRequests.map(sr => (
                <div key={sr.id} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: "#1C2030" }}>
                  <Music size={12} style={{ color: "#7C3AED", flexShrink: 0 }} />
                  <span className="text-sm text-white flex-1 truncate">{sr.title}</span>
                  {sr.artist && <span className="text-xs" style={{ color: "#475569" }}>{sr.artist}</span>}
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>
                    {sr.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {songSubmitted && (
            <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
              <CheckCircle size={15} color="#10B981" />
              <span className="text-sm" style={{ color: "#10B981" }}>Request submitted! Randy will review it.</span>
            </div>
          )}

          <form onSubmit={handleSongRequest} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#94A3B8" }}>Song Title *</label>
                <input value={songTitle} onChange={e => setSongTitle(e.target.value)} required
                  className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                  style={{ background: "#1C2030", border: "1px solid #252A3A" }}
                  placeholder="Enter song title" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#94A3B8" }}>Artist</label>
                <input value={artist} onChange={e => setArtist(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                  style={{ background: "#1C2030", border: "1px solid #252A3A" }}
                  placeholder="Artist name" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#94A3B8" }}>Request Type</label>
              <select value={reqType} onChange={e => setReqType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: "#1C2030", border: "1px solid #252A3A" }}>
                <option value="request">Song Request</option>
                <option value="must_play">Must Play</option>
                <option value="do_not_play">Do Not Play</option>
                <option value="first_dance">First Dance</option>
                <option value="last_dance">Last Dance</option>
              </select>
            </div>
            <button type="submit" disabled={submittingSong || !songTitle.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white" }}>
              {submittingSong ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Submit Request
            </button>
          </form>
        </Section>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs" style={{ color: "#334155" }}>
            Questions? Contact <a href="mailto:randy@romansounds.com" className="text-purple-400">randy@romansounds.com</a>
            <br />Roman Sounds · Randy Delgado dba DJ Randy Roman
          </p>
        </div>

      </div>

      {/* Package Request Modal */}
      {pkgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: "#141824", border: "1px solid #1E2435" }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Request: {pkgModal.name}</h3>
              <button onClick={() => setPkgModal(null)} style={{ color: "#475569" }}><X size={18} /></button>
            </div>
            <div className="p-3 rounded-xl" style={{ background: "#1C2030", border: "1px solid #252A3A" }}>
              <p className="text-sm text-white font-semibold">${(pkgModal.price || 0).toLocaleString()}</p>
              {pkgModal.description && <p className="text-xs mt-1" style={{ color: "#64748B" }}>{pkgModal.description}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Message to Randy (optional)</label>
              <textarea
                value={pkgMessage}
                onChange={e => setPkgMessage(e.target.value)}
                rows={3}
                placeholder="Any specific questions or details about this package..."
                className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none resize-none"
                style={{ background: "#1C2030", border: "1px solid #252A3A" }}
              />
            </div>
            <p className="text-xs" style={{ color: "#475569" }}>Randy will review your request and follow up with pricing confirmation. This does not automatically charge you.</p>
            <div className="flex gap-2">
              <button onClick={() => setPkgModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: "#1C2030", color: "#94A3B8", border: "1px solid #252A3A" }}>Cancel</button>
              <button
                onClick={handlePackageRequest}
                disabled={submittingPkg}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white" }}
              >
                {submittingPkg ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
