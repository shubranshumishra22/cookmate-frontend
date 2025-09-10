// Translation utility for frontend
import { apiFetch } from './api';

export const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'hi': 'Hindi (हिंदी)',
  'ta': 'Tamil (தமிழ்)', 
  'te': 'Telugu (తెలుగు)',
  'kn': 'Kannada (ಕನ್ನಡ)',
  'ml': 'Malayalam (മലയാളം)',
  'bn': 'Bengali (বাংলা)',
  'mr': 'Marathi (मराठी)',
  'gu': 'Gujarati (ગુજરાતી)',
  'pa': 'Punjabi (ਪੰਜਾਬੀ)'
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

interface TranslateRequest {
  text: string;
  fromLanguage: LanguageCode;
  toLanguage: LanguageCode;
  context?: 'service' | 'requirement' | 'profile' | 'general';
}

interface TranslateResponse {
  originalText: string;
  translatedText: string;
  fromLanguage: string;
  toLanguage: string;
  context?: string;
}

interface TranslateBatchRequest {
  texts: string[];
  fromLanguage: LanguageCode;
  toLanguage: LanguageCode;
  context?: 'service' | 'requirement' | 'profile' | 'general';
}

interface TranslateBatchResponse {
  originalTexts: string[];
  translatedTexts: string[];
  fromLanguage: string;
  toLanguage: string;
  context?: string;
}

export async function translateText({
  text,
  fromLanguage,
  toLanguage,
  context = 'general'
}: TranslateRequest): Promise<string> {
  try {
    if (fromLanguage === toLanguage) {
      return text;
    }

    const response = await apiFetch('/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, fromLanguage, toLanguage, context })
    });

    if (!response.ok) {
      throw new Error('Translation failed');
    }

    const data: TranslateResponse = await response.json();
    return data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text on error
  }
}

export async function translateBatch({
  texts,
  fromLanguage,
  toLanguage,
  context = 'general'
}: TranslateBatchRequest): Promise<string[]> {
  try {
    if (fromLanguage === toLanguage) {
      return texts;
    }

    const response = await apiFetch('/translate-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, fromLanguage, toLanguage, context })
    });

    if (!response.ok) {
      throw new Error('Batch translation failed');
    }

    const data: TranslateBatchResponse = await response.json();
    return data.translatedTexts;
  } catch (error) {
    console.error('Batch translation error:', error);
    return texts; // Return original texts on error
  }
}

export async function detectLanguage(text: string): Promise<LanguageCode> {
  try {
    const response = await apiFetch('/detect-language', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error('Language detection failed');
    }

    const data = await response.json();
    return data.detectedLanguage as LanguageCode;
  } catch (error) {
    console.error('Language detection error:', error);
    return 'en'; // Default to English
  }
}

// Get user's preferred language from localStorage
export function getUserLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'en';
  
  const stored = localStorage.getItem('preferredLanguage');
  if (stored && stored in SUPPORTED_LANGUAGES) {
    return stored as LanguageCode;
  }
  
  // Try to detect from browser language
  const browserLang = navigator.language.split('-')[0];
  if (browserLang in SUPPORTED_LANGUAGES) {
    return browserLang as LanguageCode;
  }
  
  return 'en'; // Default to English
}

// Set user's preferred language
export function setUserLanguage(language: LanguageCode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('preferredLanguage', language);
}

// Hook to translate content based on user's language preference
export function useTranslation() {
  const userLanguage = getUserLanguage();
  
  const translate = async (
    text: string, 
    fromLanguage: LanguageCode = 'en',
    context?: 'service' | 'requirement' | 'profile' | 'general'
  ) => {
    return translateText({ text, fromLanguage, toLanguage: userLanguage, context });
  };

  return { translate, userLanguage, setUserLanguage };
}
