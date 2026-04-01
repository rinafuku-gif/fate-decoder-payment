import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const locations = sqliteTable("locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  refId: text("ref_id").notNull().unique(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  address: text("address"),
  postalCode: text("postal_code"),
  prefecture: text("prefecture"),
  city: text("city"),
  streetAddress: text("street_address"),
  bankInfo: text("bank_info"),
  bankName: text("bank_name"),
  branchName: text("branch_name"),
  accountType: text("account_type"),
  accountNumber: text("account_number"),
  accountHolder: text("account_holder"),
  kickbackRate: integer("kickback_rate").notNull().default(50),
  carriedOverAmount: integer("carried_over_amount").notNull().default(0),
  status: text("status").notNull().default("pending"), // 'pending' | 'approved' | 'rejected'
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
  stripeSessionId: text("stripe_session_id").unique(),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  deviceType: text("device_type"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const paymentTokens = sqliteTable("payment_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  token: text("token").notNull().unique(),
  sessionId: text("session_id").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  used: integer("used", { mode: "boolean" }).notNull().default(false),
});

export const referralFees = sqliteTable("referral_fees", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  placeId: text("place_id").notNull(), // utm_source
  stripeSessionId: text("stripe_session_id").notNull(),
  mode: text("mode").notNull(), // 'full' | 'compatibility'
  amount: integer("amount").notNull(), // 決済金額（円）
  fee: integer("fee").notNull(), // フィー（円）
  status: text("status").notNull().default("unpaid"), // 'unpaid' | 'paid'
  paidAt: text("paid_at"),
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
