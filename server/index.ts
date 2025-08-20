// server/index.ts
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import passport from 'passport';
import { initializeGoogleAuth } from './googleAuth.js';
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session and Passport for OAuth
const sessionSecret = process.env.SESSION_SECRET || 'dev-session-secret';
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
initializeGoogleAuth();

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      console.log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./vite.js");
    await setupVite(app, server);
  } else {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    // This path MUST have '../public'
    app.use(express.static(path.resolve(__dirname, '../public')));
    app.get(/^(?!\/api).*/, (req, res) => {
      res.sendFile(path.resolve(__dirname, '../public', 'index.html'));
    });
  }

  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.HOST || "0.0.0.0";
  const listenOptions: any = { port, host };
  // reusePort is not supported on Windows; enable only on non-Windows platforms
  if (process.platform !== 'win32') {
    listenOptions.reusePort = true;
  }
  server.listen(listenOptions, () => {
    console.log(`serving on port ${port}`);
  });
})();
