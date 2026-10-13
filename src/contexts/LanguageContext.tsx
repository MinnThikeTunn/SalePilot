import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, translations, getTranslation, Translations } from "../i18n/translations";

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  toggleLang: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dict: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "sales_brain_lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "my" || stored === "en") return stored;
    } catch {
      // ignore
    }
    return "en";
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
  };

  const toggleLang = () => {
    setLang(lang === "en" ? "my" : "en");
  };

  useEffect(() => {
    // Reflect language attribute on document root for typography and CSS pseudo-classes
    document.documentElement.lang = lang;
    document.documentElement.setAttribute("data-lang", lang);
    if (lang === "my") {
      document.documentElement.classList.add("lang-my");
    } else {
      document.documentElement.classList.remove("lang-my");
    }
  }, [lang]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    return getTranslation(lang, key, params);
  };

  const dict = translations[lang] || translations.en;

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
