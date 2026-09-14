export function formatDateTime(
  dateInput: any,
  lang: string = 'ar',
  options?: { includeTime?: boolean; includeYear?: boolean }
): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);
  const locale = lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-US';
  const opt: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    ...(options?.includeYear !== false ? { year: 'numeric' } : {}),
    ...(options?.includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
  };
  return date.toLocaleDateString(locale, opt);
}

export function formatDateOnly(dateInput: any, lang: string = 'ar', includeYear: boolean = true): string {
  return formatDateTime(dateInput, lang, { includeTime: false, includeYear });
}

export function formatTimeOnly(dateInput: any, lang: string = 'ar'): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  const locale = lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-US';
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}
