export interface ShareLine {
  /** counterpart name */
  n: string;
  /** cents */
  a: number;
  /** counterpart's Pix key, when registered */
  pix?: string;
}

export interface ShareSnapshot {
  v: 1;
  /** party name */
  p: string;
  /** emoji */
  e: string;
  /** date iso */
  d: string;
  /** participant name */
  n: string;
  /** cents consumed */
  o: number;
  /** cents paid */
  q: number;
  /** transfers to pay */
  pay: ShareLine[];
  /** transfers to receive */
  get: ShareLine[];
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export function encodeSnapshot(snapshot: ShareSnapshot): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(snapshot)));
}

export function decodeSnapshot(payload: string): ShareSnapshot | null {
  try {
    const parsed = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    if (!parsed || parsed.v !== 1 || typeof parsed.n !== "string") return null;
    return parsed as ShareSnapshot;
  } catch {
    return null;
  }
}
