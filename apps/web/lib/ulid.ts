/** Tiny ULID generator. Uses crypto.randomUUID as entropy source. */
export function ulid(prefix = ''): string {
  const now = Date.now();
  const timeChars = encodeTime(now);
  const randChars = encodeRandom();
  return prefix + timeChars + randChars;
}

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function encodeTime(ms: number): string {
  let out = '';
  let t = ms;
  for (let i = 9; i >= 0; i--) {
    out = ENCODING[t & 31] + out;
    t = Math.floor(t / 32);
  }
  return out;
}

function encodeRandom(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  let out = '';
  for (const b of bytes) {
    out += ENCODING[b & 31];
  }
  return out;
}
