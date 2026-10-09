// Remove prefixos comuns do Google Calendar para exibição
// NÃO altera o dado no banco, apenas a exibição
export function displayName(rawName: string): string {
  return rawName
    .replace(/^(atendimento|sessão|sessao|consulta|terapia)\s+/i, "")
    .trim();
}