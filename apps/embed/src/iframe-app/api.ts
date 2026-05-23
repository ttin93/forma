import type { ConfiguratorSchema } from '@forma/types';

const API_BASE = 'https://api.forma.studio/v1/public';

export interface ConfiguratorResponse {
  id: string;
  version: string;
  schema: ConfiguratorSchema;
  branding: {
    primary: string | null;
    logoUrl: string | null;
    font: string | null;
  };
  allowedHosts: string[];
}

export interface SubmitPayload {
  configId: string;
  version: string;
  state: Record<string, unknown>;
  meta: {
    host: string;
    path: string;
    referrer: string;
  };
  sessionId: string;
  honeypot: string;
}

export interface SubmitResult {
  leadRef: string;
  redirectUrl?: string;
}

export async function fetchConfigurator(configId: string): Promise<ConfiguratorResponse> {
  const url = `${API_BASE}/configurators/${encodeURIComponent(configId)}`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) {
    const msg = res.status === 404 ? 'Configurator not found' : `Server error (${res.status})`;
    throw new Error(msg);
  }
  return res.json() as Promise<ConfiguratorResponse>;
}

export async function submitLead(payload: SubmitPayload): Promise<SubmitResult> {
  const url = `${API_BASE}/configurators/${encodeURIComponent(payload.configId)}/submit`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Submission failed (${res.status})`);
  }
  return res.json() as Promise<SubmitResult>;
}
