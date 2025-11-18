// Language Context - Provides translations throughout the app
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTranslations } from './translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Load from localStorage or Settings
    const settingsGeneral = localStorage.getItem('settings_general');
    if (settingsGeneral) {
      try {
        const settings = JSON.parse(settingsGeneral);
        return settings.language || 'en';
      } catch (e) {
        return 'en';
      }
    }
    return 'en';
  });

  const [translations, setTranslations] = useState(() => getTranslations(language));

  // Update translations when language changes
  useEffect(() => {
    setTranslations(getTranslations(language));
    console.log('🌐 Language changed to:', language);
  }, [language]);

  // Listen for language changes from Settings
  useEffect(() => {
    const handleStorageChange = () => {
      const settingsGeneral = localStorage.getItem('settings_general');
      if (settingsGeneral) {
        try {
          const settings = JSON.parse(settingsGeneral);
          if (settings.language && settings.language !== language) {
            setLanguage(settings.language);
          }
        } catch (e) {
          console.error('Error parsing settings:', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Poll for changes (since storage event doesn't fire in same tab)
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [language]);

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    // Update settings
    const settingsGeneral = localStorage.getItem('settings_general');
    let settings = { language: 'en' };
    if (settingsGeneral) {
      try {
        settings = JSON.parse(settingsGeneral);
      } catch (e) {}
    }
    settings.language = newLang;
    localStorage.setItem('settings_general', JSON.stringify(settings));
  };

  const t = (key) => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, translations }}>
      {children}
    </LanguageContext.Provider>
  );
};
