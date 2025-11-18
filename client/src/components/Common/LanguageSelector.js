// Language Selector Component - Compact dropdown for changing language
import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

const LanguageSelector = ({ compact = false }) => {
  const { language, changeLanguage } = useLanguage();

  const languages = [
    { code: 'en', flag: '🇺🇸', name: 'English' },
    { code: 'vi', flag: '🇻🇳', name: 'Tiếng Việt' },
    { code: 'zh', flag: '🇨🇳', name: '中文' }
  ];

  if (compact) {
    return (
      <select
        value={language}
        onChange={(e) => changeLanguage(e.target.value)}
        style={{
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid #ddd',
          background: 'white',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        {languages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '8px',
      background: '#f5f5f5',
      borderRadius: '8px'
    }}>
      {languages.map(lang => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            background: language === lang.code ? '#007bff' : 'white',
            color: language === lang.code ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: language === lang.code ? '600' : '400',
            transition: 'all 0.2s'
          }}
        >
          {lang.flag} {lang.name}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;
