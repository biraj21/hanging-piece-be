import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";

import { db } from "#src/config/db";
import { env } from "#src/config/env";
import { sendWelcomeEmail } from "#src/helpers/email";

// const redirectURI = new URL("/auth/callback/google", env.SERVER_URL).toString();

export const auth = betterAuth({
  baseURL: env.SERVER_URL,
  basePath: "/auth",

  database: db,

  // see https://www.better-auth.com/docs/reference/options#trustedorigins
  trustedOrigins: env.FRONTEND_ORIGINS,

  // see https://www.better-auth.com/docs/concepts/session-management#cookie-cache
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
      strategy: "jwt", // or "jwt" or "jwe"
    },
  },

  user: {
    additionalFields: {
      chesscomId: {
        type: "string",
        required: false,
      },
      lichessId: {
        type: "string",
        required: false,
      },
    },
  },

  socialProviders: {
    google: {
      // /auth/callback/google
      prompt: "select_account",
      clientId: env.GOOGLE_CLIENT_ID as string,
      clientSecret: env.GOOGLE_CLIENT_SECRET as string,
      // redirectURI,
    },
  },

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const { newSession } = ctx.context;

      if (newSession && ctx.path.startsWith("/callback")) {
        const { user, session } = newSession;

        // Check if user was created in the last few seconds (new signup)
        const userCreatedAt = new Date(user.createdAt);
        const sessionCreatedAt = new Date(session.createdAt);
        const timeDiff = sessionCreatedAt.getTime() - userCreatedAt.getTime();

        // If user was created within 10 seconds of session, it's a new signup
        if (timeDiff < 10_000) {
          console.log("NEW USER SIGNUP:", user.email);
          try {
            await sendWelcomeEmail(user.email, user.name);
          } catch (error) {
            console.error("Failed to send welcome email:", error);
          }
        }
      }
    }),
  },
});
