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
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getBudgetsByUserId(userId: number): Promise<Budget[]> {
    return await db.select().from(budgets).where(eq(budgets.userId, userId));
  }

  async getBudget(id: number): Promise<Budget | undefined> {
    const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
    return budget;
  }

  async createBudget(budget: InsertBudget & { userId: number }): Promise<Budget> {
    const [newBudget] = await db.insert(budgets).values({
      ...budget,
      date: new Date(budget.date),
      createdAt: new Date(),
    }).returning();
    return newBudget;
  }

  async updateBudgetStatus(
    id: number,
    status: 'pending' | 'approved' | 'rejected'
  ): Promise<Budget | undefined> {
    const [budget] = await db
      .update(budgets)
      .set({ status })
      .where(eq(budgets.id, id))
      .returning();
    return budget;
  }
}

export const storage = new DatabaseStorage();