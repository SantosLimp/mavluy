// Store-specific and Country-specific cities database

export const COUNTRY_CITIES: Record<string, string[]> = {
  // Morocco Cities (المدن المغربية)
  ma: [
    'الدار البيضاء (Casablanca)',
    'الرباط (Rabat)',
    'مراكش (Marrakech)',
    'طنجة (Tanger)',
    'فاس (Fès)',
    'أكادير (Agadir)',
    'مكناس (Meknès)',
    'وجدة (Oujda)',
    'القنيطرة (Kénitra)',
    'تطوان (Tétouan)',
    'تمارة (Témara)',
    'سلا (Salé)',
    'الناظور (Nador)',
    'الجديدة (El Jadida)',
    'المحمدية (Mohammédia)',
    'بني ملال (Béni Mellal)',
    'خريبكة (Khouribga)',
    'تازة (Taza)',
    'الصويرة (Essaouira)',
    'العيون (Laâyoune)',
    'الداخلة (Dakhla)',
    'برشيد (Berrechid)',
    'ورزازات (Ouarzazate)',
    'الحسيمة (Al Hoceïma)',
    'سطات (Settat)',
    'آسفي (Safi)',
    'كلميم (Guelmim)',
    'تزنيت (Tiznit)',
    'تارودانت (Taroudant)',
    'العرائش (Larache)'
  ],

  // Libya Cities (مدن ليبيا)
  ly: [
    'طرابلس (Tripoli)',
    'بنغازي (Benghazi)',
    'مصراتة (Misrata)',
    'الزاوية (Zawiya)',
    'البيضاء (Bayda)',
    'طبرق (Tobruk)',
    'زليتن (Zliten)',
    'سبها (Sabha)',
    'سرت (Sirte)',
    'غريان (Gharyan)',
    'درنة (Derna)',
    'صبراتة (Sabratha)',
    'الخمس (Al-Khums)',
    'أجدابيا (Ajdabiya)'
  ],

  // Saudi Arabia Cities (مدن السعودية)
  sa: [
    'الرياض (Riyadh)',
    'جدة (Jeddah)',
    'مكة المكرمة (Mecca)',
    'المدينة المنورة (Medina)',
    'الدمام (Dammam)',
    'الخبر (Khobar)',
    'الجبيل (Jubail)',
    'الأحساء (Al-Ahsa)',
    'تبوك (Tabuk)',
    'الطائف (Taif)',
    'خميس مشيط (Khamis Mushait)',
    'حائل (Hail)',
    'نجران (Najran)',
    'أبها (Abha)',
    'ينبع (Yanbu)',
    'بريدة (Buraidah)',
    'القطيف (Qatif)',
    'جيزان (Jizan)'
  ]
};

// Fallback helper to get cities by country slug or code
export function getCitiesForCountry(countrySlugOrCode: string = 'ma'): string[] {
  const clean = (countrySlugOrCode || 'ma').toLowerCase().trim();
  if (COUNTRY_CITIES[clean]) {
    return COUNTRY_CITIES[clean];
  }
  // Default to Morocco if unknown or requested
  return COUNTRY_CITIES.ma || Object.values(COUNTRY_CITIES)[0];
}
