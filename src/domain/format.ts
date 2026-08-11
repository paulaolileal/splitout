export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** Parses "1.234,56" / "1234.56" / "90" into cents. */
export function parseAmount(input: string): number {
  const cleaned = input.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}\b)/g, "");
  const normalized = cleaned.replace(",", ".");
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100);
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
  });
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

const PALETTE = [
  "var(--avatar-1)",
  "var(--avatar-2)",
  "var(--avatar-3)",
  "var(--avatar-4)",
  "var(--avatar-5)",
  "var(--avatar-6)",
  "var(--avatar-7)",
  "var(--avatar-8)",
];

export function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length]!;
}

/** Strips everything but digits and, for a bare 10-11 digit Brazilian local
 * number (DDD + phone, no country code), prefixes `55` — what `wa.me`
 * expects (full E.164 digits, no `+`/spaces/dashes). */
export function toWhatsAppDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

/** Builds a `wa.me` deep link. Without a phone, omits the number entirely —
 * WhatsApp then opens its own contact/group picker (used for the group
 * share, which has no single recipient). */
export function buildWhatsAppLink(phone: string | null | undefined, text: string): string {
  const digits = phone ? toWhatsAppDigits(phone) : "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
