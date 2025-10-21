import { sql, SQL } from "drizzle-orm";
import { pgTable, uuid, text, timestamp, integer, uniqueIndex, date, jsonb, inet } from "drizzle-orm/pg-core";

 export const userTable = pgTable("user", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(), 
    email: text("email").notNull(),
    password: text("password").notNull(),
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
   examDate: date("exam_date"),
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
   examId: uuid("exam_id").notNull().references(() => examTable.id),
   title: text("title").notNull(),
   reminderDate: timestamp("reminder_date", { withTimezone: true }).notNull(),
   createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
   updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const shareLinkTable = pgTable("share_link", {
   id: uuid("id").primaryKey().defaultRandom(),
   userId: uuid("user_id").notNull().references(() => userTable.id),
   token: text("token").notNull(),
   expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
   contact: text("contact").notNull(),
   createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
   usedAt: timestamp("used_at", { withTimezone: true }),
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
   event: text("event").notNull(),
   emailInput: text("email_input"),
   ipAddress: inet("ip_address"),
   userAgent: text("user_agent"),
   createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

