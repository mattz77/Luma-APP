/**
 * Formatação de datas para exibição pt-BR (DD/MM/AAAA) e conversão para ISO YYYY-MM-DD (Postgres / API).
 */

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Hoje no fuso local como YYYY-MM-DD (valor de `<input type="date" />` e API) */
export function localIsoDateToday(): string {
  return dateToIsoYmdLocal(new Date());
}

/** Converte `Date` local para YYYY-MM-DD (sem UTC) */
export function dateToIsoYmdLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Interpreta YYYY-MM-DD no calendário local (meia-noite local) */
export function parseIsoYmdToLocalDate(iso: string): Date {
  const head = iso.trim().slice(0, 10);
  const m = head.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return new Date();
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const d = parseInt(m[3], 10);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    return new Date();
  }
  return dt;
}

export function isValidIsoYmd(iso: string): boolean {
  const head = iso.trim().slice(0, 10);
  const m = head.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const d = parseInt(m[3], 10);
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

/** Hoje no fuso local como DD/MM/AAAA */
export function todayBrazilianDateString(): string {
  const n = new Date();
  return `${pad2(n.getDate())}/${pad2(n.getMonth() + 1)}/${n.getFullYear()}`;
}

/** Converte prefixo YYYY-MM-DD (ou ISO completo) para DD/MM/AAAA */
export function isoYmdToBrazilian(iso: string): string {
  const head = iso.trim().slice(0, 10);
  const m = head.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return todayBrazilianDateString();
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
}

/**
 * Normaliza valor vindo do backend (YYYY-MM-DD ou ISO) para exibição DD/MM/AAAA.
 * Se não for parseável, usa hoje local.
 */
export function expenseRawDateToBrazilian(raw: string): string {
  const head = raw.trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(head)) {
    return isoYmdToBrazilian(head);
  }
  return todayBrazilianDateString();
}

/**
 * Máscara enquanto o usuário digita: só dígitos, no máx. 8 → DD/MM/AAAA
 */
export function formatBrazilianDateTyping(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Valida calendário e retorna YYYY-MM-DD ou null.
 */
export function parseBrazilianDateToIso(display: string): string | null {
  const digits = display.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const day = parseInt(digits.slice(0, 2), 10);
  const month = parseInt(digits.slice(2, 4), 10);
  const year = parseInt(digits.slice(4, 8), 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(year, month - 1, day);
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null;
  return `${year}-${pad2(month)}-${pad2(day)}`;
}
