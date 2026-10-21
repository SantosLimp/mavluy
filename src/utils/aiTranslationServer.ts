import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import os from 'os';

let aiInstance: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (aiInstance) return aiInstance;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
    return aiInstance;
  } catch (err) {
    console.error('[AI-Translation] Failed to initialize GoogleGenAI:', err);
    return null;
  }
}

// Memory cache for translations
const memoryTranslationCache: Record<string, string> = {};

// Built-in high-quality eCommerce translation dictionary for COD Moroccan store terms and common FAQs
const COMMON_ECOM_TRANSLATIONS: Record<string, string> = {
  // Frequently asked questions
  'هل التوصيل مجاني؟': 'Is delivery free?',
  'هل التوصيل مجاني لجميع المدن؟': 'Is delivery free to all cities?',
  'كم يستغرق التوصيل؟': 'How long does delivery take?',
  'كم مدة التوصيل؟': 'What is the delivery time?',
  'هل الدفع عند الاستلام متاح؟': 'Is cash on delivery available?',
  'كيف يتم الدفع؟': 'How does payment work?',
  'هل يمكنني معاينة المنتج قبل الدفع؟': 'Can I inspect the item before paying?',
  'ما هي سياسة الاسترجاع والاستبدال؟': 'What is the return and exchange policy?',
  'هل المنتج أصلي وذو جودة عالية؟': 'Is the product authentic and high quality?',
  'كيف يمكنني تتبع طلبي؟': 'How can I track my order?',
  'ماذا لو وصلني المنتج متضرراً؟': 'What if the item arrives damaged?',
  
  // Typical answers
  'نعم التوصيل مجاني وسريع لجميع مدن المغرب مع الدفع عند الاستلام.': 'Yes, delivery is free and fast across all cities with cash on delivery.',
  'نعم، التوصيل مجاني لجميع المدن.': 'Yes, delivery is free for all cities.',
  'يستغرق التوصيل عادة من 24 إلى 48 ساعة فقط حسب مدينتك.': 'Delivery usually takes only 24 to 48 hours depending on your city.',
  'نعم، يمكنك الدفع نقداً عند استلام وفحص طلبك بأمان تام.': 'Yes, you can pay in cash upon receiving and inspecting your order safely.',
  'نعم بالتأكيد! يمكنك فتح الطرد والتأكد من المنتج قبل تسليم المبلغ للموزع.': 'Absolutely! You can open the package and inspect the product before handing payment to the courier.',
  'نقدم ضمان استبدال أو استرجاع لمدة 7 أيام في حال وجود أي عيب مصنعي.': 'We provide a 7-day replacement or return guarantee in case of any manufacturing defect.',
  'نعم، جميع منتجاتنا أصلية وتخضع لفحص الجودة قبل الشحن.': 'Yes, all our products are authentic and undergo quality checks before dispatch.',
  
  // Product descriptors
  'جودة عالية وضمان شامل': 'High quality & comprehensive warranty',
  'دفع آمن عند الاستلام': 'Secure Cash on Delivery',
  'توصيل سريع لجميع المدن': 'Fast shipping to all cities',
  'خدمة عملاء على مدار الساعة': '24/7 dedicated customer support'
};

function hasArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

/**
 * Translates a single piece of text to English using Gemini, cache, or dictionary
 */
export async function translateTextToEnglish(text: string, context: string = 'product description'): Promise<string> {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed) return '';
  
  // If already pure English/Latin, return as is
  if (!hasArabic(trimmed)) return trimmed;

  // Check cache
  const cacheKey = `en:${trimmed}`;
  if (memoryTranslationCache[cacheKey]) {
    return memoryTranslationCache[cacheKey];
  }

  // Check common e-commerce dictionary
  if (COMMON_ECOM_TRANSLATIONS[trimmed]) {
    memoryTranslationCache[cacheKey] = COMMON_ECOM_TRANSLATIONS[trimmed];
    return COMMON_ECOM_TRANSLATIONS[trimmed];
  }

  const ai = getGenAI();
  if (!ai) {
    return fallbackTranslate(trimmed);
  }

  try {
    const prompt = `Translate the following Arabic ${context} for an online e-commerce store into clear, compelling, professional English. Keep formatting, line breaks, and emojis intact. Provide ONLY the translated text without explanations, intro, or quotation marks.\n\nArabic text:\n${trimmed}`;
    
    // Set a reasonable timeout so store requests never hang
    const translatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
        systemInstruction: 'You are a professional multilingual e-commerce copywriter. Translate Arabic product copy, descriptions, titles, and FAQs into fluent, natural English suitable for an online store.'
      }
    });

    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Translation timeout')), 5500);
    });

    const response = await Promise.race([translatePromise, timeoutPromise]) as any;
    if (response && response.text) {
      const translated = response.text.trim().replace(/^["']|["']$/g, '');
      if (translated) {
        memoryTranslationCache[cacheKey] = translated;
        return translated;
      }
    }
  } catch (err: any) {
    console.warn(`[AI-Translation] Gemini translation skipped for "${trimmed.slice(0, 30)}...":`, err?.message || err);
  }

  // Fallback
  const fallback = fallbackTranslate(trimmed);
  memoryTranslationCache[cacheKey] = fallback;
  return fallback;
}

/**
 * Translates full product fields (title, description, tagline, faqs, features)
 */
