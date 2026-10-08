// Normaliza nome próprio para Title Case, respeitando preposições
// "maria da silva" → "Maria da Silva"
export function toTitleCase(input: string): string {
  const minorWords = new Set([
    "de", "da", "do", "das", "dos",
    "e", "em", "com",
    "a", "o", "as", "os",
  ]);

  return input
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (index === 0) return capitalize(word);
      if (minorWords.has(word)) return word;
      return capitalize(word);
    })
    .join(" ");
}

function capitalize(word: string): string {
  if (!word) return word;
  // Trata hífens: "ana-maria" → "Ana-Maria"
  return word
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join("-");
}