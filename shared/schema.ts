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
  date: text("date").notNull(),
  services: json("services").$type<Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>>().default([]),
  materials: json("materials").$type<Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>>().default([]),
  laborCost: text("labor_cost").notNull(),
  totalCost: text("total_cost").notNull(),
  status: text("status").notNull().default('pending'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const budgetItemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  quantity: z.number().min(0, "Quantidade deve ser maior ou igual a 0"),
  unitPrice: z.number().min(0, "Preço deve ser maior ou igual a 0"),
  total: z.number().optional()
});

type BudgetItemArray = Array<{
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}>;

export const insertBudgetSchema = z.object({
  clientName: z.string().min(1, "Nome do cliente é obrigatório"),
  clientAddress: z.string().min(1, "Endereço é obrigatório"),
  clientCity: z.string().min(1, "Cidade é obrigatória"),
  clientContact: z.string().min(1, "Contato é obrigatório"),
  workLocation: z.string().min(1, "Local da obra é obrigatório"),
  serviceType: z.string().min(1, "Tipo de serviço é obrigatório"),
  date: z.string(),
  services: z.array(budgetItemSchema),
  materials: z.array(budgetItemSchema),
  laborCost: z.string(),
  totalCost: z.string()
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export interface User {
  id: number;
  username: string;
  password: string;
  // ... outros campos
}
export type Budget = {
  id: number;
  userId: number;
  clientName: string;
  clientAddress: string;
  clientCity: string;
  clientContact: string;
  workLocation: string;
  serviceType: string;
  date: string;
  services: BudgetItemArray;
  materials: BudgetItemArray;
  laborCost: string;
  totalCost: string;
  status: string;
  createdAt: Date;
};
export type InsertBudget = z.infer<typeof insertBudgetSchema>;