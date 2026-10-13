import React, { createContext, useContext, useEffect } from "react";
import { Language, translations, getTranslation, Translations } from "../i18n/translations";

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  toggleLang: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dict: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const lang: Language = "en";

  const setLang = (_newLang: Language) => {
    // English only mode
  };

  const toggleLang = () => {
    // English only mode
  };

  useEffect(() => {
    document.documentElement.lang = "en";
    document.documentElement.setAttribute("data-lang", "en");
    document.documentElement.classList.remove("lang-my");
  }, []);

  const t = (key: string, params?: Record<string, string | number>): string => {
    return getTranslation(lang, key, params);
  };

  const dict = translations.en;

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, dict }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
