import Layout from "../components/layout/Layout";
import { analyticsData } from "../lib/mock-data";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";

const COLORS = ["#7C3AED", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];

export default function Analytics() {
  return (
    <Layout title="Analytics" subtitle="Business performance and insights">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Annual Revenue", value: "$84,320", sub: "+12.4% YoY", color: "#F59E0B" },
          { label: "Conversion Rate", value: "31%", sub: "Leads → Events", color: "#10B981" },
          { label: "Avg Event Value", value: "$1,794", sub: "Per booking", color: "#7C3AED" },
          { label: "Repeat Clients", value: "22%", sub: "Book again", color: "#3B82F6" },
        ].map((kpi) => (
          <div key={kpi.label} className="empire-card p-5">
            <p className="text-2xl font-bold font-mono" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-sm font-medium text-white mt-1">{kpi.label}</p>
            <p className="text-xs mt-0.5" style={{ color: "#475569" }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart + Lead sources */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="empire-card p-5 col-span-2">
          <h3 className="font-semibold text-white mb-4">Monthly Revenue 2025</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={analyticsData.monthlyRevenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bookGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#252A3A" />
              <XAxis dataKey="month" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#1C2030", border: "1px solid #252A3A", borderRadius: 8, color: "#F1F5F9" }}
                formatter={(value: number, name: string) => [
                  name === "revenue" ? `$${value.toLocaleString()}` : value,
                  name === "revenue" ? "Revenue" : "Bookings"
                ]}
              />
              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2} fill="url(#revGrad)" />
              <Area yAxisId="right" type="monotone" dataKey="bookings" stroke="#F59E0B" strokeWidth={2} fill="url(#bookGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="empire-card p-5">
          <h3 className="font-semibold text-white mb-4">Lead Sources</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={analyticsData.leadSources}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                dataKey="count"
              >
                {analyticsData.leadSources.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#1C2030", border: "1px solid #252A3A", borderRadius: 8, color: "#F1F5F9" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {analyticsData.leadSources.map((s, i) => (
              <div key={s.source} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span style={{ color: "#94A3B8" }}>{s.source}</span>
                </div>
                <span className="font-mono font-medium text-white">{s.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Event types */}
      <div className="grid grid-cols-2 gap-4">
        <div className="empire-card p-5">
          <h3 className="font-semibold text-white mb-4">Revenue by Event Type</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analyticsData.eventTypes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252A3A" />
              <XAxis dataKey="type" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "#1C2030", border: "1px solid #252A3A", borderRadius: 8, color: "#F1F5F9" }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#7C3AED" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="empire-card p-5">
          <h3 className="font-semibold text-white mb-4">Event Count by Type</h3>
          <div className="space-y-3">
            {analyticsData.eventTypes.map((et, i) => (
              <div key={et.type} className="flex items-center gap-3">
                <span className="text-sm w-24" style={{ color: "#94A3B8" }}>{et.type}</span>
                <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, background: "#1C2030" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(et.count / Math.max(...analyticsData.eventTypes.map(e => e.count))) * 100}%`,
                      background: COLORS[i % COLORS.length],
                    }}
                  />
                </div>
                <span className="text-sm font-mono font-bold text-white w-6">{et.count}</span>
                <span className="text-xs font-mono w-16 text-right" style={{ color: "#F59E0B" }}>
                  ${(et.revenue / 1000).toFixed(0)}k
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
