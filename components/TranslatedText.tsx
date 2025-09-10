"use client";
import { useState, useEffect } from 'react';
import { translateText, getUserLanguage, type LanguageCode } from '../lib/translation';

interface TranslatedTextProps {
  text: string;
  fromLanguage?: LanguageCode;
  context?: 'service' | 'requirement' | 'profile' | 'general';
  fallback?: string;
}

export default function TranslatedText({ 
  text, 
  fromLanguage = 'en',
  context = 'general',
  fallback 
}: TranslatedTextProps) {
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en');

  useEffect(() => {
    const userLang = getUserLanguage();
    setCurrentLanguage(userLang);
    
    if (userLang !== fromLanguage && text) {
      setIsLoading(true);
      translateText({ text, fromLanguage, toLanguage: userLang, context })
        .then(translated => {
          setTranslatedText(translated || fallback || text);
        })
        .catch(error => {
          console.error('Translation failed:', error);
          setTranslatedText(fallback || text);
        })
        .finally(() => setIsLoading(false));
    } else {
      setTranslatedText(text);
    }
  }, [text, fromLanguage, context, fallback]);

  // Listen for language changes
  useEffect(() => {
    const handleStorageChange = () => {
      const newLanguage = getUserLanguage();
      if (newLanguage !== currentLanguage) {
        setCurrentLanguage(newLanguage);
        if (newLanguage !== fromLanguage && text) {
          setIsLoading(true);
          translateText({ text, fromLanguage, toLanguage: newLanguage, context })
            .then(translated => {
              setTranslatedText(translated || fallback || text);
            })
            .catch(error => {
              console.error('Translation failed:', error);
              setTranslatedText(fallback || text);
            })
            .finally(() => setIsLoading(false));
        } else {
          setTranslatedText(text);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [text, fromLanguage, context, fallback, currentLanguage]);

  if (isLoading) {
    return <span style={{ opacity: 0.7 }}>🔄 {text}</span>;
  }

  return <>{translatedText}</>;
}

// Wrapper for service cards with translation
export function TranslatedServiceCard({ service, children }: { service: any; children: React.ReactNode }) {
  return (
    <div>
      {children}
      {/* You can add automatic translation overlays here if needed */}
    </div>
  );
}
