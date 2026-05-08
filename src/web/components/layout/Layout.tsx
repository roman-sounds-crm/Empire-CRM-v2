import { useState, ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { authClient } from "../../lib/auth";
import CommandPalette, { useCommandPalette } from "../ui/CommandPalette";

interface LayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
}

export default function Layout({ children, title, subtitle, action }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, navigate] = useLocation();
  const { data: session, isPending } = authClient.useSession();
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [navigate]);

  // Close mobile sidebar on desktop resize
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    if (!isPending && !session) navigate("/sign-in");
  }, [session, isPending, navigate]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D0F14" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center animate-pulse"
            style={{ background: "linear-gradient(135deg, #7C3AED, #9D6FEF)" }}>
            <span className="text-white text-xl">E</span>
          </div>
          <p className="text-sm" style={{ color: "#475569" }}>Loading Empire CRM...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen" style={{ background: "#0D0F14" }}>
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setMobileOpen(false)}
        >
          <div onClick={e => e.stopPropagation()}>
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} mobile />
          </div>
        </div>
      )}

      <Header
        title={title}
        subtitle={subtitle}
        sidebarCollapsed={collapsed}
        onMobileMenuOpen={() => setMobileOpen(true)}
        onSearchOpen={() => setCmdOpen(true)}
        action={action}
      />

      <main
        className="transition-all duration-300"
        style={{
          marginLeft: 0,
          // Desktop: offset by sidebar
        }}
      >
        {/* Desktop margin */}
        <div
          className="hidden md:block fixed top-0 left-0 bottom-0 pointer-events-none transition-all duration-300"
          style={{ width: collapsed ? 64 : 240 }}
        />
        <div
          className="md:transition-all md:duration-300"
          style={{
            paddingTop: 64,
            minHeight: "100vh",
          }}
        >
          {/* This inner div handles the desktop margin via CSS */}
          <style>{`
            @media (min-width: 768px) {
              .layout-content {
                margin-left: ${collapsed ? 64 : 240}px;
              }
            }
          `}</style>
          <div className="layout-content p-4 md:p-6 animate-fade-in-up">
            {children}
          </div>
        </div>
      </main>

      {/* Command Palette */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
