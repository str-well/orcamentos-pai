import { createServer } from 'http';
import { registerRoutes } from '../server/routes';
import express from 'express';
import session from 'express-session';
import { storage } from '../server/storage';

const app = express();

// Configuração do middleware de sessão
app.use(
  session({
    store: storage.sessionStore,
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 // 24 horas
    }
  })
);

app.use(express.json());

// Registra as rotas da API
registerRoutes(app);

export default async function handler(req, res) {
  return new Promise((resolve, reject) => {
    const server = createServer(app);
    app(req, res, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
} 