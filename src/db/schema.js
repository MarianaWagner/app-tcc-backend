import { sql, SQL } from "drizzle-orm";
import { pgTable, uuid, text, timestamp, integer, uniqueIndex, date, jsonb, inet } from "drizzle-orm/pg-core";

 export const userTable = pgTable("user", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(), 
    email: text("email").notNull(),
    password: text("password").notNull(),
    termAccepted: timestamp("term_accepted", { withTimezone: true }), 
    termVersion: text("term_version"), 
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
 },

 (table) => [
    uniqueIndex("emailUniqueIndex").on(lower(table.email)), 
 ], 
)

 export function lower(email) {
    return sql`lower(${email})`;
}

export const examTable = pgTable("exam", {
   id: uuid("id").primaryKey().defaultRandom(),
   userId: uuid("user_id").notNull().references(() => userTable.id),
   name: text("name").notNull(),
   examDate: date("exam_date").notNull(),
   notes: text("notes"),
   tags: text("tags").array(),
   createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
   updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
   deletedAt: timestamp("deleted_at", { withTimezone: true }),
})

export const examMediaTable = pgTable("exam_media", {
   id: uuid("id").primaryKey().defaultRandom(),
   examId: uuid("exam_id").notNull().references(() => examTable.id),
   mediaType: text("media_type").notNull(),
   filePath: text("file_path").notNull(),
   metadata: jsonb("metadata"),
   createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

export const reminderTable = pgTable("reminder", {
   id: uuid("id").primaryKey().defaultRandom(),
   userId: uuid("user_id").notNull().references(() => userTable.id),
   examId: uuid("exam_id").references(() => examTable.id), // Opcional agora
   title: text("title").notNull(),
   reminderDate: timestamp("reminder_date", { withTimezone: true }).notNull(),
   requiresFasting: integer("requires_fasting").default(0), 
   fastingDuration: integer("fasting_duration"), 
   fastingAlertTime: timestamp("fasting_alert_time", { withTimezone: true }), 
   notes: text("notes"),
   createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
   updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const shareLinkTable = pgTable("share_link", {
   id: uuid("id").primaryKey().defaultRandom(),
   userId: uuid("user_id").notNull().references(() => userTable.id),
   code: text("code").notNull().unique(), 
   email: text("email").notNull(), 
   expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
   maxUses: integer("max_uses").notNull().default(1), 
   timesUsed: integer("times_used").notNull().default(0), 
   revokedAt: timestamp("revoked_at", { withTimezone: true }), 
   // Campos para OTP
   otpHash: text("otp_hash"), 
   otpExpiresAt: timestamp("otp_expires_at", { withTimezone: true }), 
   otpAttempts: integer("otp_attempts").notNull().default(0), 
   otpSentAt: timestamp("otp_sent_at", { withTimezone: true }), 
   otpSentCount: integer("otp_sent_count").notNull().default(0), 
   createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
   updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const sharedExamTable = pgTable("shared_exam", {
   id: uuid("id").primaryKey().defaultRandom(),
   shareId: uuid("share_id").notNull().references(() => shareLinkTable.id),
   examId: uuid("exam_id").notNull().references(() => examTable.id),
   createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

export const shareAccessLogTable = pgTable("share_access_log", {
   id: uuid("id").primaryKey().defaultRandom(),
   shareId: uuid("share_id").notNull().references(() => shareLinkTable.id),
   event: text("event").notNull(), // SHARE_CREATED, OTP_SENT, OTP_VERIFIED, FILE_DOWNLOADED, SHARE_REVOKED, etc.
   emailInput: text("email_input"),
   ipAddress: inet("ip_address"),
   userAgent: text("user_agent"),
   createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

