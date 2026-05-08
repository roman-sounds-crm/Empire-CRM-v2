import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { Music, FileText, CheckCircle, AlertCircle } from "lucide-react";

export default function PortalSign() {
  const params = useParams<{ id: string }>();
  const token = new URLSearchParams(window.location.search).get("token");

  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [signing, setSigning]   = useState(false);
  const [signed, setSigned]     = useState(false);
  const [signedAt, setSignedAt] = useState("");

  // Canvas for signature
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSig, setHasSig]       = useState(false);

  useEffect(() => {
    fetch(`/api/portal/contract/${params.id}/sign`)
      .then(r => r.ok ? r.json() : Promise.reject("Not found"))
      .then(d => {
        setContract(d);
        if (d.status === "signed" || d.signatureData) { setSigned(true); setSignedAt(d.signedAt); }
      })
      .catch(() => setError("Contract not found."))
      .finally(() => setLoading(false));
  }, [params.id]);

  // Canvas drawing
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasSig(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#7C3AED";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const stopDraw = () => setIsDrawing(false);

  const clearSig = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
  };

  const handleSign = async () => {
    if (!hasSig) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sigDataUrl = canvas.toDataURL("image/png");

    setSigning(true);
    try {
      const res = await fetch(`/api/portal/contract/${params.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature: sigDataUrl,
          signerName: contract?.clientName,
          signerEmail: contract?.clientEmail,
        }),
      });
      if (!res.ok) throw new Error("Failed to sign");
      const data = await res.json();
      setSigned(true);
      setSignedAt(data.signedAt);
    } catch { setError("Failed to submit signature. Please try again."); }
    finally { setSigning(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D1117" }}>
      <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8" style={{ background: "#0D1117" }}>
      <AlertCircle size={40} color="#EF4444" />
      <p className="text-white font-semibold">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#0D1117", color: "#F1F5F9" }}>
      {/* Header */}
      <div style={{ background: "#141824", borderBottom: "1px solid #1E2435" }}>
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}>
            <Music size={18} color="white" />
          </div>
          <div>
            <p className="font-bold text-white">Roman Sounds</p>
            <p className="text-xs" style={{ color: "#475569" }}>Contract Signing</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {signed ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(16,185,129,0.15)", border: "2px solid #10B981" }}>
              <CheckCircle size={36} color="#10B981" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Contract Signed!</h2>
            <p style={{ color: "#94A3B8" }}>Signed on {signedAt ? new Date(signedAt).toLocaleString() : "today"}</p>
            <p className="mt-4 text-sm" style={{ color: "#475569" }}>A copy has been saved. Contact Randy if you need a PDF copy.</p>
            {token && (
              <a href={`/portal?token=${token}`}
                className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl text-sm font-semibold"
                style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white" }}>
                Back to My Portal
              </a>
            )}
          </div>
        ) : (
          <>
            {/* Contract preview */}
            <div className="rounded-2xl p-6 mb-6" style={{ background: "#141824", border: "1px solid #1E2435" }}>
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} color="#7C3AED" />
                <h2 className="font-bold text-white">DJ Service Contract</h2>
              </div>
              <div className="space-y-3">
                {[
                  ["Contract ID", contract?.id],
                  ["Title",       contract?.title],
                  ["Client",      contract?.clientName],
                  ["Template",    contract?.template || "Custom"],
                  ["Total Value", contract?.value ? `${(contract.value||0).toLocaleString()}` : "—"],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex items-start justify-between py-2" style={{ borderBottom: "1px solid #1E2435" }}>
                    <span className="text-xs font-semibold" style={{ color: "#475569" }}>{label}</span>
                    <span className="text-sm text-white text-right max-w-xs">{val as string}</span>
                  </div>
                ))}
              </div>
              {contract?.content && (
                <div className="mt-4 p-4 rounded-xl" style={{ background: "#0D1117", border: "1px solid #1E2435" }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#475569" }}>CONTRACT TERMS</p>
                  <pre className="text-sm whitespace-pre-wrap" style={{ color: "#94A3B8", lineHeight: 1.7, maxHeight: 200, overflowY: "auto", fontFamily: "inherit" }}>
                    {contract.content}
                  </pre>
                </div>
              )}
            </div>

            {/* Signature pad */}
            <div className="rounded-2xl p-6" style={{ background: "#141824", border: "1px solid #1E2435" }}>
              <h3 className="font-bold text-white mb-2">Sign Here</h3>
              <p className="text-sm mb-4" style={{ color: "#94A3B8" }}>Draw your signature in the box below with your mouse or finger.</p>
              <div className="relative rounded-xl overflow-hidden" style={{ border: "2px solid #252A3A", background: "#0D1117" }}>
                <canvas
                  ref={canvasRef} width={560} height={160}
                  className="w-full cursor-crosshair touch-none"
                  style={{ display: "block" }}
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                  onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
                />
                {!hasSig && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-sm" style={{ color: "#334155" }}>Sign here...</p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-4">
                <button onClick={clearSig} className="text-sm cursor-pointer" style={{ color: "#475569" }}>Clear</button>
                <button onClick={handleSign} disabled={!hasSig || signing}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white" }}>
                  {signing
                    ? <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Signing…</>
                    : <><CheckCircle size={15} /> I Agree & Sign</>}
                </button>
              </div>
              <p className="text-xs mt-3" style={{ color: "#334155" }}>
                By signing, you agree to the terms of this contract with Randy Delgado dba DJ Randy Roman — Roman Sounds.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
