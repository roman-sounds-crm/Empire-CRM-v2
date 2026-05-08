import { useState, useEffect, useRef } from "react";
import Layout from "../components/layout/Layout";
import { api } from "../lib/api";
import { toast } from "../lib/toast";
import {
  MessageSquare, Mail, Globe, Send, Sparkles, Loader2, Plus, X,
  Trash2, Phone, AtSign, Search, CheckCheck, Check
} from "lucide-react";

type Message = {
  id: string;
  contact: string;
  channel: string;
  content: string;
  direction: string;
  eventId?: string;
  read?: boolean;
  createdAt?: string;
};

type Thread = {
  key: string;
  contact: string;
  channel: string;
  eventId?: string;
  messages: Message[];
  lastMsg: Message;
  unread: number;
};

const CH_ICONS: Record<string, any> = { sms: Phone, email: Mail, portal: Globe };
const CH_COLORS: Record<string, string> = { sms: "#10B981", email: "#3B82F6", portal: "#7C3AED" };
const CH_LABELS: Record<string, string> = { sms: "SMS", email: "Email", portal: "Portal" };

function buildThreads(msgs: Message[]): Thread[] {
  const map: Record<string, Thread> = {};
  const sorted = [...msgs].sort((a, b) =>
    (a.createdAt || "") < (b.createdAt || "") ? -1 : 1
  );
  for (const m of sorted) {
    const key = `${m.contact}__${m.channel}`;
    if (!map[key]) {
      map[key] = { key, contact: m.contact, channel: m.channel, eventId: m.eventId, messages: [], lastMsg: m, unread: 0 };
    }
    map[key].messages.push(m);
    map[key].lastMsg = m;
    if (!m.read && m.direction === "inbound") map[key].unread++;
  }
  return Object.values(map).sort((a, b) =>
    (a.lastMsg.createdAt || "") < (b.lastMsg.createdAt || "") ? 1 : -1
  );
}

