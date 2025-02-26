import { createServer } from 'http';
import { registerRoutes } from '../server/routes';
import express from 'express';
import session from 'express-session';
import { storage } from '../server/storage';
import cors from 'cors';
import { supabase } from '../server/supabase';

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

app.put('/api/budgets/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Verifique se o status é válido
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  try {
    const { data, error } = await supabase
      .from('budgets')
      .update({ status })
      .eq('id', id)
      .single();

    if (error) throw error;

    return res.json(data);
  } catch (error) {
    console.error('Erro ao atualizar status do orçamento:', error);
    return res.status(500).json({ error: 'Erro ao atualizar status do orçamento' });
  }
});

app.get('/api/budgets/:id/pdf', async (req, res) => {
  const { id } = req.params;

  try {
    const { data: budget, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !budget) {
      return res.status(404).json({ error: 'Orçamento não encontrado' });
    }

    // Lógica para gerar o PDF
    const pdfBuffer = await generatePDF(budget); // Implemente a função de geração de PDF

    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return res.status(500).json({ error: 'Erro ao gerar PDF' });
  }
});

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