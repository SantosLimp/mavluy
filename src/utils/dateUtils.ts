
const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو',
  'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'
];

export function toLatinDigits(str: string): string {
  if (!str) return '';
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, (w) => String(arabicDigits.indexOf(w)));
}

const ENGLISH_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const FRENCH_MONTHS = [
  'Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'
];

export function formatDateTime(
  dateInput: string | number | Date | null | undefined,
  lang: string = 'ar',
  options?: {
    includeTime?: boolean;
    includeYear?: boolean;
  }
): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const day = d.getDate();
  const monthIdx = d.getMonth();
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  const includeTime = options?.includeTime !== false;
  const includeYear = options?.includeYear ?? false;

  let monthName = '';
  if (lang === 'ar') {
    monthName = ARABIC_MONTHS[monthIdx];
  } else if (lang === 'fr') {
    monthName = FRENCH_MONTHS[monthIdx];
  } else {
    monthName = ENGLISH_MONTHS[monthIdx];
  }

  const datePart = includeYear ? `${day} ${monthName} ${year}` : `${day} ${monthName}`;
  const separator = lang === 'ar' ? '، ' : ', ';
  return includeTime ? `${datePart}${separator}${timeStr}` : datePart;
}

export function formatTimeOnly(
  dateInput: string | number | Date | null | undefined
): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDateOnly(
  dateInput: string | number | Date | null | undefined,
  lang: string = 'ar',
  includeYear: boolean = true
): string {
  return formatDateTime(dateInput, lang, { includeTime: false, includeYear });
}
