import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Music, DollarSign, CheckCircle, AlertCircle, CreditCard, Lock } from "lucide-react";

export default function PortalPay() {
  const params = useParams<{ token: string }>();

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Demo mode: token starts with "demo_"
    if (params.token?.startsWith("demo_")) {
      setInvoice({
        id: "DEMO-001",
        clientName: "Demo Client",
        amount: 2500,
        paid: 0,
        due: 2500,
        status: "pending",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      });
      setLoading(false);
      return;
    }

    fetch(`/api/portal/invoice/pay/${params.token}`)
      .then(r => r.ok ? r.json() : Promise.reject("Not found"))
      .then(d => setInvoice(d))
      .catch(() => setError("This payment link is invalid or has expired."))
      .finally(() => setLoading(false));
  }, [params.token]);

  const handlePay = async () => {
    if (!invoice) return;
    setRedirecting(true);
    try {
      // If there's already a Stripe URL on the invoice, go there
      if (invoice.stripeCheckoutUrl && !invoice.stripeCheckoutUrl.includes("/portal/pay/")) {
        window.location.href = invoice.stripeCheckoutUrl;
        return;
      }

      // Otherwise, generate a new checkout session
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: invoice.due,
          clientEmail: invoice.clientEmail,
          clientName: invoice.clientName,
          description: `Invoice ${invoice.id} — Roman Sounds / DJ Randy Roman`,
        }),
      });
      const data = await res.json();
      if (data.url) {
        if (data.mode === "demo") {
          alert(`Demo Mode: In production with a real Stripe key, you'd be redirected to Stripe Checkout.\n\nPayment URL: ${data.url}`);
          setRedirecting(false);
        } else {
          window.location.href = data.url;
        }
      } else {
        throw new Error(data.error || "Failed");
      }
    } catch (e: any) {
      alert(e?.message || "Payment failed. Please contact Randy.");
      setRedirecting(false);
    }
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
      <p className="text-sm" style={{ color: "#475569" }}>
        Please contact <a href="mailto:randy@romansounds.com" className="text-purple-400">randy@romansounds.com</a>
      </p>
    </div>
  );

  if (invoice?.status === "paid") return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8" style={{ background: "#0D1117" }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)", border: "2px solid #10B981" }}>
        <CheckCircle size={36} color="#10B981" />
      </div>
      <h2 className="text-2xl font-bold text-white">Already Paid!</h2>
      <p style={{ color: "#94A3B8" }}>Invoice {invoice.id} has been paid in full. Thank you!</p>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#0D1117", color: "#F1F5F9" }}>
      {/* Header */}
      <div style={{ background: "#141824", borderBottom: "1px solid #1E2435" }}>
        <div className="max-w-lg mx-auto px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}>
            <Music size={18} color="white" />
          </div>
          <div>
            <p className="font-bold text-white">Roman Sounds</p>
            <p className="text-xs" style={{ color: "#475569" }}>Secure Payment</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-5">

        {params.token?.startsWith("demo_") && (
          <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B" }}>
            <strong>Demo Mode</strong> — Add a real Stripe secret key to enable live payments.
          </div>
        )}

        {/* Invoice summary */}
        <div className="rounded-2xl p-6" style={{ background: "#141824", border: "1px solid #1E2435" }}>
          <div className="flex items-center gap-2 mb-5">
            <DollarSign size={18} color="#7C3AED" />
            <h2 className="font-bold text-white">Payment Summary</h2>
          </div>
          <div className="space-y-3">
            {[
              ["Invoice",  invoice?.id],
              ["Client",   invoice?.clientName],
              ["Total",    `$${(invoice?.amount||0).toLocaleString()}`],
              ["Paid",     `$${(invoice?.paid||0).toLocaleString()}`],
              ["Due Date", invoice?.dueDate || "—"],
            ].map(([label, val]) => (
              <div key={label as string} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid #1E2435" }}>
                <span className="text-sm" style={{ color: "#94A3B8" }}>{label}</span>
                <span className="text-sm font-semibold text-white">{val as string}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3">
              <span className="text-base font-bold text-white">Balance Due</span>
              <span className="text-2xl font-bold" style={{ color: "#7C3AED" }}>${(invoice?.due||0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Pay button */}
        <button onClick={handlePay} disabled={redirecting}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-base font-bold cursor-pointer disabled:opacity-60 transition-opacity"
          style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white" }}>
          {redirecting
            ? <><span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> Redirecting…</>
            : <><CreditCard size={18} /> Pay ${(invoice?.due||0).toLocaleString()} Securely</>}
        </button>

        <div className="flex items-center justify-center gap-2">
          <Lock size={12} color="#334155" />
          <span className="text-xs" style={{ color: "#334155" }}>Secured by Stripe · 256-bit SSL</span>
        </div>

        <div className="text-center">
          <p className="text-xs" style={{ color: "#334155" }}>
            Questions? <a href="mailto:randy@romansounds.com" className="text-purple-400">randy@romansounds.com</a>
            <br />Randy Delgado dba DJ Randy Roman — Roman Sounds
          </p>
        </div>
      </div>
    </div>
  );
}
