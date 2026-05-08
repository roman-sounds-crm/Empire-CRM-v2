import { useState, useEffect } from "react";
import Layout from "../components/layout/Layout";
import { api } from "../lib/api";
import { toast } from "../lib/toast";
import { Music, QrCode, CheckCircle, XCircle, Clock, Plus, X, ExternalLink, Trash2, Link } from "lucide-react";

interface SongRequest {
  id: string;
  eventId?: string;
  requestedBy?: string;
  song: string;
  artist?: string;
  type?: string;
  status: string;
  notes?: string;
  createdAt?: string;
}

interface Event {
  id: string;
  title: string;
  clientName: string;
}

const statusConfig: Record<string, { text: string; bg: string; border: string; label: string }> = {
  pending: { text: "#F59E0B", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)",  label: "Pending" },
  played:  { text: "#10B981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.3)",  label: "Played" },
  skipped: { text: "#475569", bg: "rgba(71,85,105,0.1)",   border: "rgba(71,85,105,0.3)",   label: "Skipped" },
  approved:{ text: "#3B82F6", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.3)",  label: "Approved" },
};

export default function SongRequests() {
  const [requests, setRequests]   = useState<SongRequest[]>([]);
  const [events, setEvents]       = useState<Event[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeEvent, setActiveEvent] = useState<string>("all");
  const [showAdd, setShowAdd]     = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [importing, setImporting] = useState(false);

  // New request form
  const [form, setForm] = useState({ song: "", artist: "", requestedBy: "", type: "request", notes: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [reqs, evts] = await Promise.all([
        api.get<SongRequest[]>("/song-requests"),
        api.get<Event[]>("/events"),
      ]);
      setRequests(reqs || []);
      setEvents(evts || []);
    } catch { toast.error("Failed to load song requests"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = activeEvent === "all"
    ? requests
    : requests.filter(r => r.eventId === activeEvent);

  const pending  = filtered.filter(r => r.status === "pending");
  const played   = filtered.filter(r => r.status === "played");
  const skipped  = filtered.filter(r => r.status === "skipped");

  const updateStatus = async (req: SongRequest, status: string) => {
    try {
      await api.put(`/song-requests/${req.id}`, { ...req, status });
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status } : r));
    } catch { toast.error("Failed to update"); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.del(`/song-requests/${id}`);
      setRequests(prev => prev.filter(r => r.id !== id));
      toast.success("Removed");
    } catch { toast.error("Failed to delete"); }
  };

  const handleAdd = async () => {
    if (!form.song.trim()) { toast.error("Song title required"); return; }
    setSaving(true);
    try {
      const created = await api.post<SongRequest>("/song-requests", {
        ...form,
        eventId: activeEvent !== "all" ? activeEvent : undefined,
        status: "pending",
      });
      setRequests(prev => [created, ...prev]);
      setForm({ song: "", artist: "", requestedBy: "", type: "request", notes: "" });
      setShowAdd(false);
      toast.success("Song request added");
    } catch { toast.error("Failed to add request"); }
    finally { setSaving(false); }
  };

  const handleImportPlaylist = async () => {
    if (!playlistUrl.trim()) { toast.error("Paste a playlist URL first"); return; }
    setImporting(true);

    // Parse platform from URL
    const url = playlistUrl.toLowerCase();
    let platform = "Unknown";
    if (url.includes("spotify.com"))      platform = "Spotify";
    else if (url.includes("music.apple")) platform = "Apple Music";
    else if (url.includes("youtube.com") || url.includes("youtu.be")) platform = "YouTube";
    else if (url.includes("tidal.com"))   platform = "Tidal";
    else if (url.includes("deezer.com"))  platform = "Deezer";

    // We can't scrape external playlists without OAuth — open the link and inform
    setTimeout(() => {
      setImporting(false);
      window.open(playlistUrl, "_blank");
      toast.info(`Opening ${platform} playlist — manually add songs from there`);
      setPlaylistUrl("");
    }, 800);
  };

  const portalRequestUrl = activeEvent !== "all"
    ? `${window.location.origin}/portal/requests?event=${activeEvent}`
    : `${window.location.origin}/portal/requests`;

  if (loading) return (
    <Layout title="Song Requests" subtitle="Live DJ feed & request management">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    </Layout>
  );

  return (
    <Layout
      title="Song Requests"
      subtitle="Live DJ feed & request management"
      action={{ label: "Add Request", onClick: () => setShowAdd(true) }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Main feed */}
        <div className="md:col-span-2 space-y-5">

          {/* Event filter + stats */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={activeEvent}
              onChange={e => setActiveEvent(e.target.value)}
              className="empire-input text-sm"
              style={{ minWidth: 200 }}
            >
              <option value="all">All Events</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#1C2030", border: "1px solid #252A3A" }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#10B981" }} />
              <span className="text-sm font-medium text-white">LIVE</span>
            </div>
            <span className="text-sm font-mono" style={{ color: "#94A3B8" }}>
              {filtered.length} total · {pending.length} pending · {played.length} played
            </span>
          </div>

          {/* Pending */}
          <div>
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Clock size={16} color="#F59E0B" /> Incoming ({pending.length})
            </h3>
            <div className="space-y-3">
              {pending.length === 0 ? (
                <div className="empire-card p-10 text-center">
                  <Music size={32} color="#252A3A" className="mx-auto mb-2" />
                  <p className="text-sm" style={{ color: "#475569" }}>No pending requests</p>
                  <button onClick={() => setShowAdd(true)} className="mt-3 text-xs px-4 py-2 rounded-lg cursor-pointer"
                    style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#9D6FEF" }}>
                    Add one manually
                  </button>
                </div>
              ) : pending.map(req => (
                <div key={req.id} className="empire-card p-4 flex items-start gap-4 transition-all hover:scale-[1.005]"
                  style={{ borderLeft: "3px solid #F59E0B" }}>
                  <div className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ width: 44, height: 44, background: "rgba(245,158,11,0.1)" }}>
                    <Music size={20} color="#F59E0B" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{req.song}</p>
                    {req.artist && <p className="text-sm" style={{ color: "#94A3B8" }}>{req.artist}</p>}
                    <p className="text-xs mt-1" style={{ color: "#475569" }}>
                      {req.requestedBy && <>By <span style={{ color: "#9D6FEF" }}>{req.requestedBy}</span> · </>}
                      <span className="capitalize">{req.type || "request"}</span>
                      {req.createdAt && <> · {new Date(req.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>}
                    </p>
                    {req.notes && (
                      <div className="mt-2 px-3 py-1.5 rounded-lg text-xs" style={{ background: "rgba(124,58,237,0.1)", color: "#9D6FEF" }}>
                        "{req.notes}"
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => updateStatus(req, "played")}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                      style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981" }}>
                      <CheckCircle size={11} /> Played
                    </button>
                    <button onClick={() => updateStatus(req, "skipped")}
                      className="p-1.5 rounded-lg cursor-pointer" style={{ background: "#1C2030", border: "1px solid #252A3A" }}>
                      <XCircle size={14} color="#475569" />
                    </button>
                    <button onClick={() => handleDelete(req.id)}
                      className="p-1.5 rounded-lg cursor-pointer hover:bg-red-900/20">
                      <Trash2 size={13} color="#EF4444" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Played */}
          {played.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "#94A3B8" }}>
                <CheckCircle size={16} color="#10B981" /> Played ({played.length})
              </h3>
              <div className="space-y-2">
                {played.map(req => (
                  <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg opacity-60"
                    style={{ background: "#1C2030", border: "1px solid #252A3A" }}>
                    <CheckCircle size={15} color="#10B981" className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white line-through">{req.song}</span>
                      {req.artist && <span className="text-xs ml-2" style={{ color: "#475569" }}>{req.artist}</span>}
                    </div>
                    {req.requestedBy && <span className="text-xs flex-shrink-0" style={{ color: "#475569" }}>{req.requestedBy}</span>}
                    <button onClick={() => handleDelete(req.id)} className="p-1 cursor-pointer flex-shrink-0">
                      <Trash2 size={12} color="#334155" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skipped */}
          {skipped.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "#475569" }}>
                <XCircle size={16} color="#475569" /> Skipped ({skipped.length})
              </h3>
              <div className="space-y-2">
                {skipped.map(req => (
                  <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg opacity-50"
                    style={{ background: "#1C2030", border: "1px solid #252A3A" }}>
                    <XCircle size={15} color="#475569" className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm" style={{ color: "#475569" }}>{req.song}</span>
                      {req.artist && <span className="text-xs ml-2" style={{ color: "#334155" }}>{req.artist}</span>}
                    </div>
                    <button onClick={() => updateStatus(req, "pending")}
                      className="text-xs px-2 py-1 rounded cursor-pointer flex-shrink-0"
                      style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>
                      Restore
                    </button>
                    <button onClick={() => handleDelete(req.id)} className="p-1 cursor-pointer flex-shrink-0">
                      <Trash2 size={12} color="#334155" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Client request link */}
          <div className="empire-card p-5">
            <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
              <Link size={15} color="#7C3AED" /> Client Request Link
            </h3>
            <p className="text-xs mb-3" style={{ color: "#475569" }}>Share this link so guests can submit requests</p>
            <div className="flex items-center gap-2 p-2 rounded-lg mb-3" style={{ background: "#1C2030", border: "1px solid #252A3A" }}>
              <code className="text-xs flex-1 truncate" style={{ color: "#94A3B8" }}>{portalRequestUrl}</code>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { navigator.clipboard?.writeText(portalRequestUrl); toast.success("Link copied!"); }}
                className="flex-1 py-2 rounded-lg text-xs font-medium cursor-pointer"
                style={{ background: "linear-gradient(135deg, #7C3AED, #9D6FEF)", color: "white" }}>
                Copy Link
              </button>
              <button
                onClick={() => window.open(portalRequestUrl, "_blank")}
                className="p-2 rounded-lg cursor-pointer"
                style={{ background: "#1C2030", border: "1px solid #252A3A" }}>
                <ExternalLink size={14} color="#94A3B8" />
              </button>
            </div>
          </div>

          {/* Import playlist */}
          <div className="empire-card p-5">
            <h3 className="font-semibold text-white mb-1">Import Playlist</h3>
            <p className="text-xs mb-3" style={{ color: "#475569" }}>Paste a Spotify, Apple Music, YouTube, Tidal or Deezer playlist URL to open it</p>
            <div className="space-y-2 mb-3">
              {[
                { name: "Spotify",     color: "#1DB954", url: "https://open.spotify.com" },
                { name: "Apple Music", color: "#FC3C44", url: "https://music.apple.com" },
                { name: "YouTube",     color: "#FF0000", url: "https://youtube.com/playlist" },
                { name: "Tidal",       color: "#00FFFF", url: "https://tidal.com" },
                { name: "Deezer",      color: "#A238FF", url: "https://deezer.com" },
              ].map(p => (
                <button key={p.name} onClick={() => window.open(p.url, "_blank")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-all"
                  style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#94A3B8" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = p.color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#252A3A"}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                  {p.name}
                  <ExternalLink size={11} className="ml-auto" color="#334155" />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={playlistUrl}
                onChange={e => setPlaylistUrl(e.target.value)}
                placeholder="Paste playlist URL..."
                className="empire-input flex-1 text-xs"
                onKeyDown={e => e.key === "Enter" && handleImportPlaylist()}
              />
              <button onClick={handleImportPlaylist} disabled={importing}
                className="px-3 py-2 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-50"
                style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)", color: "#9D6FEF" }}>
                {importing ? <span className="w-3 h-3 rounded-full border border-purple-400 border-t-transparent animate-spin inline-block" /> : "Open"}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="empire-card p-5">
            <h3 className="font-semibold text-white mb-3">Tonight's Stats</h3>
            <div className="space-y-3">
              {[
                { label: "Total Requests", value: filtered.length, color: "#9D6FEF" },
                { label: "Played",         value: played.length,   color: "#10B981" },
                { label: "Pending",        value: pending.length,  color: "#F59E0B" },
                { label: "Skipped",        value: skipped.length,  color: "#475569" },
              ].map(stat => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "#94A3B8" }}>{stat.label}</span>
                  <span className="text-sm font-bold font-mono" style={{ color: stat.color }}>{stat.value}</span>
                </div>
              ))}
              {filtered.length > 0 && (
                <div className="mt-2 pt-3" style={{ borderTop: "1px solid #252A3A" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: "#475569" }}>Completion</span>
                    <span className="text-xs font-mono" style={{ color: "#10B981" }}>
                      {Math.round((played.length / filtered.length) * 100)}%
                    </span>
                  </div>
                  <div className="rounded-full overflow-hidden" style={{ height: 6, background: "#1C2030" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${(played.length / filtered.length) * 100}%`, background: "#10B981" }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add request modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-2xl w-full max-w-md p-6 my-8 animate-fade-in-up"
            style={{ background: "#141824", border: "1px solid #252A3A" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Add Song Request</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg cursor-pointer hover:bg-[#1C2030]">
                <X size={18} color="#94A3B8" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Song Title *</label>
                <input value={form.song} onChange={e => setForm(p => ({...p, song: e.target.value}))}
                  className="empire-input w-full" placeholder="e.g. Blinding Lights" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Artist</label>
                <input value={form.artist} onChange={e => setForm(p => ({...p, artist: e.target.value}))}
                  className="empire-input w-full" placeholder="e.g. The Weeknd" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Requested By</label>
                <input value={form.requestedBy} onChange={e => setForm(p => ({...p, requestedBy: e.target.value}))}
                  className="empire-input w-full" placeholder="Guest name" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Type</label>
                <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))}
                  className="empire-input w-full">
                  <option value="request">Request</option>
                  <option value="dedication">Dedication</option>
                  <option value="do-not-play">Do Not Play</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Note / Dedication Message</label>
                <input value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))}
                  className="empire-input w-full" placeholder="Optional message..." />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 rounded-xl text-sm cursor-pointer"
                style={{ background: "#1C2030", border: "1px solid #252A3A", color: "#94A3B8" }}>Cancel</button>
              <button onClick={handleAdd} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7C3AED, #9D6FEF)" }}>
                {saving ? "Adding…" : "Add Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
