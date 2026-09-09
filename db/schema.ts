import { sqliteTable, text } from "drizzle-orm/sqlite-core";

// Schema source for both queries and drizzle-kit migrations
export const files = sqliteTable("files", {
  // No $default: the caller supplies the id, so $inferInsert makes it required
  id: text("id").primaryKey(),

  // Original filename, shown to the user
  fileName: text("fileName").notNull(),

  // R2 object key, used to fetch the bytes
  filePath: text("filePath").notNull(),

  // MIME type, for the Content-Type response header
  contentType: text("contentType").notNull(),

  // ISO 8601 string; SQLite has no date type. No $default, same reason as id
  createdAt: text("createdAt").notNull(),

  // Same format, no default: the caller sets the lifetime
  expiresAt: text("expiresAt").notNull(),
});
