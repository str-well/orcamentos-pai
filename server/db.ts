import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

// Configure o cliente postgres com as configurações locais
const client = postgres(connectionString, { ssl: 'require' });

export const db = drizzle(client, { schema });