// Normalización + validación de códigos (servidor). Gemela de CodeNormalizer.kt
// del PDA. La paridad se garantiza con packages/rules-spec/vectors.json.

const INVISIBLES = /[\u0000-\u001F\u007F\u200B-\u200D\uFEFF]/g;
const ALLOWED = /^[A-Za-z0-9 \-]+$/;
const URL_HINT = /(https?:\/\/|www\.|\.com|\.cl|\.net|\.org|qrco|:\/\/)/i;
const SPACES_AROUND_HYPHEN = /\s*-\s*/g;
const LEADING_NUM_PREFIX = /^(\d+)\s+/;
const INTERNAL_SPACES = /\s+/g;

export function normalize(raw: string | null | undefined): string {
  if (!raw) return "";
  let s = raw.replace(INVISIBLES, "").trim();
  if (!s) return "";
  s = s.replace(SPACES_AROUND_HYPHEN, "-");
  s = s.replace(LEADING_NUM_PREFIX, "$1-");
  s = s.replace(INTERNAL_SPACES, "");
  return s.toUpperCase();
}

export type Validation = { ok: true } | { ok: false; reason: string };

export function preValidate(raw: string | null | undefined): Validation {
  const invalid = { ok: false as const, reason: "Lectura inválida para este proceso de recepción" };
  const s = (raw ?? "").replace(INVISIBLES, "").trim();
  if (!s) return { ok: false, reason: "Lectura vacía" };
  if (URL_HINT.test(s)) return invalid;
  const s2 = s.replace(SPACES_AROUND_HYPHEN, "-");
  if (!ALLOWED.test(s2)) return invalid;
  const tokens = s2.split(/\s+/).filter(Boolean);
  if (tokens.length > 2) return invalid;
  if (tokens.length === 2 && !/^\d+$/.test(tokens[0])) return invalid;
  return { ok: true };
}
