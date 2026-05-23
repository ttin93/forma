import { type NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { apiKeys } from '@forma/db';

function generateKey() {
  const secret = randomBytes(32).toString('hex');
  const raw = `fk_live_${secret}`;
  const hash = createHash('sha256').update(raw).digest('hex');
  const prefix = raw.slice(0, 16) + '...';
  return { raw, hash, prefix };
}

export async function GET() {
  const { session } = await getSession();
  const workspaceId = session?.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db.select({
    id: apiKeys.id,
    name: apiKeys.name,
    prefix: apiKeys.prefix,
    scopes: apiKeys.scopes,
    lastUsedAt: apiKeys.lastUsedAt,
    createdAt: apiKeys.createdAt,
  }).from(apiKeys)
    .where(and(eq(apiKeys.workspaceId, workspaceId), sql`${apiKeys.revokedAt} IS NULL`));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { session } = await getSession();
  const workspaceId = session?.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const { raw, hash, prefix } = generateKey();
  const id = `key_${randomBytes(8).toString('hex')}`;

  await db.insert(apiKeys).values({
    id,
    workspaceId,
    name: String(body.name).slice(0, 64),
    prefix,
    hash,
    scopes: Array.isArray(body.scopes) ? body.scopes : ['leads:read'],
  });

  // Return the raw key only once
  return NextResponse.json({ id, name: body.name, prefix, key: raw }, { status: 201 });
}
