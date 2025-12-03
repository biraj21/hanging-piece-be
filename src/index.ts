import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";

import { auth } from "#src/config/auth";
import { env } from "#src/config/env";
import { printRoutes } from "./utils/express.js";
import { getPm2Info } from "./utils/index.js";

const app = express();

// Configure CORS middleware
app.use(
  cors({
    origin: env.FRONTEND_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE"], // allowed HTTP methods
    credentials: true, // allow credentials (cookies, authorization headers, etc.)
  })
);

app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      JSON.stringify({
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration,
      })
    );
  });

  next();
});

app.all("/api/auth/*splat", toNodeHandler(auth));

// Mount express json middleware after Better Auth handler
// or only apply it to routes that don't interact with Better Auth
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

async function init() {
  app.listen(env.PORT, () => {
    const { pm2Instance, isLeader } = getPm2Info();

    console.log(`Server is running on port ${env.PORT}`);
    // Explicit PM2 leader log so you can see it in `pm2 logs` output.
    if (pm2Instance === null) {
      console.log(`[PM2] Leader: true — not running under PM2 (single process)`);
    } else {
      console.log(`[PM2] Leader: ${isLeader} (NODE_APP_INSTANCE=${pm2Instance})`);
    }

    // Print all registered routes
    printRoutes(app);
  });
}

init();
