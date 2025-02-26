import { Router } from 'express';
import { storage } from '../storage';
import { auth } from '../auth/auth';
import { Request, Response } from 'express';

export async function registerRoutes(app: Router) {
  // Middleware para rotas da API
  app.use('/api/*', (req, res, next) => {
    res.type('application/json');
    next();
  });

  // Rotas de autenticação
  app.post('/api/auth/login', auth.login);
  app.post('/api/auth/logout', auth.logout);
  app.get('/api/auth/user', auth.getUser);

  // Rotas de orçamentos
  app.get('/api/budgets', async (req: Request, res: Response) => {
    try {
      const budgets = await storage.getBudget();
      res.json(budgets);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar orçamentos' });
    }
  });
  app.post('/api/budgets', auth.requireAuth, storage.createBudget);
  app.put('/api/budgets/:id/status', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const budget = await storage.updateBudgetStatus(Number(id), status);
      res.json(budget);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar status' });
    }
  });
  app.get('/api/budgets/:id/pdf', auth.requireAuth, storage.generateBudgetPDF);

  return app;
} 