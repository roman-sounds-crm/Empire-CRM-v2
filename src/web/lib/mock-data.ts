// Mock data for Empire CRM

export const stats = {
  revenue: { value: 84320, change: +12.4, label: "Total Revenue" },
  events: { value: 47, change: +8, label: "Active Events" },
  leads: { value: 124, change: +23, label: "Total Leads" },
  contracts: { value: 38, change: +5, label: "Signed Contracts" },
};

export const revenueData = [
  { month: "Jan", revenue: 6200, bookings: 8 },
  { month: "Feb", revenue: 5800, bookings: 7 },
  { month: "Mar", revenue: 7400, bookings: 10 },
  { month: "Apr", revenue: 8100, bookings: 12 },
  { month: "May", revenue: 9300, bookings: 14 },
  { month: "Jun", revenue: 11200, bookings: 16 },
  { month: "Jul", revenue: 10800, bookings: 15 },
  { month: "Aug", revenue: 12400, bookings: 18 },
  { month: "Sep", revenue: 9800, bookings: 13 },
  { month: "Oct", revenue: 13200, bookings: 19 },
  { month: "Nov", revenue: 14100, bookings: 21 },
  { month: "Dec", revenue: 16020, bookings: 24 },
];

export const events = [
  { id: "e1", title: "Sarah & James Wedding", type: "Wedding", date: "2025-10-15", time: "6:00 PM", venue: "The Grand Ballroom, Downtown", status: "confirmed", client: "Sarah Mitchell", value: 2800, contractSigned: true, depositPaid: true },
  { id: "e2", title: "Corporate Gala — TechCorp", type: "Corporate", date: "2025-10-22", time: "7:00 PM", venue: "Skyline Rooftop, Midtown", status: "confirmed", client: "Marcus Johnson", value: 1800, contractSigned: true, depositPaid: true },
  { id: "e3", title: "Emma's 30th Birthday", type: "Birthday", date: "2025-11-02", time: "8:00 PM", venue: "Club Luxe, West End", status: "pending", client: "Emma Clarke", value: 950, contractSigned: false, depositPaid: false },
  { id: "e4", title: "Rivera & Torres Wedding", type: "Wedding", date: "2025-11-08", time: "5:30 PM", venue: "Ocean View Estate", status: "confirmed", client: "Maria Rivera", value: 3200, contractSigned: true, depositPaid: true },
  { id: "e5", title: "New Year's Eve Party", type: "Club Night", date: "2025-12-31", time: "9:00 PM", venue: "Apex Nightclub", status: "confirmed", client: "Apex Events Ltd", value: 5000, contractSigned: true, depositPaid: true },
  { id: "e6", title: "Patel Anniversary", type: "Anniversary", date: "2025-11-20", time: "7:00 PM", venue: "The Rose Garden", status: "pending", client: "Raj Patel", value: 1200, contractSigned: false, depositPaid: false },
  { id: "e7", title: "University Freshers Ball", type: "University", date: "2025-10-03", time: "8:00 PM", venue: "University Union Hall", status: "confirmed", client: "Student Union Rep", value: 2100, contractSigned: true, depositPaid: true },
  { id: "e8", title: "Friday Residency Week 12", type: "Residency", date: "2025-10-18", time: "10:00 PM", venue: "Velvet Underground", status: "confirmed", client: "Velvet Underground", value: 800, contractSigned: true, depositPaid: true },
];

export const leads = [
  { id: "l1", name: "David & Lauren Chen", email: "d.chen@email.com", phone: "+1 555-0124", event: "Wedding", date: "2026-06-14", budget: 3500, status: "hot", source: "Website Form", notes: "Very responsive, wants premium package", lastContact: "2 hours ago" },
  { id: "l2", name: "Horizon Events Co.", email: "info@horizon.co", phone: "+1 555-0198", event: "Corporate", date: "2025-12-05", budget: 4000, status: "warm", source: "Referral", notes: "Needs 3 quotes for board approval", lastContact: "1 day ago" },
  { id: "l3", name: "Keisha Thompson", email: "keisha.t@gmail.com", phone: "+1 555-0267", event: "Birthday", date: "2025-11-15", budget: 1200, status: "warm", source: "Instagram", notes: "Likes the Silver package", lastContact: "3 days ago" },
  { id: "l4", name: "St. Anne's Church", email: "admin@stannes.org", phone: "+1 555-0312", event: "Wedding", date: "2026-04-20", budget: 2500, status: "cold", source: "Google Ads", notes: "Budget conscious, comparing providers", lastContact: "1 week ago" },
  { id: "l5", name: "VIP Lounge Bar", email: "+1 555-0445", phone: "+1 555-0445", event: "Residency", date: "2025-10-01", budget: 6000, status: "hot", source: "Direct", notes: "Weekly gig, 12-week contract", lastContact: "30 mins ago" },
  { id: "l6", name: "Amanda & Ryan Walsh", email: "walsh.wedding@gmail.com", phone: "+1 555-0532", event: "Wedding", date: "2026-07-12", budget: 2800, status: "new", source: "Website Form", notes: "Just submitted inquiry", lastContact: "Just now" },
];

