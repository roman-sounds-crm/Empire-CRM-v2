import { Link, useLocation } from "wouter";
import { authClient } from "../../lib/auth";
import {
  LayoutDashboard, Calendar, Users, FileText, CreditCard,
  UserCheck, Zap, MessageSquare, Music, WrapText, Package,
  BarChart3, CalendarDays, Clock, ChevronLeft, ChevronRight,
  Disc3, Settings, X
} from "lucide-react";

const navItems = [
  { label: "Dashboard",     icon: LayoutDashboard, path: "/" },
  { label: "Events",        icon: Calendar,        path: "/events" },
  { label: "Leads",         icon: Users,           path: "/leads" },
  { label: "Contracts",     icon: FileText,        path: "/contracts" },
  { label: "Invoices",      icon: CreditCard,      path: "/invoices" },
  { label: "Customers",     icon: UserCheck,       path: "/customers" },
  { label: "Contractors",   icon: Disc3,           path: "/contractors" },
  { label: "Workflows",     icon: Zap,             path: "/workflows" },
  { label: "Messaging",     icon: MessageSquare,   path: "/messaging" },
  { label: "Song Requests", icon: Music,           path: "/song-requests" },
  { label: "Forms",         icon: WrapText,        path: "/forms" },
  { label: "Packages",      icon: Package,         path: "/packages" },
  { label: "Team",          icon: Users,           path: "/team" },
  { label: "Analytics",     icon: BarChart3,       path: "/analytics" },
  { label: "Calendar",      icon: CalendarDays,    path: "/calendar" },
  { label: "Appointments",  icon: Clock,           path: "/appointments" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
}

export default function Sidebar({ collapsed, onToggle, mobile }: SidebarProps) {
  const [location] = useLocation();
  const { data: session } = authClient.useSession();
  const userName = session?.user?.name || "Admin";
  const userInitial = userName.charAt(0).toUpperCase();
  const width = mobile ? 260 : (collapsed ? 64 : 240);

  return (
    <aside
      className="fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300"
      style={{
        width,
        background: "#0D0F14",
        borderRight: "1px solid #252A3A",
        // On mobile, animate in
        transform: mobile ? "translateX(0)" : undefined,
      }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5" style={{ minHeight: 64 }}>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-lg flex-shrink-0 purple-glow"
            style={{ width: 36, height: 36, background: "linear-gradient(135deg, #7C3AED, #9D6FEF)" }}
          >
            <Disc3 size={18} color="white" />
          </div>
          {(!collapsed || mobile) && (
            <div>
              <h1 className="font-bold text-white text-base leading-tight" style={{ fontFamily: "Syne, sans-serif" }}>
                Empire CRM
              </h1>
              <p className="text-xs" style={{ color: "#475569" }}>Roman Sounds</p>
            </div>
          )}
        </div>
        {/* Mobile close button */}
        {mobile && (
          <button onClick={onToggle} className="p-1.5 rounded-lg cursor-pointer" style={{ background: "#1C2030", border: "1px solid #252A3A" }}>
            <X size={16} color="#94A3B8" />
          </button>
        )}
      </div>

      {/* Desktop collapse toggle */}
      {!mobile && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-16 rounded-full flex items-center justify-center z-50 cursor-pointer"
          style={{ width: 24, height: 24, background: "#1C2030", border: "1px solid #252A3A", color: "#94A3B8" }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {navItems.map((item) => {
          const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={`sidebar-item flex items-center gap-3 rounded-lg px-3 py-2.5 mb-0.5 cursor-pointer ${isActive ? "active" : ""}`}
                style={{
                  background: isActive ? "rgba(124, 58, 237, 0.15)" : "transparent",
                  borderRight: isActive ? "2px solid #7C3AED" : "2px solid transparent",
                }}
                title={collapsed && !mobile ? item.label : undefined}
              >
                <item.icon size={18} className="flex-shrink-0" color={isActive ? "#9D6FEF" : "#94A3B8"} />
                {(!collapsed || mobile) && (
                  <span className="text-sm font-medium truncate" style={{ color: isActive ? "#E2D9F3" : "#94A3B8" }}>
                    {item.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t" style={{ borderColor: "#252A3A" }}>
        <Link href="/settings">
          <div
            className="sidebar-item flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer"
            title={collapsed && !mobile ? "Settings" : undefined}
          >
            <Settings size={18} color="#94A3B8" className="flex-shrink-0" />
            {(!collapsed || mobile) && <span className="text-sm font-medium" style={{ color: "#94A3B8" }}>Settings</span>}
          </div>
        </Link>
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-lg" style={{ background: "#1C2030" }}>
            <div className="flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
              style={{ width: 30, height: 30, background: "linear-gradient(135deg, #7C3AED, #9D6FEF)", color: "white" }}>
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-xs truncate" style={{ color: "#475569" }}>Admin</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
