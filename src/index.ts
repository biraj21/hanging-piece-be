import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";

import { auth } from "#src/config/auth";
import { env } from "#src/config/env";
import chesscomRouter from "#src/routes/chess-com";
import explainRouter from "#src/routes/explain";
import userRouter from "#src/routes/user";
import { printRoutes } from "./utils/express.js";
import { getPm2Info } from "./utils/index.js";

const app = express();

// Trust Cloudflare proxy (1 hop)
app.set("trust proxy", 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-8",
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  // Disable validations since we're using Cloudflare's CF-Connecting-IP
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
  },
  // Use Cloudflare's CF-Connecting-IP header (can't be spoofed when behind Cloudflare)
  keyGenerator: (req) => {
    let cfConnectingIp = req.headers["cf-connecting-ip"];
    if (Array.isArray(cfConnectingIp)) {
      cfConnectingIp = cfConnectingIp[0];
    }

    const ip = cfConnectingIp || req.ip || "unknown";
    return ipKeyGenerator(ip);
  },
  handler: (req, res) => {
    const attackerIp = req.headers["cf-connecting-ip"] || req.ip;

    console.error(
      JSON.stringify({
        event: "RATE_LIMIT_EXCEEDED",
        ip: attackerIp,
        country: req.headers["cf-ipcountry"],
        ray: req.headers["cf-ray"],
        method: req.method,
        url: req.originalUrl,
        userAgent: req.headers["user-agent"],
        timestamp: new Date().toISOString(),
      }),
    );

    res.status(429).json({
      error: "Too many requests, please try again later.",
    });
  },
});

// Apply the rate limiting middleware to all requests.
app.use(limiter);

// Configure CORS middleware
app.use(
  cors({
    origin: env.FRONTEND_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // allow credentials like cookies, authorization headers, etc.
  }),
);

app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const ip = req.headers["cf-connecting-ip"] || req.ip;

    console.log(
      JSON.stringify({
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration,
        ip,
      }),
    );
  });

  next();
});

app.all("/auth/*splat", toNodeHandler(auth));

// Mount express json middleware after Better Auth handler
// or only apply it to routes that don't interact with Better Auth
app.use(express.json());

app.use("/chesscom", chesscomRouter);
app.use(explainRouter);
app.use(userRouter);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

async function init() {
  app.listen(env.PORT, () => {
    const { pm2Instance, isLeader } = getPm2Info();

    console.log(`Server is running on port ${env.PORT}`);
    if (pm2Instance === null) {
      console.log(
        `[PM2] Leader: true — not running under PM2 (single process)`,
      );
    } else {
      console.log(
        `[PM2] Leader: ${isLeader} (NODE_APP_INSTANCE=${pm2Instance})`,
      );
    }

    printRoutes(app);
  });
}

init();
