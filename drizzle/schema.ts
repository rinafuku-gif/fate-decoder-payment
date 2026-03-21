import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const locations = sqliteTable("locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  refId: text("ref_id").notNull().unique(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  bankInfo: text("bank_info"),
  kickbackRate: integer("kickback_rate").notNull().default(50),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const diagnoses = sqliteTable("diagnoses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  refId: text("ref_id").notNull().default("direct"),
  mode: text("mode").notNull(), // 'short' | 'full' | 'compatibility'
  topic: text("topic"), // 'general' | 'work' | 'love' | 'social' | 'money'
  userName: text("user_name"),
  birthDate: text("birth_date"),
  paidAmount: integer("paid_amount").notNull().default(0),
  stripeSessionId: text("stripe_session_id"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const kickbackPayments = sqliteTable("kickback_payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  locationRef: text("location_ref").notNull(),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  diagnosisCount: integer("diagnosis_count").notNull().default(0),
  unitAmount: integer("unit_amount").notNull().default(50),
  amount: integer("amount").notNull().default(0),
  status: text("status").notNull().default("pending"), // 'pending' | 'paid'
  paidAt: text("paid_at"),
  statementHtml: text("statement_html"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});
