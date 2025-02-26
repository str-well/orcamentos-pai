import { createServer } from 'http';
import { registerRoutes } from '../server/routes';
import express from 'express';
import session from 'express-session';
import { storage } from '../server/storage';
import cors from 'cors';

const app = express();

// Configuração do CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:5173', // porta padrão do Vite
  credentials: true
}));

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
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24 // 24 horas
    }
  })
);

app.use(express.json());

// Registra as rotas da API
await registerRoutes(app);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  return new Promise((resolve, reject) => {
    app(req, res, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
} 