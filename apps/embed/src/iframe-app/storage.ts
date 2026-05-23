const PREFIX = 'forma:';

export function saveState(configId: string, state: Record<string, unknown>): void {
  try {
    sessionStorage.setItem(PREFIX + configId, JSON.stringify(state));
  } catch {
    // storage unavailable (private mode, etc.)
  }
}

export function loadState(configId: string): Record<string, unknown> | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + configId);
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function clearState(configId: string): void {
  try {
    sessionStorage.removeItem(PREFIX + configId);
  } catch {
    // ignore
  }
}

export function getSessionId(): string {
  const key = 'forma:sid';
  try {
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
