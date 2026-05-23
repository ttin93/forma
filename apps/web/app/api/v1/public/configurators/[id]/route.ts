import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPublicConfigurator } from '@forma/services';

const CORS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await getPublicConfigurator(db, id);
  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: CORS });
  }
  return NextResponse.json(data, { headers: CORS });
}
