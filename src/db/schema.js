import { sql, SQL } from "drizzle-orm";
import { pgTable, uuid,  text, timestamp, integer, uniqueIndex} from "drizzle-orm/pg-core";

 export const userTable = pgTable("user", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(), 
    email: text("email").notNull(),
    password: text("password").notNull(),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updateAt").defaultNow(),
 },

 (table) => [
    uniqueIndex("emailUniqueIndex").on(lower(table.email)), 
 ], 
)

 export function lower(email) {
    return sql`lower(${email})`;
}
