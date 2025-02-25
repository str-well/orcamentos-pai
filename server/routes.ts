import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertBudgetSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Budget routes
  app.get("/api/budgets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const budgets = await storage.getBudgetsByUserId(req.user.id);
    res.json(budgets);
  });

  app.post("/api/budgets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const data = insertBudgetSchema.parse(req.body);
      const budget = await storage.createBudget({
        ...data,
        userId: req.user.id,
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
    if (!budget || budget.userId !== req.user.id) {
      return res.sendStatus(404);
    }
    res.json(budget);
  });

  app.put("/api/budgets/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const status = z.enum(['pending', 'approved', 'rejected']).parse(req.body.status);
    const budget = await storage.updateBudgetStatus(parseInt(req.params.id), status);
    if (!budget || budget.userId !== req.user.id) {
      return res.sendStatus(404);
    }
    res.json(budget);
  });

  const httpServer = createServer(app);
  return httpServer;
}
