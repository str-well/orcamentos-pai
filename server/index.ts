import express from 'express';
import session from 'express-session';
import { storage } from './storage.js';
import { registerRoutes } from './routes/index.js';
import cors from 'cors';
import dotenv from 'dotenv';
import { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite.js";
import { db } from './db.js';
import { sql } from 'drizzle-orm';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://orcamentos-pai.vercel.app'
    : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    store: storage.sessionStore,
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    // Don't throw the error after sending response
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    const viteServer = await setupVite(app);
    app.use(viteServer.middlewares);
    await registerRoutes(app);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const port = process.env.PORT || 3000;
  const server = app.listen(port, () => {
    log(`Server is running on port ${port}`);
  });

  try {
    // Tenta fazer uma query simples
    const result = await db.execute(sql`SELECT 1`);
    console.log('Conexão com banco de dados estabelecida com sucesso!');
  } catch (error) {
    console.error('Erro ao conectar com banco de dados:', error);
  }
})();
