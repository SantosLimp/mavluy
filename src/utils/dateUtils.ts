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

export function createProductSlug(prod: { id: string; name?: string; nameAr?: string; slug?: string }): string {
  if (!prod) return '';
  const title = prod.slug || prod.nameAr || prod.name || prod.id;
  return String(title)
    .trim()
    .toLowerCase()
    // replace slashes, underscores, and spaces with hyphens
    .replace(/[\s\/\\_]+/g, '-')
    // keep Arabic unicode characters, standard letters, numbers and hyphens
    .replace(/[^\p{L}\p{N}\-]/gu, '')
    // replace consecutive hyphens
    .replace(/-+/g, '-')
    // trim hyphens from start/end
    .replace(/^-+|-+$/g, '') || prod.id;
}
