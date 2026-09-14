import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import { env } from "#src/config/env";
import { getPm2Info } from "#src/utils/index";

const dir = path.dirname(env.SQLITE_DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

export const db = new Database(env.SQLITE_DB_PATH);

// Production SQLite configuration for concurrent access
// WAL mode enables better concurrency for multi-process setup (PM2)
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL"); // Safer than FULL but faster than OFF
db.pragma("busy_timeout = 5000"); // 5 second timeout for locked database
db.pragma("foreign_keys = ON"); // Enable foreign key constraints

// Run initialization SQL only on the PM2 leader (instance 0) or when not running under PM2.
const { pm2Instance, isLeader } = getPm2Info();

if (isLeader) {
  // Run initialization SQL
  console.log(`📀⌛️ Running initialization SQL from ${env.INIT_SQL_PATH}`);
  const start = Date.now();
  const initSql = fs.readFileSync(env.INIT_SQL_PATH, "utf-8");
  db.exec(initSql);
  const end = Date.now();
  console.log(`📀✅ SQLite ready at ${env.SQLITE_DB_PATH} in ${end - start}ms`);
} else {
  console.log(
    `📀⏭️ Skipping initialization SQL on non-leader instance (NODE_APP_INSTANCE=${pm2Instance})`,
  );
}
