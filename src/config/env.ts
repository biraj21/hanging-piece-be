import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config({ override: true });

const envSchema = z.object({
  PORT: z.string().transform((val) => Number(val)),

  SERVER_URL: z.url(),
  FRONTEND_ORIGINS: z.array(z.url()).default(["http://localhost:5173", "https://www.hangingpiece.com"]),

  GEMINI_API_KEY: z.string().min(1),

  SQLITE_DB_PATH: z.string().min(1).default("./db/hangingpiece-db.sqlite"),
  INIT_SQL_PATH: z.string().min(1).default("init.sql"),

  AUTH_SECRET: z.string().min(1),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
});

export const env = envSchema.parse(process.env);
