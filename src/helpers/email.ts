import nodemailer from "nodemailer";

import { env } from "#src/config/env";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "biraj@hangingpiece.com",
    pass: env.GOOGLE_APP_PASSWORD,
  },
});

export async function sendWelcomeEmail(userEmail: string, userName: string, isRetry = false) {
  try {
    if (isRetry) {
      console.log("Retrying to send welcome email to:", userEmail);
    }

    await transporter.sendMail({
      from: '"Biraj" <biraj@hangingpiece.com>',
      to: userEmail,
      subject: "Welcome to Hanging Piece",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <p>Hi ${userName},</p>
          
          <p>Welcome to Hanging Piece.</p>
          
          <p>Most chess tools show an eval drop and move on. This one explains <em>WHY</em> it happened — in plain language you can actually use next game.</p>
          
          <p>Hanging Piece is focused on one thing: helping you understand your mistakes so you don't repeat them.</p>
          
          <p>You're early. If you spot something dumb, missing, or worth fixing, reply here :)</p>
          
          <p>Glad you joined!</p>
          
          <p>Biraj<br>
          Founder and OG Piece Hanger,<br>
          Hanging Piece</p>
        </div>
      `,
      text: `Hi ${userName},

Welcome to Hanging Piece.

Most chess tools show an eval drop and move on. This one explains why it happened — in plain language you can actually use next game.

Hanging Piece is focused on one thing: helping you understand your mistakes so you don't repeat them.

You're early. If you spot something dumb, missing, or worth fixing, reply here :)

Glad you joined!

Biraj
Founder and OG Piece Hanger,
Hanging Piece`,
    });
    console.log("Welcome email sent to:", userEmail);
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    if (!isRetry) {
      setTimeout(sendWelcomeEmail, 5000, userEmail, userName, true);
    }
  }
}
