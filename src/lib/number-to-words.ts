/**
 * Converts numbers into Persian words.
 * Example: 500000 -> "پانصد هزار"
 *          1250000 -> "یک میلیون و دویست و پنجاه هزار"
 */

const ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const TEENS = [
  'ده',
  'یازده',
  'دوازده',
  'سیزده',
  'چهارده',
  'پانزده',
  'شانزده',
  'هفده',
  'هجده',
  'نوزده',
];
const TENS = [
  '',
  '',
  'بیست',
  'سی',
  'چهل',
  'پنجاه',
  'شصت',
  'هفتاد',
  'هشتاد',
  'نود',
];
const HUNDREDS = [
  '',
  'صد',
  'دویست',
  'سیصد',
  'چهارصد',
  'پانصد',
  'ششصد',
  'هفتصد',
  'هشتصد',
  'نهصد',
];
const SCALES = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

function chunkToWords(n: number): string[] {
  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const rem = n % 100;

  if (hundreds > 0 && hundreds < HUNDREDS.length) {
    parts.push(HUNDREDS[hundreds]);
  }

  if (rem > 0) {
    if (rem < 10) {
      parts.push(ONES[rem]);
    } else if (rem < 20) {
      parts.push(TEENS[rem - 10]);
    } else {
      const tens = Math.floor(rem / 10);
      const ones = rem % 10;
      if (tens > 0 && tens < TENS.length) {
        parts.push(TENS[tens]);
      }
      if (ones > 0) {
        parts.push(ONES[ones]);
      }
    }
  }

  return parts;
}

export function numberToWordsFa(num: number): string {
  if (!Number.isFinite(num)) return '';
  const n = Math.floor(Math.abs(num));
  if (n === 0) return 'صفر';

  const chunks: number[] = [];
  let temp = n;
  while (temp > 0) {
    chunks.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const resultParts: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];
    if (chunk === 0) continue;

    const words = chunkToWords(chunk);
    if (words.length > 0) {
      const scale = SCALES[i] || '';
      const chunkText = words.join(' و ');
      resultParts.push(scale ? `${chunkText} ${scale}` : chunkText);
    }
  }

  const prefix = num < 0 ? 'منفی ' : '';
  return prefix + resultParts.join(' و ');
}
