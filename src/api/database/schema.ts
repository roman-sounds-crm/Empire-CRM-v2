import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export * from "./auth-schema";

// Events
export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  venue: text("venue").notNull(),
  status: text("status").notNull().default("pending"),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  value: real("value").notNull().default(0),
  contractSigned: integer("contract_signed", { mode: "boolean" }).default(false),
  depositPaid: integer("deposit_paid", { mode: "boolean" }).default(false),
  notes: text("notes"),
  packageId: text("package_id"),
  contractorId: text("contractor_id"),
  portalToken: text("portal_token"),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").default(sql`(current_timestamp)`),
});

// Leads
export const leads = sqliteTable("leads", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  event: text("event"),
  eventDate: text("event_date"),
  budget: real("budget").default(0),
  status: text("status").notNull().default("new"),
  source: text("source"),
  notes: text("notes"),
  lastContact: text("last_contact"),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").default(sql`(current_timestamp)`),
});

// Contracts
export const contracts = sqliteTable("contracts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  eventId: text("event_id"),
  template: text("template"),
  content: text("content"),
  status: text("status").notNull().default("draft"),
  value: real("value").default(0),
  signedAt: text("signed_at"),
  signedIp: text("signed_ip"),
  signatureData: text("signature_data"),
  signToken: text("sign_token"),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
});

// Invoices
export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  eventId: text("event_id"),
  amount: real("amount").notNull().default(0),
  paid: real("paid").notNull().default(0),
  due: real("due").notNull().default(0),
  dueDate: text("due_date"),
  issuedDate: text("issued_date").default(sql`(current_timestamp)`),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  stripePaymentIntent: text("stripe_payment_intent"),
  stripeCheckoutUrl: text("stripe_checkout_url"),
  payToken: text("pay_token"),
});

// Contractors
export const contractors = sqliteTable("contractors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  skills: text("skills"),
  rating: real("rating").default(5.0),
  status: text("status").notNull().default("active"),
  eventsCompleted: integer("events_completed").default(0),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
});

// Song Requests
export const songRequests = sqliteTable("song_requests", {
  id: text("id").primaryKey(),
  eventId: text("event_id"),
  title: text("title").notNull(),
  artist: text("artist"),
  requestedBy: text("requested_by"),
  dedication: text("dedication"),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
});

// Messages
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  contact: text("contact").notNull(),
  channel: text("channel").notNull().default("sms"),
  content: text("content").notNull(),
  direction: text("direction").notNull().default("inbound"),
  eventId: text("event_id"),
  read: integer("read", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
});

// Packages
export const packages = sqliteTable("packages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  duration: text("duration"),
  price: real("price").notNull().default(0),
  includes: text("includes"),
  addons: text("addons"),
  popular: integer("popular", { mode: "boolean" }).default(false),
  active: integer("active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
});

// Workflows
export const workflows = sqliteTable("workflows", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  trigger: text("trigger").notNull(),
  actions: text("actions"),
  status: text("status").notNull().default("active"),
  runs: integer("runs").default(0),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
});

// Appointments
export const appointments = sqliteTable("appointments", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  client: text("client").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  duration: text("duration"),
  type: text("type"),
  status: text("status").notNull().default("upcoming"),
  meetingLink: text("meeting_link"),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
});

// Notifications
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  read: integer("read", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
});

// Portal access tokens (for magic links)
export const portalTokens = sqliteTable("portal_tokens", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  eventId: text("event_id"),
  clientEmail: text("client_email").notNull(),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone"),
  clientAddress: text("client_address"),
  clientNotes: text("client_notes"),
  socialLinks: text("social_links"), // JSON string
  expiresAt: text("expires_at"),
  usedAt: text("used_at"),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
});
