import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth.js";
import { storage } from "./storage.js";
import { insertBudgetSchema } from "../shared/schema.js";
import { z } from "zod";
import { generateBudgetPDF } from "./pdf-generator.js";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Budget routes
  app.get("/api/budgets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const budgets = await storage.getBudgetsByUserId(String(req.user.id));
    res.json(budgets);
  });

  app.post("/api/budgets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const data = insertBudgetSchema.parse(req.body);
      const budget = await storage.createBudget({
        ...data,
        user_id: String(req.user.id),
      });
      res.status(201).json(budget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json(error.issues);
      } else {
        res.sendStatus(500);
      }
    }
  });

  app.get("/api/budgets/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const budget = await storage.getBudget(parseInt(req.params.id));
    if (!budget || budget.user_id !== String(req.user.id)) {
      return res.status(404).json({ error: 'Orçamento não encontrado' });
    }
    res.json(budget);
  });

  app.get("/api/budgets/:id/pdf", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const budget = await storage.getBudget(parseInt(req.params.id));
      if (!budget || budget.user_id !== String(req.user.id)) {
        return res.status(404).json({ error: 'Orçamento não encontrado' });
      }

      const pdfBuffer = await generateBudgetPDF(budget);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=orcamento-${budget.id}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ message: 'Error generating PDF' });
    }
  });

  app.put("/api/budgets/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const status = z.enum(['pending', 'approved', 'rejected']).parse(req.body.status);
    const budget = await storage.updateBudgetStatus(parseInt(req.params.id), status);
    if (!budget || budget.user_id !== String(req.user.id)) {
      return res.status(404).json({ error: 'Orçamento não encontrado' });
    }
    res.json(budget);
  });

  const httpServer = createServer(app);
  return httpServer;
}