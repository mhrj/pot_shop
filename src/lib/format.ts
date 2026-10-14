const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toFa(input: string | number): string {
  return String(input).replace(/\d/g, (d) => faDigits[Number(d)]);
}

export function formatToman(
  amount: number,
  opts: { withUnit?: boolean; fa?: boolean } = {},
): string {
  const { withUnit = true, fa = true } = opts;
  const grouped = Math.round(amount).toLocaleString('en-US');
  const out = fa ? toFa(grouped) : grouped;
  return withUnit ? `${out} تومان` : out;
}

export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    return `${toFa((grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 1))} کیلوگرم`;
  }
  return `${toFa(grams)} گرم`;
}

export function formatDateFa(date: Date | string): string {
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export function orderNumberFa(n: string) {
  return toFa(n);
}
