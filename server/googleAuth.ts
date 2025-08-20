import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import dotenv from "dotenv";
import { storage } from "./storage.js";

dotenv.config();

export function initializeGoogleAuth() {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  
  // Use production callback URL if provided, otherwise fallback to environment or default
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://hireninja.site/oauth/google/callback'
      : `${baseUrl}/auth/google/callback`);

  if (!clientID || !clientSecret) {
    console.warn("Google OAuth is not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        scope: [
          'profile', 
          'email',
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events',
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/gmail.compose',
          'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
          'https://www.googleapis.com/auth/gmail.send'
        ]
      },
      async (accessToken: string, refreshToken: string, profile: Profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || profile.name?.givenName || "Google User";

          if (!email) {
            return done(new Error("Google profile did not return an email"));
          }

          let user = await storage.getUserByEmail(email);
          if (!user) {
            // Create a user with a random password placeholder
            const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
            user = await storage.createUser({ name, email, password: randomPassword });
          }

          return done(null, { id: user.id, name: user.name, email: user.email });
        } catch (err) {
          return done(err as Error);
        }
      },
    ),
  );

  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((obj: any, done) => {
    done(null, obj);
  });
}


