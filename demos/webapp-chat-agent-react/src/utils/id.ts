export function id() {
  return crypto.randomUUID?.() || String(Date.now() + Math.random());
}
