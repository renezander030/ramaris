import { Client } from 'pg';

export const postgresClient = new Client({connectionString: process.env.DATABASE_URL});
