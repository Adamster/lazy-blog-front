const numberFmt = new Intl.NumberFormat("en-US");

export function formatScore(score: number): string {
  return numberFmt.format(score);
}
