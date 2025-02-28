import pkg from 'pg';
const { Pool } = pkg;
import { users, budgets, type User, type InsertUser, type Budget, type InsertBudget } from "../shared/schema.js";
import { db } from "./db.js";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { sql } from 'drizzle-orm';

const PostgresSessionStore = connectPg(session);

// Crie um pool do PostgreSQL
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL ?? process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 1 // Limite de conexões para evitar problemas com o plano gratuito
});

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getBudgetsByUserId(user_id: string): Promise<Budget[]>;
  getBudget(id: number): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget & { user_id: string }): Promise<Budget>;
  updateBudgetStatus(id: number, status: 'pending' | 'approved' | 'rejected'): Promise<Budget | undefined>;
  sessionStore: session.Store;
  generateBudgetPDF(id: number): Promise<Buffer>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'user_sessions',
      pruneSessionInterval: 60
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error('Failed to get user');
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw new Error('Failed to get user by username');
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async getBudgetsByUserId(user_id: string): Promise<Budget[]> {
    try {
      const results = await db.select().from(budgets).where(eq(budgets.user_id, user_id));
      
      // Mapear os resultados do banco para o formato da interface Budget
      return results.map(budget => ({
        id: budget.id,
        user_id: budget.user_id,
        client_name: budget.client_name,
        client_address: budget.client_address,
        client_city: budget.client_city,
        client_contact: budget.client_contact,
        work_location: budget.work_location,
        service_type: budget.service_type,
        date: budget.date,
        services: budget.services || [],
        materials: budget.materials || [],
        labor_cost: budget.labor_cost,
        total_cost: budget.total_cost,
        status: budget.status as 'pending' | 'approved' | 'rejected',
        created_at: budget.created_at.toISOString(),
        pdf_url: budget.pdf_url || undefined,
        pdf_generated_at: budget.pdf_generated_at?.toISOString(),
        status_updated_at: budget.status_updated_at?.toISOString()
      }));
    } catch (error) {
      console.error('Error getting budgets:', error);
      throw new Error('Failed to get budgets');
    }
  }

  async getBudget(id: number): Promise<Budget | undefined> {
    try {
      const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
      
      if (!budget) return undefined;

      // Mapear o resultado do banco para o formato da interface Budget
      return {
        id: budget.id,
        user_id: budget.user_id,
        client_name: budget.client_name,
        client_address: budget.client_address,
        client_city: budget.client_city,
        client_contact: budget.client_contact,
        work_location: budget.work_location,
        service_type: budget.service_type,
        date: budget.date,
        services: budget.services || [],
        materials: budget.materials || [],
        labor_cost: budget.labor_cost,
        total_cost: budget.total_cost,
        status: budget.status as 'pending' | 'approved' | 'rejected',
        created_at: budget.created_at.toISOString(),
        pdf_url: budget.pdf_url || undefined,
        pdf_generated_at: budget.pdf_generated_at?.toISOString(),
        status_updated_at: budget.status_updated_at?.toISOString()
      };
    } catch (error) {
      console.error('Error getting budget:', error);
      throw new Error('Failed to get budget');
    }
  }

  async createBudget(budget: InsertBudget & { user_id: string }): Promise<Budget> {
    try {
      const [newBudget] = await db
        .insert(budgets)
        .values({
          user_id: budget.user_id,
          client_name: budget.clientName,
          client_address: budget.clientAddress,
          client_city: budget.clientCity,
          client_contact: budget.clientContact,
          work_location: budget.workLocation,
          service_type: budget.serviceType,
          date: budget.date,
          services: sql`${JSON.stringify(budget.services || [])}::jsonb`,
          materials: sql`${JSON.stringify(budget.materials || [])}::jsonb`,
          labor_cost: budget.laborCost,
          total_cost: budget.totalCost,
          status: 'pending' as const
        })
        .returning();

      // Garantir que services e materials nunca são null
      return {
        id: newBudget.id,
        user_id: newBudget.user_id,
        client_name: newBudget.client_name,
        client_address: newBudget.client_address,
        client_city: newBudget.client_city,
        client_contact: newBudget.client_contact,
        work_location: newBudget.work_location,
        service_type: newBudget.service_type,
        date: newBudget.date,
        services: newBudget.services || [],
        materials: newBudget.materials || [],
        labor_cost: newBudget.labor_cost,
        total_cost: newBudget.total_cost,
        status: newBudget.status as 'pending' | 'approved' | 'rejected',
        created_at: newBudget.created_at.toISOString(),
        pdf_url: newBudget.pdf_url || undefined,
        pdf_generated_at: newBudget.pdf_generated_at?.toISOString(),
        status_updated_at: newBudget.status_updated_at?.toISOString()
      };
    } catch (error) {
      console.error('Error creating budget:', error);
      throw new Error('Failed to create budget');
    }
  }

  async updateBudgetStatus(
    id: number,
    status: 'pending' | 'approved' | 'rejected'
  ): Promise<Budget | undefined> {
    try {
      const [budget] = await db
        .update(budgets)
        .set({ status: status as 'pending' | 'approved' | 'rejected' })
        .where(eq(budgets.id, id))
        .returning();
      
      if (!budget) return undefined;

      // Garantir que services e materials nunca são null
      return {
        id: budget.id,
        user_id: budget.user_id,
        client_name: budget.client_name,
        client_address: budget.client_address,
        client_city: budget.client_city,
        client_contact: budget.client_contact,
        work_location: budget.work_location,
        service_type: budget.service_type,
        date: budget.date,
        services: budget.services || [],
        materials: budget.materials || [],
        labor_cost: budget.labor_cost,
        total_cost: budget.total_cost,
        status: budget.status as 'pending' | 'approved' | 'rejected',
        created_at: budget.created_at.toISOString(),
        pdf_url: budget.pdf_url || undefined,
        pdf_generated_at: budget.pdf_generated_at?.toISOString(),
        status_updated_at: budget.status_updated_at?.toISOString()
      };
    } catch (error) {
      console.error('Error updating budget status:', error);
      throw new Error('Failed to update budget status');
    }
  }

  async generateBudgetPDF(id: number): Promise<Buffer> {
    try {
      const budget = await this.getBudget(id);
      if (!budget) {
        throw new Error('Budget not found');
      }
      
      // Aqui você implementaria a lógica de geração do PDF
      // Por enquanto, vamos apenas retornar um buffer vazio
      return Buffer.from('');
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }
}

export const storage = new DatabaseStorage();