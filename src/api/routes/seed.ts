import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import { events, leads, contracts, invoices, contractors, songRequests, messages, packages, workflows, appointments } from "../database/schema";
import { nanoid } from "nanoid";

export const seedRoutes = new Hono();

seedRoutes.post("/", async (c) => {
  const db = drizzle(env.DB);

  // Seed Events
  await db.insert(events).values([
    { id: nanoid(), title: "Sarah & James Wedding", type: "Wedding", date: "2025-10-15", time: "6:00 PM", venue: "The Grand Ballroom, Downtown", status: "confirmed", clientName: "Sarah Mitchell", value: 2800, contractSigned: true, depositPaid: true },
    { id: nanoid(), title: "Corporate Gala — TechCorp", type: "Corporate", date: "2025-10-22", time: "7:00 PM", venue: "Skyline Rooftop, Midtown", status: "confirmed", clientName: "Marcus Johnson", value: 1800, contractSigned: true, depositPaid: true },
    { id: nanoid(), title: "Emma's 30th Birthday", type: "Birthday", date: "2025-11-02", time: "8:00 PM", venue: "Club Luxe, West End", status: "pending", clientName: "Emma Clarke", value: 950, contractSigned: false, depositPaid: false },
    { id: nanoid(), title: "Rivera & Torres Wedding", type: "Wedding", date: "2025-11-08", time: "5:30 PM", venue: "Ocean View Estate", status: "confirmed", clientName: "Maria Rivera", value: 3200, contractSigned: true, depositPaid: true },
    { id: nanoid(), title: "New Year's Eve Party", type: "Club Night", date: "2025-12-31", time: "9:00 PM", venue: "Apex Nightclub", status: "confirmed", clientName: "Apex Events Ltd", value: 5000, contractSigned: true, depositPaid: true },
  ]).onConflictDoNothing();

  // Seed Leads
  await db.insert(leads).values([
    { id: nanoid(), name: "David & Lauren Chen", email: "d.chen@email.com", phone: "+1 555-0124", event: "Wedding", eventDate: "2026-06-14", budget: 3500, status: "hot", source: "Website Form", notes: "Very responsive, wants premium package" },
    { id: nanoid(), name: "Horizon Events Co.", email: "info@horizon.co", phone: "+1 555-0198", event: "Corporate", eventDate: "2025-12-05", budget: 4000, status: "warm", source: "Referral", notes: "Needs 3 quotes" },
    { id: nanoid(), name: "Keisha Thompson", email: "keisha.t@gmail.com", phone: "+1 555-0267", event: "Birthday", eventDate: "2025-11-15", budget: 1200, status: "warm", source: "Instagram", notes: "Likes the Silver package" },
    { id: nanoid(), name: "VIP Lounge Bar", email: "vip@lounge.com", phone: "+1 555-0445", event: "Residency", eventDate: "2025-10-01", budget: 6000, status: "hot", source: "Direct", notes: "Weekly gig, 12-week contract" },
    { id: nanoid(), name: "Amanda & Ryan Walsh", email: "walsh.wedding@gmail.com", phone: "+1 555-0532", event: "Wedding", eventDate: "2026-07-12", budget: 2800, status: "new", source: "Website Form", notes: "Just submitted inquiry" },
  ]).onConflictDoNothing();

  // Seed Contractors
  await db.insert(contractors).values([
    { id: nanoid(), name: "DJ Phantom", email: "phantom@djmail.com", phone: "+1 555-7001", skills: JSON.stringify(["Open Format", "Hip Hop", "R&B"]), rating: 4.9, status: "active", eventsCompleted: 12 },
    { id: nanoid(), name: "Beats by Nova", email: "nova@djmail.com", phone: "+1 555-7002", skills: JSON.stringify(["House", "Techno", "Electronic"]), rating: 4.7, status: "active", eventsCompleted: 8 },
    { id: nanoid(), name: "MC Skyline", email: "skyline@djmail.com", phone: "+1 555-7003", skills: JSON.stringify(["MCing", "Wedding", "Corporate"]), rating: 5.0, status: "active", eventsCompleted: 15 },
  ]).onConflictDoNothing();

  // Seed Packages
  await db.insert(packages).values([
    { id: nanoid(), name: "Starter Pack", description: "Perfect for small gatherings", duration: "3 hours", price: 600, includes: JSON.stringify(["Sound system", "Basic lighting", "DJ equipment"]), addons: JSON.stringify([]), popular: false },
    { id: nanoid(), name: "Silver Package", description: "Most popular for birthday parties", duration: "5 hours", price: 900, includes: JSON.stringify(["Full sound system", "LED uplighting", "MC service", "Wireless mic"]), addons: JSON.stringify(["Extra hour: $150", "Photo booth: $300"]), popular: true },
    { id: nanoid(), name: "Gold Package", description: "Premium for weddings and corporate events", duration: "6 hours", price: 1400, includes: JSON.stringify(["Premium sound system", "Full lighting rig", "MC service", "Wireless mics x2"]), addons: JSON.stringify(["Extra hour: $150", "Photo booth: $300", "Videography: $500"]), popular: false },
    { id: nanoid(), name: "Platinum Wedding", description: "The complete luxury wedding DJ experience", duration: "8 hours", price: 2200, includes: JSON.stringify(["Top-tier sound system", "Full lighting production", "Ceremony + reception", "MC + host service"]), addons: JSON.stringify(["Additional hours: $150", "Live band: $800"]), popular: false },
  ]).onConflictDoNothing();

  // Seed Workflows
  await db.insert(workflows).values([
    { id: nanoid(), name: "New Lead Welcome Sequence", trigger: "Lead submits form", actions: JSON.stringify(["Send welcome email", "Create CRM entry", "Send SMS intro", "Schedule follow-up"]), status: "active", runs: 124 },
    { id: nanoid(), name: "Contract Signed → Invoice", trigger: "Contract signed", actions: JSON.stringify(["Generate invoice", "Send deposit request", "Notify admin"]), status: "active", runs: 38 },
    { id: nanoid(), name: "7-Day Pre-Event Reminder", trigger: "7 days before event", actions: JSON.stringify(["Send playlist reminder", "Request final headcount", "Confirm venue details"]), status: "active", runs: 45 },
    { id: nanoid(), name: "Post-Event Review Request", trigger: "Event date passed", actions: JSON.stringify(["Send thank you email", "Request Google review", "Capture guest emails"]), status: "active", runs: 29 },
  ]).onConflictDoNothing();

  return c.json({ success: true, message: "Database seeded successfully" });
});
