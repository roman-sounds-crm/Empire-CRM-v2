import { useState } from "react";
import { Music, ShieldCheck, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function Bootstrap() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const run = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/bootstrap?secret=romansounds-bootstrap-2025", {
        method: "POST",
      });
      const data = await res.json() as any;
      if (res.ok) {
        setMessage(data.message || "Done!");
        setStatus("done");
      } else {
        setMessage(data.error || "Something went wrong.");
        setStatus("error");
      }
    } catch {
      setMessage("Could not reach the server. Try again.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#0D1117" }}>
      <div className="w-full max-w-sm rounded-2xl p-8 text-center space-y-6"
        style={{ background: "#141824", border: "1px solid #1E2435" }}>

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}>
            <Music size={26} color="white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Roman Sounds</h1>
            <p className="text-xs" style={{ color: "#475569" }}>Admin Setup</p>
          </div>
        </div>

        {/* Content */}
        {status === "idle" && (
          <>
            <div className="rounded-xl p-4 space-y-2"
              style={{ background: "#1C2030", border: "1px solid #252A3A" }}>
              <ShieldCheck size={20} color="#9D6FEF" className="mx-auto" />
              <p className="text-sm text-white font-semibold">Give Randy admin access</p>
              <p className="text-xs" style={{ color: "#64748B" }}>
                This gives <span style={{ color: "#9D6FEF" }}>randy@romansounds.com</span> full
                CRM access. Only needs to run once.
              </p>
            </div>
            <button onClick={run}
              className="w-full py-3 rounded-xl text-sm font-bold text-white cursor-pointer"
              style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}>
              Make Me Admin
            </button>
          </>
        )}

        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 size={28} className="animate-spin" style={{ color: "#7C3AED" }} />
            <p className="text-sm" style={{ color: "#94A3B8" }}>Updating your account...</p>
          </div>
        )}

        {status === "done" && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle size={40} color="#10B981" />
            <p className="text-sm font-semibold text-white">{message}</p>
            <a href="/sign-in"
              className="w-full py-3 rounded-xl text-sm font-bold text-white text-center block cursor-pointer"
              style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}>
              Go to Sign In
            </a>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <XCircle size={36} color="#EF4444" />
            <p className="text-sm" style={{ color: "#EF4444" }}>{message}</p>
            <button onClick={() => setStatus("idle")}
              className="w-full py-3 rounded-xl text-sm font-bold cursor-pointer"
              style={{ background: "#1C2030", color: "#94A3B8", border: "1px solid #252A3A" }}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