export async function autoTranslateProductFields(product: any): Promise<{
  nameEn?: string;
  descriptionEn?: string;
  taglineEn?: string;
  faqs?: Array<{ q: string; qEn?: string; a: string; aEn?: string }>;
  features?: Array<{ title: string; titleEn?: string; desc: string; descEn?: string; icon?: string }>;
  howToUseEn?: string[];
}> {
  if (!product) return {};

  const ai = getGenAI();
  const result: any = {};

  // If Gemini is available, attempt a single structured batch translation for speed
  if (ai) {
    try {
      const faqsList = Array.isArray(product.faqs) ? product.faqs : [];
      const featuresList = Array.isArray(product.features) ? product.features : [];

      const payload = {
        name: product.name || '',
        description: product.description || '',
        tagline: product.tagline || '',
        faqs: faqsList.map((f: any) => ({ q: f?.q || '', a: f?.a || '' })),
        features: featuresList.map((f: any) => ({ title: f?.title || '', desc: f?.desc || '' }))
      };

      const prompt = `Translate this Arabic e-commerce product into professional, persuasive English. Return a strictly valid JSON object with the exact keys:
{
  "nameEn": "English product name",
  "descriptionEn": "English product description",
  "taglineEn": "English tagline or subtitle",
  "faqs": [{"qEn": "English question", "aEn": "English answer"}],
  "features": [{"titleEn": "English feature title", "descEn": "English feature description"}]
}

Product details to translate:
${JSON.stringify(payload, null, 2)}`;

      const genPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
          systemInstruction: 'You are an expert e-commerce catalog translator. Translate Arabic products into fluent English that converts well. Keep the tone friendly and authoritative.'
        }
      });
      const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 4500));
      const response = await Promise.race([genPromise, timeoutPromise]) as any;

      const parsed = JSON.parse(response.text?.trim() || '{}');
      if (parsed.descriptionEn) {
        result.descriptionEn = parsed.descriptionEn;
      }
      if (parsed.nameEn) {
        result.nameEn = parsed.nameEn;
      }
      if (parsed.taglineEn) {
        result.taglineEn = parsed.taglineEn;
      }
      if (Array.isArray(parsed.faqs) && parsed.faqs.length > 0) {
        result.faqs = (product.faqs || []).map((origFaq: any, i: number) => {
          const translated = parsed.faqs[i] || {};
          return {
            ...origFaq,
            q: origFaq.q,
            qEn: translated.qEn || origFaq.qEn || origFaq.q,
            a: origFaq.a,
            aEn: translated.aEn || origFaq.aEn || origFaq.a
          };
        });
      }
      if (Array.isArray(parsed.features) && parsed.features.length > 0) {
        result.features = (product.features || []).map((origFeat: any, i: number) => {
          const translated = parsed.features[i] || {};
          return {
            ...origFeat,
            title: origFeat.title,
            titleEn: translated.titleEn || origFeat.titleEn || origFeat.title,
            desc: origFeat.desc,
            descEn: translated.descEn || origFeat.descEn || origFeat.desc
          };
        });
      }

      return result;
    } catch (e: any) {
      console.warn('[AI-Translation] Batch translation fell back to sequential:', e?.message || e);
    }
  }

  // Fallback sequential translation
  if (product.description && !product.descriptionEn) {
    result.descriptionEn = await translateTextToEnglish(product.description, 'product description');
  } else if (product.descriptionEn) {
    result.descriptionEn = product.descriptionEn;
  }

  if (product.name && !product.nameEn) {
    result.nameEn = await translateTextToEnglish(product.name, 'product title');
  }

  if (product.tagline && !product.taglineEn) {
    result.taglineEn = await translateTextToEnglish(product.tagline, 'product tagline');
  }

  if (Array.isArray(product.faqs)) {
    result.faqs = await Promise.all(product.faqs.map(async (faq: any) => ({
      ...faq,
      qEn: faq.qEn || await translateTextToEnglish(faq.q, 'FAQ question'),
      aEn: faq.aEn || await translateTextToEnglish(faq.a, 'FAQ answer')
    })));
  }

  return result;
}

/**
 * Intelligent deterministic fallback when AI is unavailable
 */
function fallbackTranslate(text: string): string {
  if (COMMON_ECOM_TRANSLATIONS[text]) {
    return COMMON_ECOM_TRANSLATIONS[text];
  }

  // Check if any known key is substring
  for (const [arKey, enVal] of Object.entries(COMMON_ECOM_TRANSLATIONS)) {
    if (text.includes(arKey)) {
      return enVal;
    }
  }

  // Basic word replacement heuristics for common Arabic e-commerce vocabulary
  const wordsMap: Record<string, string> = {
    'توصيل': 'Delivery',
    'مجاني': 'Free',
    'سريع': 'Fast',
    'المغرب': 'Morocco',
    'المنتج': 'Product',
    'جودة': 'Quality',
    'عالية': 'High',
    'أصلي': 'Authentic',
    'الدفع': 'Payment',
    'عند': 'on',
    'الاستلام': 'Delivery',
    'ضمان': 'Warranty',
    'استبدال': 'Exchange',
    'استرجاع': 'Return'
  };

  let translated = text;
  for (const [ar, en] of Object.entries(wordsMap)) {
    translated = translated.replace(new RegExp(ar, 'g'), en);
  }

  return translated !== text ? translated : text;
}
