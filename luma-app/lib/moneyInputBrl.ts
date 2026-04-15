/** Formatação e máscara de valores em BRL (entrada de texto → centavos como string de dígitos). */

const MAX_CENTS = 9_999_999_999_999;

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

/**
 * Entrada só com dígitos (teclado numérico), estilo caixa: cada novo dígito entra à direita
 * (valor em centavos ← valor×10 + dígito); apagar remove o último dígito (÷10).
 */
function parseAtmStyleDigitCents(newDigits: string, prevCentsDigits: string): string {
  const d = newDigits.replace(/\D/g, '');
  if (!d) return '';

  if (!prevCentsDigits) {
    return String(Math.min(parseInt(d, 10), MAX_CENTS));
  }

  // Digitou mais um à direita
  if (d.length === prevCentsDigits.length + 1 && d.startsWith(prevCentsDigits)) {
    const added = parseInt(d.slice(-1), 10);
    const v = parseInt(prevCentsDigits, 10);
    if (!Number.isFinite(added) || !Number.isFinite(v)) return prevCentsDigits;
    return String(Math.min(v * 10 + added, MAX_CENTS));
  }

  // Apagou o último dígito (direita)
  if (d.length === prevCentsDigits.length - 1 && prevCentsDigits.startsWith(d)) {
    return d;
  }

  // Colagem ou substituição total
  const n = parseInt(d, 10);
  if (!Number.isFinite(n)) return prevCentsDigits;
  return String(Math.min(Math.max(0, n), MAX_CENTS));
}

function parseFormattedToCentsDigits(cleaned: string): string {
  const commaIdx = cleaned.lastIndexOf(',');
  if (commaIdx !== -1) {
    const intRaw = cleaned.slice(0, commaIdx).replace(/\D/g, '');
    const decRaw = cleaned.slice(commaIdx + 1).replace(/\D/g, '').slice(0, 2);
    const dec = (decRaw + '00').slice(0, 2);
    const intPart = parseInt(intRaw || '0', 10);
    const centsFromDec = parseInt(dec, 10);
    const total = intPart * 100 + centsFromDec;
    return String(Math.min(Math.max(0, total), MAX_CENTS));
  }

  const noSpaces = cleaned.replace(/\s/g, '');
  if (/^\d{1,3}(\.\d{3})+$/.test(noSpaces)) {
    const intPart = noSpaces.replace(/\./g, '');
    const n = parseInt(intPart, 10);
    if (Number.isFinite(n)) return String(Math.min(n * 100, MAX_CENTS));
  }

  const lastDot = noSpaces.lastIndexOf('.');
  if (lastDot !== -1 && noSpaces.indexOf('.', lastDot + 1) === -1) {
    const after = noSpaces.slice(lastDot + 1);
    if (/^\d{1,2}$/.test(after) && lastDot > 0) {
      const intRaw = noSpaces.slice(0, lastDot).replace(/\D/g, '');
      const dec = (after + '00').slice(0, 2);
      const intPart = parseInt(intRaw || '0', 10);
      const total = intPart * 100 + parseInt(dec, 10);
      return String(Math.min(Math.max(0, total), MAX_CENTS));
    }
  }

  return '';
}

/**
 * Converte texto para string de centavos.
 * Use `prevCentsDigits` quando a entrada for só dígitos (teclado), para acumulação caixa + apagar à direita.
 * Colagem com vírgula/milhar usa o texto completo (ignora prev).
 */
export function parseMoneyInputToCentsDigits(text: string, prevCentsDigits = ''): string {
  const cleaned = text.replace(/R\$\s?/gi, '').replace(/\u00a0/g, ' ').trim();
  if (!cleaned) return '';

  const noSpaces = cleaned.replace(/\s/g, '');
  const hasComma = cleaned.includes(',');
  const looksLikeThousandDots = /^\d{1,3}(\.\d{3})+$/.test(noSpaces);
  const lastDot = noSpaces.lastIndexOf('.');
  const looksLikeDecimalDot =
    lastDot !== -1 &&
    noSpaces.indexOf('.', lastDot + 1) === -1 &&
    /^\d{1,2}$/.test(noSpaces.slice(lastDot + 1)) &&
    lastDot > 0;

  if (hasComma || looksLikeThousandDots || looksLikeDecimalDot) {
    const out = parseFormattedToCentsDigits(cleaned);
    return out || '';
  }

  const digitsOnly = noSpaces.replace(/\D/g, '');
  return parseAtmStyleDigitCents(digitsOnly, prevCentsDigits);
}

export function centsDigitsToDisplay(centsDigits: string): string {
  if (!centsDigits) return '';
  const cents = parseInt(centsDigits, 10);
  if (!Number.isFinite(cents) || cents < 0) return '';
  return formatCurrency(cents / 100);
}

/** Converte string de centavos em valor em reais (número). */
export function centsDigitsToReais(centsDigits: string): number {
  if (!centsDigits) return NaN;
  const cents = parseInt(centsDigits, 10);
  if (!Number.isFinite(cents) || cents <= 0) return NaN;
  return cents / 100;
}
