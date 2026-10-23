const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toFa(input: string | number): string {
  return String(input).replace(/\d/g, (d) => faDigits[Number(d)]);
}

export function toEn(input: string | number): string {
  return String(input)
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
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

export function formatDateFa(date?: Date | string | null): string {
  if (!date) return '—';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Tehran',
    }).format(d);
  } catch {
    return '—';
  }
}

export function orderNumberFa(n: string) {
  return toFa(n);
}

/**
 * Calculates the next shipping date (Sundays and Wednesdays only).
 * Cutoff time in Asia/Tehran is 10:00 AM.
 * 1. Sunday (0) or Wednesday (3) before 10:00 AM -> TODAY.
 * 2. Otherwise calculate days remaining until next Sunday or Wednesday:
 *    - Sunday after 10 AM -> next is Wednesday (3 days away).
 *    - Thursday -> next is Sunday (3 days away).
 */
export function getNextShippingDate(fromDate?: Date | string | null): Date {
  const base = fromDate ? new Date(fromDate) : new Date();
  if (isNaN(base.getTime())) return new Date();

  const getTehranDay = (date: Date) => {
    const dayStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tehran',
      weekday: 'short',
    }).format(date);
    const map: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    return map[dayStr] ?? date.getDay();
  };

  const getTehranHour = (date: Date) => {
    const hStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tehran',
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(date);
    return parseInt(hStr, 10);
  };

  const d = new Date(base.getTime());
  const day = getTehranDay(d);
  const hour = getTehranHour(d);

  // If today is Sunday (0) or Wednesday (3) AND current time is before 10:00 AM, next shipping date is TODAY.
  if ((day === 0 || day === 3) && hour < 10) {
    return d;
  }

  // Otherwise, calculate days remaining until next Sunday (0) or Wednesday (3)
  let daysToAdd = 0;
  if (day === 0) {
    daysToAdd = 3; // Sunday after 10 AM -> Wednesday (3 days)
  } else if (day === 1) {
    daysToAdd = 2; // Monday -> Wednesday (2 days)
  } else if (day === 2) {
    daysToAdd = 1; // Tuesday -> Wednesday (1 day)
  } else if (day === 3) {
    daysToAdd = 4; // Wednesday after 10 AM -> Sunday (4 days)
  } else if (day === 4) {
    daysToAdd = 3; // Thursday -> Sunday (3 days)
  } else if (day === 5) {
    daysToAdd = 2; // Friday -> Sunday (2 days)
  } else if (day === 6) {
    daysToAdd = 1; // Saturday -> Sunday (1 day)
  }

  d.setDate(d.getDate() + daysToAdd);
  return d;
}

/**
 * Returns formatted Persian string for the upcoming Sunday or Wednesday shipping day.
 * Example: "یکشنبه ۳ آبان" or "چهارشنبه ۶ آبان"
 */
export function getNextShippingDay(fromDate?: Date | string | null): string {
  const base = fromDate ? new Date(fromDate) : new Date();
  if (isNaN(base.getTime())) return '—';
  const targetDate = getNextShippingDate(base);

  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Tehran',
  }).format(targetDate);
}


