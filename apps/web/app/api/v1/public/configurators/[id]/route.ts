import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { getPublicConfigurator, getAdminConfigurator } from '@forma/services';

const CORS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Preview mode: return latest draft for authenticated admins
  if (req.nextUrl.searchParams.get('preview') === '1') {
    const { session } = await getSession();
    if (!session?.activeWorkspaceId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: CORS });
    }
    const admin = await getAdminConfigurator({ db, workspaceId: session.activeWorkspaceId }, id);
    if (!admin?.latestVersion) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: CORS });
    }
    return NextResponse.json({
      id: admin.id,
      version: admin.latestVersion.id,
      schema: admin.latestVersion.schema,
      branding: { primary: null, logoUrl: null, font: null },
      allowedHosts: [],
      isPreview: true,
    }, { headers: CORS });
  }

  const data = await getPublicConfigurator(db, id);
  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: CORS });
  }
  return NextResponse.json(data, { headers: CORS });
}
