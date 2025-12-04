import { betterAuth } from "better-auth";

import { db } from "#src/config/db";
import { env } from "#src/config/env";

// const redirectURI = new URL("/auth/callback/google", env.SERVER_URL).toString();

export const auth = betterAuth({
  baseURL: env.SERVER_URL,
  basePath: "/auth",

  database: db,

  // see https://www.better-auth.com/docs/reference/options#trustedorigins
  trustedOrigins: env.FRONTEND_ORIGINS,

  socialProviders: {
    google: {
      // /auth/callback/google
      prompt: "select_account",
      clientId: env.GOOGLE_CLIENT_ID as string,
      clientSecret: env.GOOGLE_CLIENT_SECRET as string,
      // redirectURI,
    },
  },
});
