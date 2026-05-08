import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { api } from "../../lib/api";
import {
  Search, Calendar, Users, FileText, CreditCard, Disc3,
  LayoutDashboard, Zap, Music, Package, BarChart3, Settings,
  ArrowRight, Clock, X
} from "lucide-react";

interface Result {
  id: string;
  type: "nav" | "event" | "lead" | "contract" | "invoice";
  title: string;
  subtitle?: string;
  path: string;
  icon: any;
  color: string;
}

const NAV_ITEMS: Result[] = [
  { id: "nav-dash",    type: "nav", title: "Dashboard",     path: "/",             icon: LayoutDashboard, color: "#7C3AED", subtitle: "Overview & stats" },
  { id: "nav-events",  type: "nav", title: "Events",         path: "/events",       icon: Calendar,        color: "#10B981", subtitle: "Manage bookings" },
  { id: "nav-leads",   type: "nav", title: "Leads",          path: "/leads",        icon: Users,           color: "#F59E0B", subtitle: "Lead pipeline" },
  { id: "nav-con",     type: "nav", title: "Contracts",      path: "/contracts",    icon: FileText,        color: "#3B82F6", subtitle: "Agreements & signing" },
  { id: "nav-inv",     type: "nav", title: "Invoices",       path: "/invoices",     icon: CreditCard,      color: "#EF4444", subtitle: "Payments & billing" },
  { id: "nav-pkg",     type: "nav", title: "Packages",       path: "/packages",     icon: Package,         color: "#EC4899", subtitle: "Service packages" },
  { id: "nav-wf",      type: "nav", title: "Workflows",      path: "/workflows",    icon: Zap,             color: "#F59E0B", subtitle: "Automations" },
  { id: "nav-music",   type: "nav", title: "Song Requests",  path: "/song-requests",icon: Music,           color: "#9D6FEF", subtitle: "Playlist management" },
  { id: "nav-anal",    type: "nav", title: "Analytics",      path: "/analytics",    icon: BarChart3,       color: "#06B6D4", subtitle: "Reports & trends" },
  { id: "nav-set",     type: "nav", title: "Settings",       path: "/settings",     icon: Settings,        color: "#94A3B8", subtitle: "Account & preferences" },
];

function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(v => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return { open, setOpen };
}

export { useCommandPalette };

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelected(0);
    }
  }, [open]);

  // Search
  useEffect(() => {
    if (!query.trim()) {
      setResults(NAV_ITEMS.slice(0, 6));
      return;
    }
    const q = query.toLowerCase();

    // Filter nav items
    const navMatches = NAV_ITEMS.filter(n =>
      n.title.toLowerCase().includes(q) || n.subtitle?.toLowerCase().includes(q)
    );

    // Debounced DB search
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [evts, leads, contracts, invoices] = await Promise.all([
          api.get<any[]>("/events"),
          api.get<any[]>("/leads"),
          api.get<any[]>("/contracts"),
          api.get<any[]>("/invoices"),
        ]);

        const dbResults: Result[] = [
          ...evts.filter(e => e.title?.toLowerCase().includes(q) || e.clientName?.toLowerCase().includes(q)).slice(0, 3).map(e => ({
            id: e.id, type: "event" as const,
            title: e.title, subtitle: `${e.clientName} · ${e.date || ""}`,
            path: "/events", icon: Calendar, color: "#10B981",
          })),
          ...leads.filter(l => l.name?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q)).slice(0, 3).map(l => ({
            id: l.id, type: "lead" as const,
            title: l.name, subtitle: `Lead · ${l.status} · ${l.email || ""}`,
            path: "/leads", icon: Users, color: "#F59E0B",
          })),
          ...contracts.filter(c => c.clientName?.toLowerCase().includes(q) || c.title?.toLowerCase().includes(q)).slice(0, 2).map(c => ({
            id: c.id, type: "contract" as const,
            title: c.title || c.clientName, subtitle: `Contract · ${c.status}`,
            path: "/contracts", icon: FileText, color: "#3B82F6",
          })),
          ...invoices.filter(i => i.clientName?.toLowerCase().includes(q) || i.id?.toLowerCase().includes(q)).slice(0, 2).map(i => ({
            id: i.id, type: "invoice" as const,
            title: `Invoice — ${i.clientName}`, subtitle: `$${i.amount?.toLocaleString()} · ${i.status}`,
            path: "/invoices", icon: CreditCard, color: "#EF4444",
          })),
        ];

        setResults([...navMatches, ...dbResults].slice(0, 8));
      } catch {
        setResults(navMatches);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation
  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && results[selected]) {
      navigate(results[selected].path);
      onClose();
      setQuery("");
    }
  }, [results, selected, navigate, onClose]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selected] as HTMLElement;
    el?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  if (!open) return null;

  const typeLabel: Record<string, string> = {
    nav: "Page", event: "Event", lead: "Lead", contract: "Contract", invoice: "Invoice"
  };

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh]"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up"
        style={{ background: "#141824", border: "1px solid #252A3A" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid #252A3A" }}>
          <Search size={18} color="#7C3AED" className="flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKey}
            placeholder="Search pages, events, leads, invoices..."
            className="flex-1 bg-transparent text-sm outline-none text-white placeholder:text-[#475569]"
          />
          {loading && <div className="w-4 h-4 rounded-full border border-purple-500 border-t-transparent animate-spin flex-shrink-0" />}
          <kbd className="text-xs px-2 py-0.5 rounded flex-shrink-0" style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#475569" }}>ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="py-2 max-h-80 overflow-y-auto">
          {results.length === 0 && !loading && (
            <p className="text-center text-sm py-8" style={{ color: "#475569" }}>No results for "{query}"</p>
          )}
          {results.map((r, i) => (
            <button
              key={r.id}
              onClick={() => { navigate(r.path); onClose(); setQuery(""); }}
              onMouseEnter={() => setSelected(i)}
              className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer text-left transition-colors"
              style={{ background: selected === i ? "rgba(124,58,237,0.1)" : "transparent" }}
            >
              <div className="flex items-center justify-center rounded-lg flex-shrink-0"
                style={{ width: 34, height: 34, background: `${r.color}18` }}>
                <r.icon size={16} color={r.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{r.title}</p>
                {r.subtitle && <p className="text-xs truncate" style={{ color: "#475569" }}>{r.subtitle}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#1C2030", color: "#475569" }}>
                  {typeLabel[r.type]}
                </span>
                {selected === i && <ArrowRight size={12} color="#7C3AED" />}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: "1px solid #252A3A" }}>
          <div className="flex items-center gap-3 text-xs" style={{ color: "#334155" }}>
            <span className="flex items-center gap-1"><kbd className="px-1 rounded text-xs" style={{ background: "#1C2030", border: "1px solid #252A3A" }}>↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1 rounded text-xs" style={{ background: "#1C2030", border: "1px solid #252A3A" }}>↵</kbd> open</span>
          </div>
          <span className="text-xs" style={{ color: "#334155" }}>⌘K to close</span>
        </div>
      </div>
    </div>
  );
}
