import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";

import { auth } from "#src/config/auth";
import { env } from "#src/config/env";
import { printRoutes } from "./utils/express.js";

const app = express();

// Configure CORS middleware
app.use(
  cors({
    origin: env.FRONTEND_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE"], // allowed HTTP methods
    credentials: true, // allow credentials (cookies, authorization headers, etc.)
  })
);

app.all("/api/auth/*splat", toNodeHandler(auth));

// Mount express json middleware after Better Auth handler
// or only apply it to routes that don't interact with Better Auth
app.use(express.json());

async function init() {
  app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);

    // Print all registered routes
    printRoutes(app);
  });
}

init();