export const contracts = [
  { id: "c1", title: "Wedding DJ Contract", client: "Sarah Mitchell", event: "Sarah & James Wedding", date: "2025-10-15", value: 2800, status: "signed", signedAt: "Sep 12, 2025", template: "Wedding Template" },
  { id: "c2", title: "Corporate Event Agreement", client: "Marcus Johnson", event: "Corporate Gala — TechCorp", date: "2025-10-22", value: 1800, status: "signed", signedAt: "Sep 18, 2025", template: "Corporate Template" },
  { id: "c3", title: "Wedding DJ Contract", client: "Maria Rivera", event: "Rivera & Torres Wedding", date: "2025-11-08", value: 3200, status: "signed", signedAt: "Sep 20, 2025", template: "Wedding Template" },
  { id: "c4", title: "Club Residency Contract", client: "Apex Events Ltd", event: "New Year's Eve Party", date: "2025-12-31", value: 5000, status: "signed", signedAt: "Sep 25, 2025", template: "Club/Residency Template" },
  { id: "c5", title: "Birthday Party Contract", client: "Emma Clarke", event: "Emma's 30th Birthday", date: "2025-11-02", value: 950, status: "sent", signedAt: null, template: "General Event Template" },
  { id: "c6", title: "Anniversary Event Contract", client: "Raj Patel", event: "Patel Anniversary", date: "2025-11-20", value: 1200, status: "draft", signedAt: null, template: "General Event Template" },
];

export const contractTemplates = [
  { id: "t1", name: "Wedding DJ Contract", fields: 24, lastUsed: "Sep 12, 2025" },
  { id: "t2", name: "Corporate Event Agreement", fields: 18, lastUsed: "Sep 18, 2025" },
  { id: "t3", name: "Club/Residency Contract", fields: 20, lastUsed: "Sep 25, 2025" },
  { id: "t4", name: "Birthday Party Contract", fields: 16, lastUsed: "Sep 22, 2025" },
  { id: "t5", name: "Contractor Agreement", fields: 22, lastUsed: "Sep 10, 2025" },
];

export const invoices = [
  { id: "inv-001", client: "Sarah Mitchell", event: "Sarah & James Wedding", amount: 2800, paid: 1400, due: 1400, dueDate: "Oct 01, 2025", status: "partial", issuedDate: "Sep 12, 2025" },
  { id: "inv-002", client: "Marcus Johnson", event: "Corporate Gala", amount: 1800, paid: 1800, due: 0, dueDate: "Oct 15, 2025", status: "paid", issuedDate: "Sep 18, 2025" },
  { id: "inv-003", client: "Maria Rivera", event: "Rivera & Torres Wedding", amount: 3200, paid: 1600, due: 1600, dueDate: "Oct 28, 2025", status: "partial", issuedDate: "Sep 20, 2025" },
  { id: "inv-004", client: "Apex Events Ltd", event: "New Year's Eve Party", amount: 5000, paid: 2500, due: 2500, dueDate: "Nov 30, 2025", status: "partial", issuedDate: "Sep 25, 2025" },
  { id: "inv-005", client: "Emma Clarke", event: "Emma's 30th Birthday", amount: 950, paid: 0, due: 950, dueDate: "Oct 10, 2025", status: "overdue", issuedDate: "Sep 15, 2025" },
  { id: "inv-006", client: "Student Union", event: "Freshers Ball", amount: 2100, paid: 2100, due: 0, dueDate: "Sep 25, 2025", status: "paid", issuedDate: "Sep 05, 2025" },
];