function fmtTime(ts?: string) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function Messaging() {
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newModal, setNewModal] = useState(false);
  const [newContact, setNewContact] = useState("");
  const [newChannel, setNewChannel] = useState<"sms" | "email">("sms");
  const [newMessage, setNewMessage] = useState("");
  const [deletingThread, setDeletingThread] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const msgs = await api.get<Message[]>("/messages");
      setAllMessages(msgs);
      const t = buildThreads(msgs);
      setThreads(t);
      if (!selectedKey && t.length > 0) setSelectedKey(t[0].key);
    } catch { toast.error("Failed to load messages"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [selectedKey, threads]);

  const selected = threads.find(t => t.key === selectedKey) || null;

  const handleSend = async () => {
    if (!input.trim() || !selected) return;
    setSending(true);
    try {
      const payload: any = {
        contact: selected.contact,
        channel: selected.channel,
        content: input.trim(),
        direction: "outbound",
        eventId: selected.eventId || undefined,
        read: true,
      };

      // Actually send via Twilio (SMS) or email
      if (selected.channel === "sms") {
        await api.post("/messages/send-sms", { to: selected.contact, body: input.trim() }).catch(() => null);
      } else if (selected.channel === "email") {
        await api.post("/messages/send-email", { to: selected.contact, subject: "Message from Roman Sounds", body: input.trim() }).catch(() => null);
      }

      const created = await api.post<Message>("/messages", payload);
      setAllMessages(prev => [...prev, created]);
      setThreads(buildThreads([...allMessages, created]));
      setInput("");
      setAiSuggestion(null);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch { toast.error("Failed to send"); }
    finally { setSending(false); }
  };

  const handleAiSuggest = async () => {
    if (!selected) return;
    setAiLoading(true);
    try {
      const history = selected.messages.slice(-6).map(m => `${m.direction === "outbound" ? "You" : "Client"}: ${m.content}`).join("\n");
      const res = await api.post<{ suggestion: string }>("/ai/suggest-reply", {
        context: `DJ business messaging. Recent chat:\n${history}\n\nWrite a professional, friendly reply.`,
      });
      setAiSuggestion(res.suggestion || "");
      setInput(res.suggestion || "");
    } catch { toast.error("AI suggestion failed"); }
    finally { setAiLoading(false); }
  };

  const handleDeleteThread = async (thread: Thread) => {
    if (!confirm(`Delete entire conversation with ${thread.contact}? This cannot be undone.`)) return;
    setDeletingThread(thread.key);
    try {
      await Promise.all(thread.messages.map(m => api.del(`/messages/${m.id}`)));
      const remaining = allMessages.filter(m => !(m.contact === thread.contact && m.channel === thread.channel));
      setAllMessages(remaining);
      const newThreads = buildThreads(remaining);
      setThreads(newThreads);
      if (selectedKey === thread.key) setSelectedKey(newThreads[0]?.key || null);
      toast.success("Conversation deleted");
    } catch { toast.error("Failed to delete"); }
    finally { setDeletingThread(null); }
  };

  const handleNewChat = async () => {
    if (!newContact.trim() || !newMessage.trim()) {
      toast.error("Contact and message required");
      return;
    }
    setSending(true);
    try {
      // Send via Twilio/email
      if (newChannel === "sms") {
        await api.post("/messages/send-sms", { to: newContact, body: newMessage }).catch(() => null);
      } else {
        await api.post("/messages/send-email", { to: newContact, subject: "Message from Roman Sounds", body: newMessage }).catch(() => null);
      }

      const created = await api.post<Message>("/messages", {
        contact: newContact.trim(),
        channel: newChannel,
        content: newMessage.trim(),
        direction: "outbound",
        read: true,
      });
      const updated = [...allMessages, created];
      setAllMessages(updated);
      const newThreads = buildThreads(updated);
      setThreads(newThreads);
      setSelectedKey(`${newContact.trim()}__${newChannel}`);
      setNewModal(false);
      setNewContact(""); setNewMessage(""); setNewChannel("sms");
      toast.success("Message sent");
    } catch { toast.error("Failed to send"); }
    finally { setSending(false); }
  };

  const filteredThreads = threads.filter(t =>
    t.contact.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden" style={{ background: "#0D1117" }}>

        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 flex flex-col" style={{ background: "#0D1117", borderRight: "1px solid #1E2435" }}>
          {/* Header */}
          <div className="p-4 space-y-3" style={{ borderBottom: "1px solid #1E2435" }}>
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-white">Messages</h1>
              <button
                onClick={() => setNewModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white" }}
              >
                <Plus size={13} /> New Chat
              </button>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-8 pr-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: "#141824", border: "1px solid #1E2435" }}
              />
            </div>
          </div>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 size={20} className="animate-spin" style={{ color: "#7C3AED" }} />
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare size={28} className="mx-auto mb-2" style={{ color: "#334155" }} />
                <p className="text-sm" style={{ color: "#475569" }}>No conversations yet</p>
                <button
                  onClick={() => setNewModal(true)}
                  className="mt-3 text-xs font-medium"
                  style={{ color: "#7C3AED" }}
                >
                  Start a new chat
                </button>
              </div>
            ) : (
              filteredThreads.map(t => {
                const Icon = CH_ICONS[t.channel] || MessageSquare;
                const color = CH_COLORS[t.channel] || "#7C3AED";
                const isSelected = t.key === selectedKey;
                return (
                  <div
                    key={t.key}
                    onClick={() => setSelectedKey(t.key)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer group relative"
                    style={{
                      background: isSelected ? "#141824" : "transparent",
                      borderLeft: isSelected ? `3px solid ${color}` : "3px solid transparent",
                    }}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
                      style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
                      {t.contact[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white truncate">{t.contact}</span>
                        <span className="text-xs flex-shrink-0" style={{ color: "#475569" }}>
                          {fmtTime(t.lastMsg.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Icon size={10} style={{ color, flexShrink: 0 }} />
                          <span className="text-xs truncate" style={{ color: "#64748B" }}>
                            {t.lastMsg.direction === "outbound" ? "You: " : ""}{t.lastMsg.content}
                          </span>
                        </div>
                        {t.unread > 0 && (
                          <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0"
                            style={{ background: color, color: "white" }}>
                            {t.unread}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Delete button */}
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteThread(t); }}
                      disabled={deletingThread === t.key}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center transition-opacity cursor-pointer"
                      style={{ background: "rgba(239,68,68,0.1)" }}
                    >
                      {deletingThread === t.key
                        ? <Loader2 size={12} className="animate-spin" style={{ color: "#EF4444" }} />
                        : <Trash2 size={12} style={{ color: "#EF4444" }} />}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        {selected ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat header */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ background: "#141824", borderBottom: "1px solid #1E2435" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ background: `${CH_COLORS[selected.channel] || "#7C3AED"}22`, border: `1px solid ${CH_COLORS[selected.channel] || "#7C3AED"}44` }}>
                  {selected.contact[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white">{selected.contact}</p>
                  <div className="flex items-center gap-1.5">
                    {(() => { const Icon = CH_ICONS[selected.channel] || MessageSquare; return <Icon size={11} style={{ color: CH_COLORS[selected.channel] }} />; })()}
                    <span className="text-xs" style={{ color: "#475569" }}>{CH_LABELS[selected.channel] || selected.channel}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDeleteThread(selected)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <Trash2 size={12} /> Delete Chat
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3">
              {selected.messages.map(m => (
                <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[70%]">
                    <div
                      className="px-4 py-3 rounded-2xl text-sm"
                      style={m.direction === "outbound"
                        ? { background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white", borderBottomRightRadius: "4px" }
                        : { background: "#1C2030", color: "#E2E8F0", border: "1px solid #252A3A", borderBottomLeftRadius: "4px" }
                      }
                    >
                      {m.content}
                    </div>
                    <div className={`flex items-center gap-1 mt-1 ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                      <span className="text-xs" style={{ color: "#334155" }}>{fmtTime(m.createdAt)}</span>
                      {m.direction === "outbound" && (
                        m.read
                          ? <CheckCheck size={12} style={{ color: "#7C3AED" }} />
                          : <Check size={12} style={{ color: "#475569" }} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* AI suggestion banner */}
            {aiSuggestion && (
              <div className="mx-6 mb-2 px-4 py-2 rounded-xl flex items-center gap-2" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)" }}>
                <Sparkles size={13} style={{ color: "#9D6FEF", flexShrink: 0 }} />
                <span className="text-xs flex-1" style={{ color: "#9D6FEF" }}>AI suggestion applied — edit freely</span>
                <button onClick={() => { setAiSuggestion(null); setInput(""); }} className="text-xs cursor-pointer" style={{ color: "#475569" }}>Clear</button>
              </div>
            )}

            {/* Input */}
            <div className="px-6 py-4" style={{ borderTop: "1px solid #1E2435", background: "#0D1117" }}>
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={`Message via ${CH_LABELS[selected.channel] || selected.channel}...`}
                  rows={2}
                  className="flex-1 px-4 py-3 rounded-xl text-sm text-white outline-none resize-none"
                  style={{ background: "#141824", border: "1px solid #1E2435" }}
                />
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleAiSuggest}
                    disabled={aiLoading}
                    className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer"
                    style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}
                    title="AI suggest reply"
                  >
                    {aiLoading ? <Loader2 size={15} className="animate-spin" style={{ color: "#9D6FEF" }} /> : <Sparkles size={15} style={{ color: "#9D6FEF" }} />}
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}
                  >
                    {sending ? <Loader2 size={15} className="animate-spin text-white" /> : <Send size={15} color="white" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ color: "#334155" }}>
            <MessageSquare size={48} />
            <p className="text-lg font-semibold">Select a conversation</p>
            <button
              onClick={() => setNewModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
              style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white" }}
            >
              <Plus size={15} /> Start New Chat
            </button>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {newModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ background: "#141824", border: "1px solid #1E2435" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">New Conversation</h2>
              <button onClick={() => setNewModal(false)} className="cursor-pointer" style={{ color: "#475569" }}><X size={18} /></button>
            </div>

            {/* Channel picker */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: "#94A3B8" }}>Channel</label>
              <div className="flex gap-2">
                {(["sms", "email"] as const).map(ch => {
                  const Icon = CH_ICONS[ch];
                  return (
                    <button
                      key={ch}
                      onClick={() => setNewChannel(ch)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                      style={newChannel === ch
                        ? { background: `${CH_COLORS[ch]}22`, border: `2px solid ${CH_COLORS[ch]}`, color: CH_COLORS[ch] }
                        : { background: "#1C2030", border: "2px solid #252A3A", color: "#64748B" }}
                    >
                      <Icon size={14} /> {CH_LABELS[ch]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact input */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94A3B8" }}>
                {newChannel === "sms" ? "Phone Number" : "Email Address"}
              </label>
              <div className="relative">
                {newChannel === "sms"
                  ? <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
                  : <AtSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
                }
                <input
                  value={newContact}
                  onChange={e => setNewContact(e.target.value)}
                  placeholder={newChannel === "sms" ? "+1 (555) 000-0000" : "client@email.com"}
                  className="w-full pl-8 pr-3 py-2.5 rounded-lg text-sm text-white outline-none"
                  style={{ background: "#1C2030", border: "1px solid #252A3A" }}
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94A3B8" }}>Message</label>
              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                rows={4}
                placeholder="Write your message..."
                className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none resize-none"
                style={{ background: "#1C2030", border: "1px solid #252A3A" }}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setNewModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: "#1C2030", color: "#94A3B8", border: "1px solid #252A3A" }}>
                Cancel
              </button>
              <button
                onClick={handleNewChat}
                disabled={sending || !newContact.trim() || !newMessage.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white" }}
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
