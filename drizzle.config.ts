import { defineConfig } from "drizzle-kit";

const drizzleConfig = defineConfig({
  // Where generated .sql migration files are written
  out: "./drizzle/migrations",

  // Source of truth: your table definitions, diffed to produce migrations
  schema: "./db/schema.ts",

  // SQL flavor used when generating SQL — D1 is SQLite under the hood
  dialect: "sqlite",

  // No driver or credentials: this config only generates SQL.
  // `wrangler d1 migrations apply` connects and applies it, see the db:migrate-* scripts
});

export default drizzleConfig;
