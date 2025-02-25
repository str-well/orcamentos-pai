import { pgTable, text, serial, integer, decimal, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  clientName: text("client_name").notNull(),
  clientAddress: text("client_address").notNull(),
  clientCity: text("client_city").notNull(),
  clientContact: text("client_contact").notNull(),
  workLocation: text("work_location").notNull(),
  serviceType: text("service_type").notNull(),
  date: timestamp("date").notNull(),
  services: json("services").$type<Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>>(),
  materials: json("materials").$type<Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>>(),
  laborCost: text("labor_cost").notNull(),
  totalCost: text("total_cost").notNull(),
  status: text("status").notNull().default('pending'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
  userId: true,
}).extend({
  laborCost: z.coerce.string(),
  totalCost: z.coerce.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;