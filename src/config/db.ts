import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import { env } from "#src/config/env";

const dir = path.dirname(env.SQLITE_DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

export const db = new Database(env.SQLITE_DB_PATH);

// Run initialization SQL
console.log(`📀⌛️ Running initialization SQL from ${env.INIT_SQL_PATH}`);
const start = Date.now();
const initSql = fs.readFileSync(env.INIT_SQL_PATH, "utf-8");
db.exec(initSql);
const end = Date.now();

console.log(`📀✅ SQLite ready at ${env.SQLITE_DB_PATH} in ${end - start}ms`);
