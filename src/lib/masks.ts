// =========================================================
// Máscaras
// =========================================================

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

// CPF: 000.000.000-00
export function maskCPF(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

// Telefone brasileiro — fixo (10 dígitos) ou celular (11 dígitos)
export function maskPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/^\((\d{2})\) (\d{4})(\d)/, "($1) $2-$3");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/^\((\d{2})\) (\d{5})(\d)/, "($1) $2-$3");
}

// =========================================================
// Validações
// =========================================================

// Valida CPF pelos dígitos verificadores
export function isValidCPF(cpf: string): boolean {
  const digits = onlyDigits(cpf);
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false; // 111.111.111-11 etc.

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(digits[i]) * (10 - i);
  let check = (sum * 10) % 11;
  if (check === 10) check = 0;
  if (check !== Number(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(digits[i]) * (11 - i);
  check = (sum * 10) % 11;
  if (check === 10) check = 0;
  return check === Number(digits[10]);
}

// Valida telefone brasileiro (10 ou 11 dígitos, DDD válido)
export function isValidPhoneBR(phone: string): boolean {
  const digits = onlyDigits(phone);
  if (digits.length < 10 || digits.length > 11) return false;

  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;

  return true;
}

// CNPJ: 00.000.000/0000-00
export function maskCNPJ(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

// Valida CNPJ pelos dígitos verificadores
export function isValidCNPJ(cnpj: string): boolean {
  const digits = onlyDigits(cnpj);
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calc = (base: string) => {
    let sum = 0;
    let pos = base.length - 7;
    for (let i = 0; i < base.length; i++) {
      sum += Number(base[i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const result = sum % 11;
    return result < 2 ? 0 : 11 - result;
  };

  const base = digits.slice(0, 12);
  const d1 = calc(base);
  const d2 = calc(base + d1);
  return digits.endsWith(`${d1}${d2}`);
}

// Máscara de moeda em Real: "1234" → "12,34"
// Retorna o texto formatado para exibir no input
export function maskCurrencyBRL(value: string): string {
  const digits = onlyDigits(value).slice(0, 10); // limite de 10 dígitos
  if (!digits) return "";

  const cents = Number(digits);
  const reais = cents / 100;

  return reais.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Converte "12,34" (formato brasileiro) para centavos (1234)
export function parseCurrencyToCents(value: string): number | null {
  const digits = onlyDigits(value);
  if (!digits) return null;

  const cents = Number(digits);
  if (!Number.isFinite(cents)) return null;
  return cents;
}

// Converte centavos (1234) para string brasileira ("12,34")
export function centsToCurrencyBRL(cents: number | null): string {
  if (cents === null || cents === undefined) return "";
  const reais = cents / 100;
  return reais.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// =========================================================
// Data brasileira (dd/mm/aaaa)
// =========================================================

// Aplica máscara enquanto digita: "10112026" → "10/11/2026"
export function maskDateBR(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);

  return digits
    .replace(/^(\d{2})(\d)/, "$1/$2")
    .replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
}

// Converte "dd/mm/aaaa" para "YYYY-MM-DD".
// Retorna null se a data for inválida (ex: 31/02/2026).
export function parseDateBR(value: string): string | null {
  const digits = onlyDigits(value);
  if (digits.length !== 8) return null;

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (year < 1900 || year > 2200) return null;

  const date = new Date(year, month - 1, day);

  // new Date() normaliza datas inválidas (31/02 → 03/03).
  // Se voltar diferente, era inválida.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

// Converte "YYYY-MM-DD" para "dd/mm/aaaa".
// Retorna "" se a entrada for vazia/null.
export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length !== 3) return "";
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

// Valida se "dd/mm/aaaa" é uma data válida
export function isValidDateBR(value: string): boolean {
  return parseDateBR(value) !== null;
}