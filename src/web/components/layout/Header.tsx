import { useState } from "react";
import { Bell, Search, Plus, Menu } from "lucide-react";
import NotificationsPanel from "./NotificationsPanel";

const UNREAD_COUNT = 2;

interface HeaderProps {
  title: string;
  subtitle?: string;
  sidebarCollapsed: boolean;
  onMobileMenuOpen?: () => void;
  onSearchOpen?: () => void;
  action?: { label: string; onClick: () => void };
}

export default function Header({ title, subtitle, sidebarCollapsed, onMobileMenuOpen, onSearchOpen, action }: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <>
      <header
        className="fixed top-0 right-0 z-30 flex items-center justify-between px-4 md:px-6"
        style={{
          left: 0,
          height: 64,
          background: "#0D0F14",
          borderBottom: "1px solid #252A3A",
          transition: "left 0.3s ease",
          // On desktop, offset by sidebar width
        }}
      >
        {/* Left: mobile hamburger + title */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={onMobileMenuOpen}
            className="md:hidden flex items-center justify-center rounded-lg cursor-pointer"
            style={{ width: 36, height: 36, background: "#1C2030", border: "1px solid #252A3A" }}
          >
            <Menu size={18} color="#94A3B8" />
          </button>

          {/* Desktop sidebar spacer */}
          <div
            className="hidden md:block transition-all duration-300 flex-shrink-0"
            style={{ width: sidebarCollapsed ? 64 : 240 }}
          />

          <div>
            <h2 className="font-bold text-white text-base md:text-lg leading-tight" style={{ fontFamily: "Syne, sans-serif" }}>
              {title}
            </h2>
            {subtitle && <p className="text-xs hidden sm:block" style={{ color: "#475569" }}>{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Search bar — desktop */}
          <button
            onClick={onSearchOpen}
            className="hidden md:flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-all hover:border-purple-500/50"
            style={{ background: "#1C2030", border: "1px solid #252A3A", minWidth: 200 }}
          >
            <Search size={14} color="#475569" />
            <span className="text-sm flex-1 text-left" style={{ color: "#475569" }}>Search...</span>
            <kbd className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#0D0F14", border: "1px solid #252A3A", color: "#334155" }}>⌘K</kbd>
          </button>

          {/* Search icon — mobile */}
          <button
            onClick={onSearchOpen}
            className="md:hidden flex items-center justify-center rounded-lg cursor-pointer"
            style={{ width: 36, height: 36, background: "#1C2030", border: "1px solid #252A3A" }}
          >
            <Search size={16} color="#94A3B8" />
          </button>

          {/* Notifications */}
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative flex items-center justify-center rounded-lg cursor-pointer transition-all"
            style={{
              width: 36, height: 36,
              background: notifOpen ? "#252A3A" : "#1C2030",
              border: `1px solid ${notifOpen ? "#7C3AED" : "#252A3A"}`,
            }}
          >
            <Bell size={16} color={notifOpen ? "#9D6FEF" : "#94A3B8"} />
            {UNREAD_COUNT > 0 && (
              <span
                className="absolute top-1 right-1 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ width: 14, height: 14, background: "#EF4444", color: "white", fontSize: 9 }}
              >
                {UNREAD_COUNT}
              </span>
            )}
          </button>

          {/* Action button */}
          {action && (
            <button
              onClick={action.onClick}
              className="flex items-center gap-1.5 rounded-lg px-3 md:px-4 py-2 text-sm font-semibold text-white cursor-pointer transition-all"
              style={{ background: "linear-gradient(135deg, #7C3AED, #9D6FEF)" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <Plus size={14} />
              <span className="hidden sm:inline">{action.label}</span>
              <span className="sm:hidden">New</span>
            </button>
          )}
        </div>
      </header>

      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
