"use client";
import { useState } from 'react';
import { translateText, getUserLanguage, type LanguageCode } from '../lib/translation';

interface TranslateButtonProps {
  text: string;
  fromLanguage?: LanguageCode;
  context?: 'service' | 'requirement' | 'profile' | 'general';
}

export default function TranslateButton({ 
  text, 
  fromLanguage = 'en',
  context = 'general'
}: TranslateButtonProps) {
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTranslate = async () => {
    if (isTranslated) {
      setIsTranslated(false);
      return;
    }

    const userLanguage = getUserLanguage();
    if (userLanguage === fromLanguage) {
      return; // No need to translate
    }

    setIsLoading(true);
    try {
      const translated = await translateText({ 
        text, 
        fromLanguage, 
        toLanguage: userLanguage, 
        context 
      });
      setTranslatedText(translated);
      setIsTranslated(true);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const userLanguage = getUserLanguage();
  const needsTranslation = userLanguage !== fromLanguage;

  if (!needsTranslation) {
    return null; // Don't show button if no translation needed
  }

  return (
    <div className="mt-3">
      <button
        onClick={handleTranslate}
        disabled={isLoading}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
          transition-all duration-200 ease-in-out
          ${isTranslated 
            ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' 
            : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
          }
          ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-sm cursor-pointer'}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        `}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
            <span>Translating...</span>
          </>
        ) : isTranslated ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Show Original</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span>Translate</span>
          </>
        )}
      </button>
      
      {isTranslated && (
        <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 w-5 h-5 mt-0.5">
              <svg className="w-full h-full text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 mb-1">Translation</p>
              <p className="text-sm text-gray-700 leading-relaxed">{translatedText}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
