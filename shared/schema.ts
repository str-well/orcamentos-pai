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
  user_id: text("user_id").notNull(),
  client_name: text("client_name").notNull(),
  client_address: text("client_address").notNull(),
  client_city: text("client_city").notNull(),
  client_contact: text("client_contact").notNull(),
  work_location: text("work_location").notNull(),
  service_type: text("service_type").notNull(),
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
  labor_cost: text("labor_cost").notNull(),
  labor_cost_with_materials: text("labor_cost_with_materials"),
  total_cost: text("total_cost").notNull(),
  status: text("status").notNull().default('pending'),
  created_at: timestamp("created_at").notNull().defaultNow(),
  pdf_url: text("pdf_url"),
  pdf_generated_at: timestamp("pdf_generated_at"),
  status_updated_at: timestamp("status_updated_at")
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
  laborCostWithMaterials: z.string().optional(),
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
  user_id: string;
  client_name: string;
  client_address: string;
  client_city: string;
  client_contact: string;
  work_location: string;
  service_type: string;
  date: string;
  services: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  materials: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  labor_cost: string;
  labor_cost_with_materials?: string;
  total_cost: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  pdf_url?: string;
  pdf_generated_at?: string;
  status_updated_at?: string;
};
export type InsertBudget = z.infer<typeof insertBudgetSchema>;