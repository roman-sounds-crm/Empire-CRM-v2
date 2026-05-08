import { useState } from "react";
import { Music, Heart, DollarSign, CheckCircle, Send, Loader2, Star } from "lucide-react";

const CASHAPP_HANDLE = "$randyromandj";
const PUBLIC_URL = "https://manage.romansounds.com/portal/requests";
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(PUBLIC_URL)}&bgcolor=0F172A&color=9D6FEF&margin=10`;

export default function PortalRequests() {
  const [form, setForm] = useState({
    title: "",
    artist: "",
    requestedBy: "",
    dedication: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Get event ID from query string if present
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get("event") || undefined;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Song title is required"); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/portal/song-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          artist: form.artist.trim() || undefined,
          requestedBy: form.requestedBy.trim() || undefined,
          dedication: form.dedication.trim() || undefined,
          eventId,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setForm({ title: "", artist: "", requestedBy: "", dedication: "" });
    setSubmitted(false);
    setError("");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-10 px-4"
      style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E1040 50%, #0F172A 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center rounded-full mb-4"
          style={{ width: 72, height: 72, background: "linear-gradient(135deg, #7C3AED, #9D6FEF)" }}
        >
          <Music size={32} color="#fff" />
        </div>
        <h1 className="text-3xl font-bold text-white">Roman Sounds</h1>
        <p className="mt-1 text-lg" style={{ color: "#9D6FEF" }}>DJ Randy Roman</p>
        <div className="flex items-center justify-center gap-1 mt-2">
          {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />)}
        </div>
      </div>

      <div className="w-full max-w-md space-y-4">
        {/* Song request card */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(157,111,239,0.2)", backdropFilter: "blur(12px)" }}
        >
          {!submitted ? (
            <>
              <h2 className="text-xl font-bold text-white mb-1">Request a Song</h2>
              <p className="text-sm mb-5" style={{ color: "#94A3B8" }}>
                Submit your song request and I'll do my best to play it!
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#EF44441A", color: "#EF4444", border: "1px solid #EF444422" }}>
                  {error}
                </div>
              )}

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>
                    Song Title <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(157,111,239,0.3)",
                    }}
                    placeholder="e.g. Blinding Lights"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Artist</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(157,111,239,0.2)",
                    }}
                    placeholder="e.g. The Weeknd"
                    value={form.artist}
                    onChange={e => setForm(f => ({ ...f, artist: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Your Name</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(157,111,239,0.2)",
                    }}
                    placeholder="Optional"
                    value={form.requestedBy}
                    onChange={e => setForm(f => ({ ...f, requestedBy: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>
                    <Heart size={11} className="inline mr-1" />Dedication / Message
                  </label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(157,111,239,0.2)",
                    }}
                    placeholder="e.g. For the bride and groom! 💍"
                    rows={2}
                    value={form.dedication}
                    onChange={e => setForm(f => ({ ...f, dedication: e.target.value }))}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: submitting ? "#4C1D95" : "linear-gradient(135deg, #7C3AED, #9D6FEF)",
                    color: "#fff",
                    opacity: submitting ? 0.8 : 1,
                  }}
                >
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                  ) : (
                    <><Send size={14} /> Submit Request</>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div
                className="inline-flex items-center justify-center rounded-full mb-4"
                style={{ width: 64, height: 64, background: "#10B9811A" }}
              >
                <CheckCircle size={32} color="#10B981" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Request Sent! 🎵</h2>
              <p className="text-sm mb-1" style={{ color: "#94A3B8" }}>
                <strong className="text-white">"{form.title}"</strong>{form.artist && ` by ${form.artist}`}
              </p>
              {form.dedication && (
                <p className="text-sm italic mt-2" style={{ color: "#7C3AED" }}>"{form.dedication}"</p>
              )}
              <p className="text-sm mt-3" style={{ color: "#64748B" }}>
                I'll do my best to play your song! 🎧
              </p>
              <button
                onClick={reset}
                className="mt-5 px-5 py-2 rounded-xl text-sm font-medium"
                style={{ background: "rgba(124,58,237,0.2)", color: "#9D6FEF" }}
              >
                Request another
              </button>
            </div>
          )}
        </div>

        {/* Tip card */}
        <div
          className="rounded-2xl p-5 text-center"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(157,111,239,0.15)" }}
        >
          <DollarSign size={20} color="#10B981" className="mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white mb-1">Leave a Tip</h3>
          <p className="text-sm mb-3" style={{ color: "#64748B" }}>
            Enjoying the music? Show some love! 💚
          </p>
          <div
            className="inline-block px-5 py-2.5 rounded-xl text-base font-bold"
            style={{ background: "linear-gradient(135deg, #10B981, #059669)", color: "#fff", letterSpacing: "0.02em" }}
          >
            {CASHAPP_HANDLE}
          </div>
          <p className="text-xs mt-2" style={{ color: "#475569" }}>on Cash App</p>
        </div>

        {/* QR Code card */}
        <div
          className="rounded-2xl p-5 text-center"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(157,111,239,0.15)" }}
        >
          <h3 className="text-sm font-semibold text-white mb-1">Share This Page</h3>
          <p className="text-xs mb-4" style={{ color: "#64748B" }}>
            Scan to request a song from your phone
          </p>
          <div className="flex justify-center">
            <img
              src={QR_URL}
              alt="QR Code for song requests"
              width={160}
              height={160}
              className="rounded-xl"
              style={{ border: "2px solid rgba(157,111,239,0.3)" }}
            />
          </div>
          <p className="text-xs mt-3 font-mono break-all" style={{ color: "#475569" }}>{PUBLIC_URL}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs" style={{ color: "#334155" }}>
          Powered by Roman Sounds DJ Services
        </p>
      </div>
    </div>
  );
}
