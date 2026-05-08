import { useState, useEffect } from "react";
import Layout from "../components/layout/Layout";
import { authClient } from "../lib/auth";
import { api } from "../lib/api";
import { toast } from "../lib/toast";
import { useLocation } from "wouter";
import {
  User, Bell, Palette, Globe, Shield, CreditCard, LogOut,
  Save, Loader2, CheckCircle, Eye, EyeOff,
} from "lucide-react";

const SECTIONS = [
  { id: "profile",       label: "Profile",       icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance",    label: "Appearance",    icon: Palette },
  { id: "integrations",  label: "Integrations",  icon: Globe },
  { id: "security",      label: "Security",      icon: Shield },
  { id: "billing",       label: "Billing",       icon: CreditCard },
];

// ── Profile ─────────────────────────────────────────────────────────────────
function ProfileSection() {
  const { data: session, refetch } = authClient.useSession();

  const [form, setForm] = useState({
    name: "", email: "", phone: "", businessName: "", website: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Seed form from session + localStorage extras (only on mount or session change)
  useEffect(() => {
    if (!session?.user?.id) return;
    const extras = JSON.parse(localStorage.getItem("crm_profile_extras") || "{}");
    const savedExtras = {
      phone:        extras.phone          || "",
      businessName: extras.businessName   || "Roman Sounds",
      website:      extras.website        || "https://romansounds.com",
    };
    setForm({
      name:  session.user.name   || "",
      email: session.user.email  || "",
      ...savedExtras,
    });
  }, [session?.user?.id]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      // Update auth user name via better-auth
      if (form.name !== session?.user?.name) {
        const res = await authClient.updateUser({ name: form.name });
        if (res.error) throw new Error(res.error.message);
      }
      // Persist extras in localStorage (phone, businessName, website not in auth table)
      const savedExtras = {
        phone:        form.phone,
        businessName: form.businessName,
        website:      form.website,
      };
      localStorage.setItem("crm_profile_extras", JSON.stringify(savedExtras));
      await refetch?.();
      // Confirm state after save
      setForm({
        name:  form.name,
        email: form.email,
        ...savedExtras,
      });
      setSaved(true);
      toast.success("Profile saved");
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      toast.error(e.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const fields: { label: string; key: keyof typeof form; type: string; placeholder: string }[] = [
    { label: "Full Name",      key: "name",         type: "text",  placeholder: "Randy Roman" },
    { label: "Email",          key: "email",         type: "email", placeholder: "randy@romansounds.com" },
    { label: "Phone",          key: "phone",         type: "tel",   placeholder: "+1 555-0100" },
    { label: "Business Name",  key: "businessName",  type: "text",  placeholder: "Roman Sounds" },
    { label: "Website",        key: "website",       type: "url",   placeholder: "https://romansounds.com" },
  ];

  return (
    <div className="empire-card p-6">
      <h3 className="font-semibold text-white mb-6" style={{ fontFamily: "Syne, sans-serif" }}>Profile Settings</h3>

      {/* Avatar */}
      <div className="flex items-center gap-5 mb-6 pb-6" style={{ borderBottom: "1px solid #252A3A" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#7C3AED,#9D6FEF)", color: "white" }}>
          {form.name?.charAt(0)?.toUpperCase() || "R"}
        </div>
        <div>
          <p className="font-semibold text-white">{form.name || "—"}</p>
          <p className="text-sm" style={{ color: "#94A3B8" }}>{form.email}</p>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#94A3B8" }}>{f.label}</label>
            <input
              type={f.type}
              value={form[f.key]}
              placeholder={f.placeholder}
              disabled={f.key === "email"} // email change requires verification flow
              onChange={set(f.key)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: f.key === "email" ? "#161B27" : "#1C2030",
                border: "1px solid #252A3A",
                color: f.key === "email" ? "#475569" : "#F1F5F9",
                cursor: f.key === "email" ? "not-allowed" : "text",
              }}
              onFocus={e => f.key !== "email" && (e.target.style.borderColor = "#7C3AED")}
              onBlur={e => (e.target.style.borderColor = "#252A3A")}
            />
            {f.key === "email" && (
              <p className="text-xs mt-1" style={{ color: "#475569" }}>Email changes require verification — contact support</p>
            )}
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer mt-2"
          style={{ background: saved ? "#10B981" : "linear-gradient(135deg,#7C3AED,#9D6FEF)" }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── Notifications ────────────────────────────────────────────────────────────
const DEFAULT_NOTIFS = [
  { key: "new_lead",           label: "New lead inquiry",   desc: "When someone submits a booking form",   enabled: true },
  { key: "contract_signed",    label: "Contract signed",    desc: "When a client signs a contract",        enabled: true },
  { key: "payment_received",   label: "Payment received",   desc: "When a payment is made",                enabled: true },
  { key: "song_request",       label: "Song request",       desc: "Live song requests during events",      enabled: true },
  { key: "event_reminder",     label: "Event reminder",     desc: "24 hours before an event",              enabled: true },
  { key: "invoice_overdue",    label: "Invoice overdue",    desc: "When a payment is past due",            enabled: false },
  { key: "new_message",        label: "New message",        desc: "Incoming SMS or email",                 enabled: true },
  { key: "workflow_completed", label: "Workflow completed", desc: "When an automation runs",               enabled: false },
];

function NotificationsSection() {
  const LS_KEY = "crm_notification_prefs";
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
      const defaults: Record<string, boolean> = {};
      DEFAULT_NOTIFS.forEach(n => { defaults[n.key] = n.enabled; });
      return { ...defaults, ...stored };
    } catch { return Object.fromEntries(DEFAULT_NOTIFS.map(n => [n.key, n.enabled])); }
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (key: string) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem(LS_KEY, JSON.stringify(prefs));
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      toast.success("Notification preferences saved");
      setTimeout(() => setSaved(false), 2500);
    }, 400);
  };

  return (
    <div className="empire-card p-6">
      <h3 className="font-semibold text-white mb-6" style={{ fontFamily: "Syne, sans-serif" }}>Notification Preferences</h3>
      <div className="space-y-1 mb-6">
        {DEFAULT_NOTIFS.map(n => (
          <div key={n.key} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #1C2030" }}>
            <div>
              <p className="text-sm font-medium text-white">{n.label}</p>
              <p className="text-xs" style={{ color: "#475569" }}>{n.desc}</p>
            </div>
            <button
              onClick={() => toggle(n.key)}
              className="cursor-pointer rounded-full transition-all flex-shrink-0 relative"
              style={{ width: 44, height: 24, background: prefs[n.key] ? "#7C3AED" : "#252A3A" }}
              aria-label={`Toggle ${n.label}`}
            >
              <div className="absolute top-1 rounded-full transition-all"
                style={{ width: 16, height: 16, background: "white", left: prefs[n.key] ? 24 : 4 }} />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
        style={{ background: saved ? "#10B981" : "linear-gradient(135deg,#7C3AED,#9D6FEF)" }}
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
        {saving ? "Saving..." : saved ? "Saved!" : "Save Preferences"}
      </button>
    </div>
  );
}

// ── Appearance ───────────────────────────────────────────────────────────────
const THEMES = [
  { label: "Empire Purple", color: "#7C3AED" },
  { label: "Ocean Blue",    color: "#3B82F6" },
  { label: "Emerald",       color: "#10B981" },
  { label: "Gold Rush",     color: "#F59E0B" },
];
const SIZES = ["Compact", "Normal", "Wide"];

function AppearanceSection() {
  const LS_KEY = "crm_appearance";
  const [themeColor, setThemeColor] = useState<string>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
      return saved.themeColor || "#7C3AED";
    } catch {
      return "#7C3AED";
    }
  });
  const [sidebarSize, setSidebarSize] = useState<string>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
      return saved.sidebarSize || "Normal";
    } catch {
      return "Normal";
    }
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem(LS_KEY, JSON.stringify({ themeColor, sidebarSize }));
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      toast.success("Appearance saved");
      setTimeout(() => setSaved(false), 2500);
    }, 400);
  };

  return (
    <div className="empire-card p-6">
      <h3 className="font-semibold text-white mb-6" style={{ fontFamily: "Syne, sans-serif" }}>Appearance</h3>
      <div className="space-y-6">
        {/* Color Theme */}
        <div>
          <p className="text-sm font-medium text-white mb-3">Color Theme</p>
          <div className="grid grid-cols-4 gap-3">
            {THEMES.map(t => {
              const active = themeColor === t.color;
              return (
                <div key={t.label} onClick={() => setThemeColor(t.color)}
                  className="p-3 rounded-xl cursor-pointer text-center transition-all"
                  style={{ border: `2px solid ${active ? t.color : "#252A3A"}`, background: active ? `${t.color}18` : "#1C2030" }}>
                  <div className="w-8 h-8 rounded-full mx-auto mb-2" style={{ background: t.color }} />
                  <p className="text-xs" style={{ color: active ? t.color : "#94A3B8" }}>{t.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar size */}
        <div>
          <p className="text-sm font-medium text-white mb-3">Sidebar Size</p>
          <div className="flex gap-3">
            {SIZES.map(s => {
              const active = sidebarSize === s;
              return (
                <button key={s} onClick={() => setSidebarSize(s)}
                  className="px-4 py-2 rounded-lg text-sm cursor-pointer"
                  style={{
                    background: active ? "rgba(124,58,237,0.15)" : "#1C2030",
                    border: `1px solid ${active ? "#7C3AED" : "#252A3A"}`,
                    color: active ? "#9D6FEF" : "#94A3B8",
                  }}>
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
          style={{ background: saved ? "#10B981" : "linear-gradient(135deg,#7C3AED,#9D6FEF)" }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Appearance"}
        </button>
      </div>
    </div>
  );
}

// ── Integrations ─────────────────────────────────────────────────────────────
const INTEGRATIONS = [
  { name: "Stripe",        desc: "Payment processing",   connected: true,  color: "#635BFF" },
  { name: "Twilio",        desc: "SMS messaging",        connected: true,  color: "#F22F46" },
  { name: "Resend",        desc: "Email delivery",       connected: true,  color: "#7C3AED" },
  { name: "Google Cal",    desc: "Calendar sync",        connected: false, color: "#4285F4" },
  { name: "Zoom",          desc: "Video meetings",       connected: false, color: "#2D8CFF" },
  { name: "Google Meet",   desc: "Video meetings",       connected: false, color: "#00897B" },
  { name: "Spotify",       desc: "Playlist integration", connected: false, color: "#1DB954" },
  { name: "Microsoft 365", desc: "Calendar & Teams",     connected: false, color: "#0078D4" },
];

function IntegrationsSection() {
  return (
    <div className="empire-card p-6">
      <h3 className="font-semibold text-white mb-6" style={{ fontFamily: "Syne, sans-serif" }}>Integrations</h3>
      <div className="space-y-3">
        {INTEGRATIONS.map(i => (
          <div key={i.name} className="flex items-center gap-4 p-4 rounded-xl"
            style={{ background: "#1C2030", border: "1px solid #252A3A" }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: `${i.color}20`, color: i.color }}>
              {i.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{i.name}</p>
              <p className="text-xs" style={{ color: "#475569" }}>{i.desc}</p>
            </div>
            <button
              onClick={() => i.connected ? undefined : toast.info(`${i.name} integration — coming soon`)}
              className="px-4 py-2 rounded-lg text-xs font-medium cursor-pointer"
              style={{
                background: i.connected ? "rgba(16,185,129,0.1)" : "rgba(124,58,237,0.1)",
                border: `1px solid ${i.connected ? "rgba(16,185,129,0.2)" : "rgba(124,58,237,0.2)"}`,
                color: i.connected ? "#10B981" : "#9D6FEF",
              }}>
              {i.connected ? "Connected ✓" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Security ─────────────────────────────────────────────────────────────────
function SecuritySection() {
  const [pw, setPw] = useState({ current: "", newPw: "", confirm: "" });
  const [show, setShow] = useState({ current: false, newPw: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const setField = (k: keyof typeof pw) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setPw(p => ({ ...p, [k]: e.target.value }));
  const toggleShow = (k: keyof typeof show) => setShow(p => ({ ...p, [k]: !p[k] }));

  const handleChangePassword = async () => {
    if (!pw.current || !pw.newPw || !pw.confirm) { toast.error("All fields required"); return; }
    if (pw.newPw !== pw.confirm) { toast.error("New passwords don't match"); return; }
    if (pw.newPw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setSaving(true);
    try {
      const res = await authClient.changePassword({
        currentPassword: pw.current,
        newPassword: pw.newPw,
        revokeOtherSessions: false,
      });
      if (res.error) throw new Error(res.error.message);
      setPw({ current: "", newPw: "", confirm: "" });
      setSaved(true);
      toast.success("Password updated");
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      toast.error(e.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const fields: { label: string; key: keyof typeof pw; showKey: keyof typeof show }[] = [
    { label: "Current Password",     key: "current", showKey: "current" },
    { label: "New Password",         key: "newPw",   showKey: "newPw" },
    { label: "Confirm New Password", key: "confirm", showKey: "confirm" },
  ];

  return (
    <div className="empire-card p-6">
      <h3 className="font-semibold text-white mb-6" style={{ fontFamily: "Syne, sans-serif" }}>Security</h3>
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-white mb-1">Change Password</p>
          <p className="text-xs mb-4" style={{ color: "#475569" }}>Keep your account secure with a strong password</p>
          {fields.map(f => (
            <div key={f.key} className="mb-3">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>{f.label}</label>
              <div className="relative">
                <input
                  type={show[f.showKey] ? "text" : "password"}
                  placeholder="••••••••"
                  value={pw[f.key]}
                  onChange={setField(f.key)}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl text-sm outline-none"
                  style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#F1F5F9" }}
                  onFocus={e => (e.target.style.borderColor = "#7C3AED")}
                  onBlur={e => (e.target.style.borderColor = "#252A3A")}
                />
                <button type="button" onClick={() => toggleShow(f.showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: "#475569" }}>
                  {show[f.showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={handleChangePassword}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer mt-1"
            style={{ background: saved ? "#10B981" : "linear-gradient(135deg,#7C3AED,#9D6FEF)" }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Shield size={14} />}
            {saving ? "Updating..." : saved ? "Updated!" : "Update Password"}
          </button>
        </div>

        <div className="pt-5" style={{ borderTop: "1px solid #252A3A" }}>
          <p className="text-sm font-semibold text-white mb-1">Two-Factor Authentication</p>
          <p className="text-xs mb-3" style={{ color: "#475569" }}>Add an extra layer of security to your account</p>
          <button
            onClick={() => toast.info("2FA setup — coming soon")}
            className="px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
            style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#94A3B8" }}
          >
            Enable 2FA
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Billing ───────────────────────────────────────────────────────────────────
function BillingSection() {
  return (
    <div className="empire-card p-6">
      <h3 className="font-semibold text-white mb-6" style={{ fontFamily: "Syne, sans-serif" }}>Billing & Subscription</h3>
      <div className="p-5 rounded-xl mb-5"
        style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">Pro Plan</p>
            <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>Managed by your payment provider</p>
          </div>
          <span className="text-2xl font-bold font-mono" style={{ color: "#F59E0B" }}>
            Active
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { label: "Manage Billing Portal",  danger: false },
          { label: "Download Invoices",      danger: false },
          { label: "Cancel Subscription",    danger: true },
        ].map(({ label, danger }) => (
          <button
            key={label}
            onClick={() => toast.info(`${label} — coming soon`)}
            className="w-full text-left px-4 py-3 rounded-xl text-sm cursor-pointer transition-all"
            style={{ background: "#1C2030", border: "1px solid #252A3A", color: danger ? "#EF4444" : "#94A3B8" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = danger ? "#EF4444" : "#7C3AED")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#252A3A")}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Settings() {
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState("profile");

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/sign-in");
  };

  const panels: Record<string, JSX.Element> = {
    profile:       <ProfileSection />,
    notifications: <NotificationsSection />,
    appearance:    <AppearanceSection />,
    integrations:  <IntegrationsSection />,
    security:      <SecuritySection />,
    billing:       <BillingSection />,
  };

  return (
    <Layout title="Settings" subtitle="Account, preferences, and integrations">
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="empire-card p-3 w-52 flex-shrink-0 h-fit">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all text-left"
              style={{
                background:  activeSection === s.id ? "rgba(124,58,237,0.15)" : "transparent",
                color:       activeSection === s.id ? "#E2D9F3" : "#94A3B8",
                borderRight: activeSection === s.id ? "2px solid #7C3AED" : "2px solid transparent",
              }}
            >
              <s.icon size={16} />
              {s.label}
            </button>
          ))}
          <div className="mt-2 pt-2" style={{ borderTop: "1px solid #252A3A" }}>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all"
              style={{ color: "#EF4444" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {panels[activeSection]}
        </div>
      </div>
    </Layout>
  );
}
