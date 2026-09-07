import { sqliteTable, text } from "drizzle-orm/sqlite-core";

// Schema source for both queries and drizzle-kit migrations
export const files = sqliteTable("files", {
  // ID generated here, not by SQLite
  // crypto is a Workers global: no import, no nodejs_compat flag
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),

  // Original filename, shown to the user
  fileName: text("fileName").notNull(),

  // R2 object key, used to fetch the bytes
  filePath: text("filePath").notNull(),

  // MIME type, for the Content-Type response header
  contentType: text("contentType").notNull(),

  // ISO 8601 string; SQLite has no date type
  createdAt: text("createdAt").notNull().$default(() => new Date().toISOString()),

  // Same format, no default: the caller sets the lifetime
  expiresAt: text("expiresAt").notNull(),
});
