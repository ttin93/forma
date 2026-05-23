import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

export function createDb(connectionString: string) {
  // Supabase Transaction Mode pooler requires prepare:false
  // Detect by presence of "pgbouncer=true" or port 6543 in URL
  const isPgBouncer =
    connectionString.includes('pgbouncer=true') ||
    connectionString.includes(':6543');

  const client = postgres(connectionString, {
    max: 1,          // safe for serverless — one connection per Lambda
    ...(isPgBouncer && { prepare: false }),
  });

  return drizzle(client, { schema });
}

export type DB = ReturnType<typeof createDb>;
export * from './schema';