export const contractors = [
  { id: "con1", name: "DJ Phantom", email: "phantom@djmail.com", phone: "+1 555-7001", skills: ["Open Format", "Hip Hop", "R&B"], events: 12, rating: 4.9, status: "active", avatar: "P" },
  { id: "con2", name: "Beats by Nova", email: "nova@djmail.com", phone: "+1 555-7002", skills: ["House", "Techno", "Electronic"], events: 8, rating: 4.7, status: "active", avatar: "N" },
  { id: "con3", name: "MC Skyline", email: "skyline@djmail.com", phone: "+1 555-7003", skills: ["MCing", "Wedding", "Corporate"], events: 15, rating: 5.0, status: "active", avatar: "S" },
  { id: "con4", name: "DJ Solaris", email: "solaris@djmail.com", phone: "+1 555-7004", skills: ["Latino", "Salsa", "Reggaeton"], events: 6, rating: 4.8, status: "pending", avatar: "S" },
  { id: "con5", name: "Bass Theory", email: "bass@djmail.com", phone: "+1 555-7005", skills: ["Drum & Bass", "Jungle", "Electronic"], events: 4, rating: 4.6, status: "active", avatar: "B" },
];

export const packages = [
  { id: "pkg1", name: "Starter Pack", duration: "3 hours", description: "Perfect for small gatherings and private parties", price: 600, popular: false, includes: ["Sound system", "Basic lighting", "DJ equipment", "Setup & breakdown"], addons: [] },
  { id: "pkg2", name: "Silver Package", duration: "5 hours", description: "Most popular for birthday parties and anniversaries", price: 900, popular: true, includes: ["Full sound system", "LED uplighting", "MC service", "Wireless mic", "Setup & breakdown", "Music planning session"], addons: ["Extra hour: $150", "Photo booth: $300", "Additional lighting: $200"] },
  { id: "pkg3", name: "Gold Package", duration: "6 hours", description: "Premium experience for weddings and corporate events", price: 1400, popular: false, includes: ["Premium sound system", "Full lighting rig", "MC service", "Wireless mics x2", "Fog machine", "Custom monogram", "Dedicated planner", "Setup & breakdown"], addons: ["Extra hour: $150", "Photo booth: $300", "Videography: $500", "Cocktail hour music: $250"] },
  { id: "pkg4", name: "Platinum Wedding", duration: "8 hours", description: "The complete luxury wedding DJ experience", price: 2200, popular: false, includes: ["Top-tier sound system", "Full lighting production", "Ceremony + reception", "MC + host service", "Photo booth 2hrs", "Monogram lighting", "Pre-wedding planning", "Unlimited revisions", "Day-of coordinator"], addons: ["Additional hours: $150", "Live band add-on: $800", "Drone video: $400"] },
];

export const teamMembers = [
  { id: "tm1", name: "Alex Rivera", email: "alex@empirecrm.com", role: "Admin", status: "active", lastActive: "Just now", avatar: "A" },
  { id: "tm2", name: "Jordan Smith", email: "jordan@empirecrm.com", role: "Sales Rep", status: "active", lastActive: "1 hour ago", avatar: "J" },
  { id: "tm3", name: "Sam Chen", email: "sam@empirecrm.com", role: "Staff", status: "active", lastActive: "3 hours ago", avatar: "S" },
  { id: "tm4", name: "Taylor Brooks", email: "taylor@empirecrm.com", role: "Contractor", status: "invited", lastActive: "Never", avatar: "T" },
];

export const messages = [
  { id: "m1", contact: "Sarah Mitchell", channel: "sms", content: "Hey! Just confirming the playlist was sent over?", time: "10:32 AM", unread: true, event: "Sarah & James Wedding" },
  { id: "m2", contact: "Marcus Johnson", channel: "email", content: "Thanks for the contract. Signed and returned.", time: "9:15 AM", unread: false, event: "Corporate Gala" },
  { id: "m3", contact: "Keisha Thompson", channel: "portal", content: "Can I add extra hour to the package?", time: "Yesterday", unread: true, event: "Emma's 30th Birthday" },
  { id: "m4", contact: "Horizon Events", channel: "email", content: "Can you send over the three quotes we discussed?", time: "Yesterday", unread: false, event: "Corporate Event" },
  { id: "m5", contact: "Maria Rivera", channel: "sms", content: "Received the invoice ✓ Will pay balance by Oct 28", time: "2 days ago", unread: false, event: "Rivera & Torres Wedding" },
];

