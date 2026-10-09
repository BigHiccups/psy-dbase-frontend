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