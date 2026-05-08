import { useState, useEffect } from "react";
import Layout from "../components/layout/Layout";
import { api } from "../lib/api";
import { toast } from "../lib/toast";
import { Shield, User, Users, UserPlus, Settings, Trash2, X, Loader2, CheckCircle } from "lucide-react";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  skills?: string;
  rating?: number;
  status: string;
  eventsCompleted?: number;
  createdAt?: string;
};

const statusColors: Record<string, string> = {
  active: "#10B981",
  invited: "#F59E0B",
  inactive: "#475569",
};

const roleInfo = [
  { role: "Admin", text: "#9D6FEF", bg: "rgba(124,58,237,0.15)", perms: ["Full system access", "Manage billing", "Team management", "All events & leads", "Settings"] },
  { role: "Sales Rep", text: "#F59E0B", bg: "rgba(245,158,11,0.1)", perms: ["View & manage leads", "Create events", "Send contracts", "View invoices", "Communication hub"] },
  { role: "Staff", text: "#3B82F6", bg: "rgba(59,130,246,0.1)", perms: ["View events", "Messaging", "Song requests", "Basic reports"] },
  { role: "Contractor", text: "#10B981", bg: "rgba(16,185,129,0.1)", perms: ["View assigned events", "Contractor portal", "Jobsheet access", "Self-confirm availability"] },
];

type FormData = { name: string; email: string; phone: string; skills: string; status: string };
const emptyForm: FormData = { name: "", email: "", phone: "", skills: "", status: "active" };

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<TeamMember[]>("/contractors");
      setMembers(data);
    } catch {
      toast.error("Failed to load team");
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(m: TeamMember) {
    setEditing(m);
    setForm({ name: m.name, email: m.email, phone: m.phone || "", skills: m.skills || "", status: m.status });
    setShowModal(true);
  }

  async function save() {
    if (!form.name || !form.email) { toast.error("Name and email required"); return; }
    setSaving(true);
    try {
      if (editing) {
        const updated = await api.put<TeamMember>(`/contractors/${editing.id}`, form);
        setMembers(prev => prev.map(m => m.id === editing.id ? updated : m));
        toast.success("Member updated");
      } else {
        const created = await api.post<TeamMember>("/contractors", form);
        setMembers(prev => [...prev, created]);
        toast.success("Member added");
      }
      setShowModal(false);
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMember(m: TeamMember) {
    if (!confirm(`Remove ${m.name} from the team?`)) return;
    setDeletingId(m.id);
    try {
      await api.del(`/contractors/${m.id}`);
      setMembers(prev => prev.filter(x => x.id !== m.id));
      toast.success("Removed");
    } catch {
      toast.error("Failed to remove");
    } finally {
      setDeletingId(null);
    }
  }

  const active = members.filter(m => m.status === "active").length;
  const invited = members.filter(m => m.status === "invited").length;

  return (
    <Layout
      title="Team Management"
      subtitle="Roles, permissions, and access control"
      action={{ label: "Invite Member", onClick: openAdd }}
    >
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Members", value: members.length.toString(), color: "#7C3AED", icon: Users },
          { label: "Active", value: active.toString(), color: "#10B981", icon: User },
          { label: "Pending Invites", value: invited.toString(), color: "#F59E0B", icon: UserPlus },
          { label: "Roles Defined", value: "4", color: "#3B82F6", icon: Shield },
        ].map((s) => (
          <div key={s.label} className="empire-card p-5 flex items-center gap-4">
            <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 42, height: 42, background: `${s.color}1A` }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-white">{s.value}</p>
              <p className="text-sm" style={{ color: "#94A3B8" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Team members table */}
        <div className="col-span-2">
          <div className="empire-card overflow-hidden">
            <div className="px-5 py-4 border-b" style={{ borderColor: "#252A3A" }}>
              <h3 className="font-semibold text-white">Team Members</h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="animate-spin" color="#7C3AED" />
              </div>
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Users size={32} color="#334155" />
                <p className="text-sm" style={{ color: "#475569" }}>No team members yet</p>
                <button onClick={openAdd} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#7C3AED22", color: "#9D6FEF" }}>
                  Add first member
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #252A3A" }}>
                    {["Member", "Skills", "Status", "Events", ""].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#475569" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, i) => (
                    <tr
                      key={member.id}
                      style={{ borderBottom: i < members.length - 1 ? "1px solid #1C2030" : "none" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#1C2030")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      className="transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: "rgba(124,58,237,0.15)", color: "#9D6FEF" }}>
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{member.name}</p>
                            <p className="text-xs" style={{ color: "#475569" }}>{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs" style={{ color: "#94A3B8" }}>{member.skills || "—"}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: statusColors[member.status] || "#475569" }} />
                          <span className="text-xs capitalize" style={{ color: statusColors[member.status] || "#475569" }}>
                            {member.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ color: "#94A3B8" }}>{member.eventsCompleted ?? 0}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(member)} className="p-1.5 rounded" style={{ background: "#1C2030", border: "1px solid #252A3A" }}>
                            <Settings size={13} color="#475569" />
                          </button>
                          <button
                            onClick={() => deleteMember(member)}
                            disabled={deletingId === member.id}
                            className="p-1.5 rounded"
                            style={{ background: "#1C2030", border: "1px solid #252A3A" }}
                          >
                            {deletingId === member.id ? <Loader2 size={13} className="animate-spin" color="#EF4444" /> : <Trash2 size={13} color="#EF4444" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Roles & Permissions */}
        <div className="space-y-3">
          <h3 className="font-semibold text-white">Role Permissions</h3>
          {roleInfo.map(({ role, text, bg, perms }) => (
            <div key={role} className="empire-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={14} color={text} />
                <span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ color: text, background: bg }}>{role}</span>
              </div>
              <div className="space-y-1.5">
                {perms.map((perm) => (
                  <div key={perm} className="flex items-center gap-2 text-xs" style={{ color: "#475569" }}>
                    <CheckCircle size={10} color={text} className="flex-shrink-0" />
                    {perm}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8" style={{ background: "rgba(0,0,0,0.75)" }} onClick={() => setShowModal(false)}>
          <div className="empire-card w-full max-w-md mx-4 p-6 relative my-8" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4" style={{ color: "#475569" }}>
              <X size={18} />
            </button>
            <h3 className="font-bold text-white text-lg mb-5" style={{ fontFamily: "Syne, sans-serif" }}>
              {editing ? "Edit Member" : "Invite Member"}
            </h3>
            <div className="space-y-4">
              {[
                { label: "Full Name *", key: "name", type: "text" },
                { label: "Email *", key: "email", type: "email" },
                { label: "Phone", key: "phone", type: "tel" },
                { label: "Skills / Role", key: "skills", type: "text" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>{label}</label>
                  <input
                    type={type}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
                    style={{ background: "#1E293B", border: "1px solid #334155" }}
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    onFocus={e => (e.target.style.borderColor = "#7C3AED")}
                    onBlur={e => (e.target.style.borderColor = "#334155")}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Status</label>
                <select
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
                  style={{ background: "#1E293B", border: "1px solid #334155" }}
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="invited">Invited</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: "#1E293B", color: "#94A3B8" }}>
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                style={{ background: saving ? "#5B21B6" : "#7C3AED" }}
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                {editing ? "Save Changes" : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