export const songRequests = [
  { id: "sr1", title: "Mr. Brightside", artist: "The Killers", requestedBy: "Emma T.", dedication: "Happy birthday to my best friend!", status: "pending", time: "11:42 PM" },
  { id: "sr2", title: "Blinding Lights", artist: "The Weeknd", requestedBy: "James M.", dedication: null, status: "pending", time: "11:38 PM" },
  { id: "sr3", title: "Uptown Funk", artist: "Bruno Mars", requestedBy: "Sarah K.", dedication: null, status: "played", time: "11:20 PM" },
  { id: "sr4", title: "Don't Stop Me Now", artist: "Queen", requestedBy: "Tom B.", dedication: null, status: "played", time: "11:05 PM" },
  { id: "sr5", title: "Levitating", artist: "Dua Lipa", requestedBy: "Chloe R.", dedication: "For my dance floor crew!", status: "pending", time: "11:44 PM" },
  { id: "sr6", title: "Happy", artist: "Pharrell Williams", requestedBy: "Dan W.", dedication: null, status: "skipped", time: "10:55 PM" },
];

export const appointments = [
  { id: "a1", title: "Initial Consultation — Chen Wedding", client: "David & Lauren Chen", date: "Oct 18, 2025", time: "2:00 PM", duration: "45 min", type: "Zoom", status: "upcoming" },
  { id: "a2", title: "Package Review — Horizon Events", client: "Horizon Events Co.", date: "Oct 19, 2025", time: "11:00 AM", duration: "30 min", type: "Google Meet", status: "upcoming" },
  { id: "a3", title: "Contract Signing — Emma Clarke", client: "Emma Clarke", date: "Oct 17, 2025", time: "3:30 PM", duration: "20 min", type: "Phone", status: "completed" },
  { id: "a4", title: "Site Visit — Rivera Wedding", client: "Maria Rivera", date: "Oct 20, 2025", time: "10:00 AM", duration: "60 min", type: "In-Person", status: "upcoming" },
];

export const workflows = [
  { id: "wf1", name: "New Lead Welcome Sequence", trigger: "Lead submits form", actions: ["Send welcome email", "Create CRM entry", "Send SMS intro", "Schedule follow-up"], status: "active", runs: 124 },
  { id: "wf2", name: "Contract Signed → Invoice", trigger: "Contract signed", actions: ["Generate invoice", "Send deposit request", "Notify admin", "Update event status"], status: "active", runs: 38 },
  { id: "wf3", name: "7-Day Pre-Event Reminder", trigger: "7 days before event", actions: ["Send playlist reminder", "Request final headcount", "Confirm venue details"], status: "active", runs: 45 },
  { id: "wf4", name: "Post-Event Review Request", trigger: "Event date passed", actions: ["Send thank you email", "Request Google review", "Capture guest emails"], status: "active", runs: 29 },
  { id: "wf5", name: "Overdue Invoice Follow-up", trigger: "Invoice overdue by 3 days", actions: ["Send reminder SMS", "Send reminder email", "Flag for manual follow-up"], status: "paused", runs: 12 },
];

export const calendarEvents = [
  { id: "cal1", title: "Sarah & James Wedding", date: "2025-10-15", color: "#7C3AED", type: "event" },
  { id: "cal2", title: "Corporate Gala", date: "2025-10-22", color: "#3B82F6", type: "event" },
  { id: "cal3", title: "Consultation — Chen", date: "2025-10-18", color: "#F59E0B", type: "appointment" },
  { id: "cal4", title: "Freshers Ball", date: "2025-10-03", color: "#10B981", type: "event" },
  { id: "cal5", title: "Friday Residency", date: "2025-10-18", color: "#EF4444", type: "event" },
  { id: "cal6", title: "Rivera Wedding", date: "2025-11-08", color: "#7C3AED", type: "event" },
];

export const analyticsData = {
  leadSources: [
    { source: "Website Form", count: 48, percentage: 38.7 },
    { source: "Referral", count: 31, percentage: 25.0 },
    { source: "Instagram", count: 24, percentage: 19.4 },
    { source: "Google Ads", count: 14, percentage: 11.3 },
    { source: "Direct", count: 7, percentage: 5.6 },
  ],
  eventTypes: [
    { type: "Wedding", count: 18, revenue: 42000 },
    { type: "Corporate", count: 12, revenue: 24000 },
    { type: "Birthday", count: 8, revenue: 9600 },
    { type: "Residency", count: 6, revenue: 14400 },
    { type: "Other", count: 3, revenue: 4200 },
  ],
  monthlyRevenue: revenueData,
};
