import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Layout from "../components/layout/Layout";
import { api } from "../lib/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import { TrendingUp, Calendar, Users, FileText, DollarSign, ArrowRight, Music, Clock, MapPin, Zap } from "lucide-react";

const statusColors: Record<string, string> = {
  confirmed: "#10B981", pending: "#F59E0B", cancelled: "#EF4444", completed: "#3B82F6",
};
const statusBg: Record<string, string> = {
  confirmed: "rgba(16,185,129,0.1)", pending: "rgba(245,158,11,0.1)", cancelled: "rgba(239,68,68,0.1)", completed: "rgba(59,130,246,0.1)",
};
const leadColors: Record<string, string> = {
  hot: "#EF4444", warm: "#F59E0B", cold: "#3B82F6", new: "#10B981",
};

// Build monthly revenue data from invoices
function buildMonthlyRevenue(invoices: any[]) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const now = new Date();
  const data = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const rev = invoices
      .filter(inv => {
        const iss = inv.issuedDate ? new Date(inv.issuedDate) : null;
        return iss && iss.getMonth() === m && iss.getFullYear() === y;
      })
      .reduce((s: number, inv: any) => s + (inv.paid || 0), 0);
    data.push({ month: months[m], revenue: rev });
  }
  return data;
}

function buildEventsByType(events: any[]) {
  const counts: Record<string, number> = {};
  events.forEach(e => {
    const t = e.type || "Other";
    counts[t] = (counts[t] || 0) + 1;
  });
  return Object.entries(counts).map(([type, count]) => ({ type, count }));
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [eventsData, setEventsData]   = useState<any[]>([]);
  const [leadsData, setLeadsData]     = useState<any[]>([]);
  const [invoicesData, setInvoicesData] = useState<any[]>([]);
  const [contractsData, setContractsData] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<any[]>("/events"),
      api.get<any[]>("/leads"),
      api.get<any[]>("/invoices"),
      api.get<any[]>("/contracts"),
    ]).then(([ev, leads, inv, con]) => {
      setEventsData(ev || []);
      setLeadsData(leads || []);
      setInvoicesData(inv || []);
      setContractsData(con || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue   = invoicesData.reduce((s, i) => s + (i.paid || 0), 0);
  const outstanding    = invoicesData.reduce((s, i) => s + (i.due || 0), 0);
  const activeEvents   = eventsData.filter(e => e.status !== "cancelled" && e.status !== "completed").length;
  const hotLeads       = leadsData.filter(l => l.stage === "hot" || l.leadScore > 70).length;
  const signedContracts = contractsData.filter(c => c.status === "signed").length;

  const statCards = [
    { label: "Total Revenue",    value: `$${totalRevenue.toLocaleString()}`,  change: `$${outstanding.toLocaleString()} outstanding`, positive: outstanding === 0, icon: DollarSign, color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
    { label: "Active Events",    value: String(activeEvents),                  change: `${eventsData.length} total`,                   positive: true,              icon: Calendar,   color: "#7C3AED", bg: "rgba(124,58,237,0.1)" },
    { label: "Total Leads",      value: String(leadsData.length),              change: `${hotLeads} hot leads`,                        positive: hotLeads > 0,       icon: Users,      color: "#10B981", bg: "rgba(16,185,129,0.1)" },
    { label: "Signed Contracts", value: String(signedContracts),               change: `${contractsData.length - signedContracts} pending`, positive: true,          icon: FileText,   color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  ];

  const revenueChart = buildMonthlyRevenue(invoicesData);
  const eventsChart  = buildEventsByType(eventsData);

  const upcomingEvents = [...eventsData]
    .filter(e => e.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const hotLeadList = [...leadsData]
    .sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0))
    .slice(0, 4);

  if (loading) return (
    <Layout title="Dashboard" subtitle="Loading your empire...">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    </Layout>
  );

  return (
    <Layout title="Dashboard" subtitle="Welcome back, Randy — here's your Roman Empire">

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(card => (
          <div key={card.label} className="empire-card p-5 animate-fade-in-up">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center rounded-xl" style={{ width: 44, height: 44, background: card.bg }}>
                <card.icon size={20} color={card.color} />
              </div>
              <div className="flex items-center gap-1" style={{ color: card.positive ? "#10B981" : "#EF4444" }}>
                <TrendingUp size={12} />
                <span className="text-xs font-medium">{card.change}</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-white font-mono">{card.value}</p>
            <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        {/* Revenue Chart */}
        <div className="col-span-2 empire-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-white">Revenue (6 months)</h2>
              <p className="text-xs mt-0.5" style={{ color: "#475569" }}>Payments collected per month</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "rgba(124,58,237,0.1)", color: "#9D6FEF" }}>
              ${totalRevenue.toLocaleString()} total
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueChart} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2435" />
              <XAxis dataKey="month" stroke="#334155" tick={{ fontSize: 11 }} />
              <YAxis stroke="#334155" tick={{ fontSize: 11 }} tickFormatter={v => v === 0 ? "$0" : `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "#141824", border: "1px solid #252A3A", borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: "#94A3B8" }}
                formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Events by type */}
        <div className="empire-card p-5">
          <h2 className="font-bold text-white mb-1">Events by Type</h2>
          <p className="text-xs mb-5" style={{ color: "#475569" }}>Breakdown across all events</p>
          {eventsChart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Music size={28} color="#334155" />
              <p className="text-xs" style={{ color: "#475569" }}>No event data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={eventsChart} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis type="number" stroke="#334155" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="type" stroke="#334155" tick={{ fontSize: 10 }} width={70} />
                <Tooltip
                  contentStyle={{ background: "#141824", border: "1px solid #252A3A", borderRadius: 10, fontSize: 12 }}
                  formatter={(v: any) => [v, "Events"]}
                />
                <Bar dataKey="count" fill="#7C3AED" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Upcoming Events */}
        <div className="empire-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">Upcoming Events</h2>
            <a href="/events" className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: "#9D6FEF" }}>
              View all <ArrowRight size={12} />
            </a>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Calendar size={28} color="#334155" />
              <p className="text-xs" style={{ color: "#475569" }}>No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(ev => (
                <div key={ev.id} onClick={() => navigate("/events")}
                  className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-[#1C2030]">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: statusBg[ev.status] || "rgba(124,58,237,0.1)" }}>
                    <Music size={15} color={statusColors[ev.status] || "#9D6FEF"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{ev.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {ev.date && <span className="flex items-center gap-1 text-xs" style={{ color: "#475569" }}><Calendar size={10} />{new Date(ev.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>}
                      {ev.venue && <span className="flex items-center gap-1 text-xs" style={{ color: "#475569" }}><MapPin size={10} />{ev.venue}</span>}
                    </div>
                  </div>
                  <span className="text-xs font-medium rounded-full px-2 py-0.5 flex-shrink-0"
                    style={{ background: statusBg[ev.status] || "rgba(124,58,237,0.1)", color: statusColors[ev.status] || "#9D6FEF" }}>
                    {ev.status || "pending"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hot Leads */}
        <div className="empire-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">Top Leads</h2>
            <a href="/leads" className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: "#9D6FEF" }}>
              View all <ArrowRight size={12} />
            </a>
          </div>
          {hotLeadList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Users size={28} color="#334155" />
              <p className="text-xs" style={{ color: "#475569" }}>No leads yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hotLeadList.map(lead => (
                <div key={lead.id} onClick={() => navigate("/leads")} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-[#1C2030]">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                    style={{ background: `linear-gradient(135deg,#7C3AED,#A855F7)` }}>
                    {(lead.name || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{lead.name}</p>
                    <p className="text-xs truncate" style={{ color: "#475569" }}>{lead.eventType || lead.email || "—"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {lead.stage && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${leadColors[lead.stage] || "#7C3AED"}18`, color: leadColors[lead.stage] || "#9D6FEF" }}>
                        {lead.stage}
                      </span>
                    )}
                    {lead.leadScore != null && (
                      <div className="flex items-center gap-1">
                        <Zap size={10} color="#F59E0B" />
                        <span className="text-xs font-mono" style={{ color: "#F59E0B" }}>{lead.leadScore}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-5 empire-card p-5">
        <h2 className="font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "New Event",    href: "/events",    icon: Calendar, color: "#7C3AED" },
            { label: "New Lead",     href: "/leads",     icon: Users,    color: "#10B981" },
            { label: "New Contract", href: "/contracts", icon: FileText, color: "#3B82F6" },
            { label: "New Invoice",  href: "/invoices",  icon: DollarSign, color: "#F59E0B" },
            { label: "Song Requests",href: "/song-requests", icon: Music, color: "#EC4899" },
          ].map(item => (
            <a key={item.label} href={item.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer transition-all hover:scale-105"
              style={{ background: "#1C2030", border: "1px solid #252A3A" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${item.color}18` }}>
                <item.icon size={18} color={item.color} />
              </div>
              <span className="text-xs font-medium text-center leading-tight" style={{ color: "#94A3B8" }}>{item.label}</span>
            </a>
          ))}
        </div>
      </div>
    </Layout>
  );
}
