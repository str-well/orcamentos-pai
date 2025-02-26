import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "../shared/schema.js";

// Use POSTGRES_URL em vez de DATABASE_URL
const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Database connection string not found');
}

export const client = postgres(connectionString, { 
  ssl: 'require',
  max: 1 // Limite de conexões para evitar problemas com o plano gratuito
});

export const db = drizzle(client);