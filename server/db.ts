import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

const connectionString = process.env.POSTGRES_URL!;

export const client = postgres(connectionString, { ssl: 'require' });
export const db = drizzle(client);