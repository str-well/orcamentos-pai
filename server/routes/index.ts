import { Router } from 'express';
import { storage } from '../storage';
import { auth } from '../auth';

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
  app.get('/api/budgets', auth.requireAuth, storage.getBudgets);
  app.post('/api/budgets', auth.requireAuth, storage.createBudget);
  app.put('/api/budgets/:id/status', auth.requireAuth, storage.updateBudgetStatus);
  app.get('/api/budgets/:id/pdf', auth.requireAuth, storage.generateBudgetPDF);

  return app;
} 