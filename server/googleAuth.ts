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
      ? 'https://hireninja.site/auth/google/callback'
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
          // Calendar scopes
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events',
          // Gmail scopes
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/gmail.compose',
          'https://www.googleapis.com/auth/gmail.send',
          // Drive scopes
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file',
          // Contacts scopes
          'https://www.googleapis.com/auth/contacts',
          'https://www.googleapis.com/auth/contacts.readonly',
          // Sheets scopes
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/spreadsheets.readonly',
          // Docs scopes
          'https://www.googleapis.com/auth/documents',
          'https://www.googleapis.com/auth/documents.readonly'
        ]
      },
      async (accessToken: string, refreshToken: string, profile: Profile, done) => {
        try {
          console.log(`🔍 [GOOGLE] OAuth callback received for profile:`, profile.id);
          console.log(`🔑 [GOOGLE] Access token received: ${accessToken ? 'YES' : 'NO'}`);
          console.log(`🔄 [GOOGLE] Refresh token received: ${refreshToken ? 'YES' : 'NO'}`);
          
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || profile.name?.givenName || "Google User";

          if (!email) {
            console.error(`❌ [GOOGLE] No email found in profile for user: ${profile.id}`);
            return done(new Error("Google profile did not return an email"));
          }

          console.log(`📧 [GOOGLE] Processing OAuth for email: ${email}`);

          let user = await storage.getUserByEmail(email);
          if (!user) {
            console.log(`👤 [GOOGLE] Creating new user for email: ${email}`);
            // Create a user with a random password placeholder
            const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
            user = await storage.createUser({ name, email, password: randomPassword });
            console.log(`✅ [GOOGLE] New user created with ID: ${user.id}`);
          } else {
            console.log(`👤 [GOOGLE] Existing user found with ID: ${user.id}`);
          }

          // Create the full scope string from all requested scopes
          const fullScope = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/gmail.compose',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/contacts',
            'https://www.googleapis.com/auth/contacts.readonly',
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/spreadsheets.readonly',
            'https://www.googleapis.com/auth/documents',
            'https://www.googleapis.com/auth/documents.readonly'
          ].join(' ');

          console.log(`📋 [GOOGLE] Full scope string: ${fullScope}`);
          console.log(`🔑 [GOOGLE] Passing tokens to callback for user: ${user.email}`);

          // Pass tokens along with user data for n8n credential creation
          return done(null, { 
            id: user.id, 
            name: user.name, 
            email: user.email,
            accessToken,
            refreshToken,
            scope: fullScope
          });
        } catch (err) {
          console.error(`❌ [GOOGLE] Error in OAuth callback:`, err);
          return done(err as Error);
        }
      },
    ),
  );

  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((obj: any, done) => {
    done(null, obj);
  });
}


