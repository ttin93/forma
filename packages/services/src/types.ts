import type { createDb } from '@forma/db';

export type DB = ReturnType<typeof createDb>;

export interface ServiceCtx {
  db: DB;
  workspaceId: string;
  userId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}
