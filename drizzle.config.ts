// No dotenv import: the drizzle-kit CLI bundles dotenv and reads .env before this file loads
// Point it at another file with DOTENV_CONFIG_PATH=<path> — that replaces .env, it does not add to it

import { defineConfig } from "drizzle-kit";

const drizzleConfig = defineConfig({
  // Where generated .sql migration files are written
  out: "./drizzle/migrations",

  // Source of truth: your table definitions, diffed to produce migrations
  schema: "./db/schema.ts",

  // SQL flavor used when generating SQL — D1 is SQLite under the hood
  dialect: "sqlite",

  // Use Cloudflare's REST API to target the remote D1
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_D1_TOKEN!,

    // `!` = non-null assertion; process.env values are `string | undefined`
  },
});

export default drizzleConfig;
