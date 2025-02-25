import { users, budgets, type User, type InsertUser, type Budget, type InsertBudget } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getBudgetsByUserId(userId: number): Promise<Budget[]>;
  getBudget(id: number): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget & { userId: number }): Promise<Budget>;
  updateBudgetStatus(id: number, status: 'pending' | 'approved' | 'rejected'): Promise<Budget | undefined>;
  sessionStore: session.Store;
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

  async getBudgetsByUserId(userId: number): Promise<Budget[]> {
    try {
      return await db.select().from(budgets).where(eq(budgets.userId, userId));
    } catch (error) {
      console.error('Error getting budgets:', error);
      throw new Error('Failed to get budgets');
    }
  }

  async getBudget(id: number): Promise<Budget | undefined> {
    try {
      const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
      return budget;
    } catch (error) {
      console.error('Error getting budget:', error);
      throw new Error('Failed to get budget');
    }
  }

  async createBudget(budget: InsertBudget & { userId: number }): Promise<Budget> {
    try {
      const [newBudget] = await db.insert(budgets).values({
        ...budget,
        date: new Date(budget.date),
        createdAt: new Date(),
        services: budget.services || [],
        materials: budget.materials || []
      }).returning();
      return newBudget;
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
        .set({ status })
        .where(eq(budgets.id, id))
        .returning();
      return budget;
    } catch (error) {
      console.error('Error updating budget status:', error);
      throw new Error('Failed to update budget status');
    }
  }
}

export const storage = new DatabaseStorage();