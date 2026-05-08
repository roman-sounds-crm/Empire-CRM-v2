import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Music } from "lucide-react";

type Role = "admin" | "user" | null;

let cachedRole: Role | undefined = undefined;

export async function fetchRole(): Promise<Role> {
  if (cachedRole !== undefined) return cachedRole;
  try {
    const res = await fetch("/api/me");
    if (!res.ok) { cachedRole = null; return null; }
    const data = await res.json() as any;
    cachedRole = (data?.user?.role as Role) ?? null;
    return cachedRole;
  } catch {
    cachedRole = null;
    return null;
  }
}

export function clearRoleCache() {
  cachedRole = undefined;
}

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    fetchRole().then(role => {
      if (role === "admin") {
        setStatus("ok");
      } else if (role === "user") {
        setStatus("denied");
        navigate("/sign-in?reason=access");
      } else {
        setStatus("denied");
        navigate("/sign-in");
      }
    });
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D1117" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}>
            <Music size={22} color="white" />
          </div>
          <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (status === "denied") return null;

  return <>{children}</>;
}
