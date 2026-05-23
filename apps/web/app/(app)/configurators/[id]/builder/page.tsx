import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { getAdminConfigurator } from '@forma/services';
import { BuilderClient } from './BuilderClient';
import type { ConfiguratorSchema } from '@forma/types';

const BLANK_SCHEMA = (id: string, name: string): ConfiguratorSchema => ({
  version: 1,
  id,
  name,
  currency: 'EUR',
  locale: 'sl-SI',
  steps: [
    { id: 'step-1', label: 'Configuration', fields: [] },
    { id: 'step-2', label: 'Contact', fields: [
      { id: 'name', type: 'text', label: 'Full name', required: true },
      { id: 'email', type: 'email', label: 'Email', required: true },
      { id: 'phone', type: 'phone', label: 'Phone' },
    ]},
  ],
  pricing: [],
  scoring: [],
});

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { session } = await getSession();
  if (!session) redirect('/sign-in');
  const workspaceId = session.activeWorkspaceId;
  if (!workspaceId) redirect('/onboarding');

  const data = await getAdminConfigurator({ db, workspaceId }, id);
  if (!data) redirect('/configurators');

  const schema = data.latestVersion?.schema ?? BLANK_SCHEMA(id, data.name);

  return (
    <BuilderClient
      configuratorId={id}
      configuratorName={data.name}
      configuratorStatus={data.status}
      initialSchema={schema}
    />
  );
}
