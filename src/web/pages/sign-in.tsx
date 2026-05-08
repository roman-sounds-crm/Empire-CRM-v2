import { useState } from "react";
import { useLocation } from "wouter";
import { authClient } from "../lib/auth";
import { clearRoleCache, fetchRole } from "../components/AdminGuard";
import { Disc3, Eye, EyeOff, Loader2 } from "lucide-react";

export default function SignIn() {
  const [, navigate] = useLocation();
  const reason = new URLSearchParams(window.location.search).get("reason");
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const afterAuth = async () => {
    clearRoleCache();
    const role = await fetchRole();
    if (role === "admin") {
      navigate("/");
    } else {
      // Not an admin — sign them out and show message
      await authClient.signOut();
      clearRoleCache();
      setError("This account doesn't have CRM access. Ask Randy for your portal link.");
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await authClient.signIn.email({ email, password });
      if (res.error) throw new Error(res.error.message || "Sign in failed");
      await afterAuth();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await authClient.signUp.email({ email, password, name });
      if (res.error) throw new Error(res.error.message || "Sign up failed");
      await afterAuth();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "#0D0F14",
        backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(245,158,11,0.05) 0%, transparent 50%)",
      }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full opacity-5 blur-3xl" style={{ background: "#7C3AED", top: "10%", left: "5%" }} />
        <div className="absolute w-64 h-64 rounded-full opacity-5 blur-3xl" style={{ background: "#F59E0B", bottom: "20%", right: "10%" }} />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center rounded-2xl mb-4 purple-glow"
            style={{ width: 60, height: 60, background: "linear-gradient(135deg, #7C3AED, #9D6FEF)" }}
          >
            <Disc3 size={28} color="white" />
          </div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>
            Empire CRM
          </h1>
          <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
            {tab === "signin" ? "Welcome back. Sign in to continue." : "Create your account to get started."}
          </p>
        </div>

        {/* Card */}
        <div className="empire-card p-8">
          {/* Tab toggle */}
          <div className="flex p-1 rounded-xl mb-6" style={{ background: "#1C2030" }}>
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all"
                style={{
                  background: tab === t ? "#252A3A" : "transparent",
                  color: tab === t ? "#F1F5F9" : "#94A3B8",
                }}
              >
                {t === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={tab === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
            {tab === "signup" && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#94A3B8" }}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "#1C2030",
                    border: "1px solid #252A3A",
                    color: "#F1F5F9",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#7C3AED")}
                  onBlur={(e) => (e.target.style.borderColor = "#252A3A")}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#94A3B8" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@empirecrm.com"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#F1F5F9" }}
                onFocus={(e) => (e.target.style.borderColor = "#7C3AED")}
                onBlur={(e) => (e.target.style.borderColor = "#252A3A")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#94A3B8" }}>Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all pr-12"
                  style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#F1F5F9" }}
                  onFocus={(e) => (e.target.style.borderColor = "#7C3AED")}
                  onBlur={(e) => (e.target.style.borderColor = "#252A3A")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showPass ? <EyeOff size={16} color="#475569" /> : <Eye size={16} color="#475569" />}
                </button>
              </div>
            </div>

            {reason === "access" && !error && (
              <div className="px-4 py-3 rounded-xl text-sm"
                style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#F59E0B" }}>
                Your account doesn't have CRM access. Contact Randy for your portal link.
              </div>
            )}

            {error && (
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white cursor-pointer flex items-center justify-center gap-2 transition-all"
              style={{
                background: loading ? "#5B21B6" : "linear-gradient(135deg, #7C3AED, #9D6FEF)",
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> {tab === "signin" ? "Signing in..." : "Creating account..."}</>
              ) : (
                tab === "signin" ? "Sign In to Empire CRM" : "Create Account"
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div
            className="mt-5 p-3 rounded-xl text-center text-xs"
            style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)" }}
          >
            <span style={{ color: "#9D6FEF" }}>Demo: </span>
            <span style={{ color: "#94A3B8" }}>Create an account to get started — it's instant.</span>
          </div>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: "#475569" }}>
          Empire CRM · DJ Business Management Platform
        </p>
      </div>
    </div>
  );
}
