import React, { useState, useEffect } from 'react';
import { getGeneralSettings, updateGeneralSettings } from '../services/settingsService';
import { useLanguage } from '../../../i18n/LanguageContext';
import { applyFontSize } from '../../../utils/fontSizeUtils';
import SettingToggle from './common/SettingToggle';
import SettingSelect from './common/SettingSelect';

const GeneralSettings = () => {
  const { t, changeLanguage, language: currentLang } = useLanguage();
  const [settings, setSettings] = useState({
    language: 'en',
    timezone: 'UTC',
    autoDownloadMedia: true,
    saveToGallery: false,
    fontSize: 'medium'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getGeneralSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError('Failed to load settings');
      console.error('Error loading general settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key) => {
    const oldValue = settings[key];
    const newValue = !oldValue;
    
    // Optimistic update
    setSettings(prev => ({ ...prev, [key]: newValue }));
    
    try {
      await updateGeneralSettings({ [key]: newValue });
      setError(null);
    } catch (err) {
      // Rollback on error
      setSettings(prev => ({ ...prev, [key]: oldValue }));
      setError(`Failed to update ${key}`);
      console.error('Error updating setting:', err);
    }
  };

  const handleSelectChange = async (key, value) => {
    const oldValue = settings[key];
    
    // Optimistic update
    setSettings(prev => ({ ...prev, [key]: value }));
    
    try {
      await updateGeneralSettings({ [key]: value });
      
      // If language changed, update app language immediately
      if (key === 'language') {
        changeLanguage(value);
      }
      
      // If font size changed, apply it immediately
      if (key === 'fontSize') {
        applyFontSize(value);
      }
      
      setError(null);
    } catch (err) {
      // Rollback on error
      setSettings(prev => ({ ...prev, [key]: oldValue }));
      setError(`Failed to update ${key}`);
      console.error('Error updating setting:', err);
    }
  };

  if (loading) {
    return <div className="settings-loading">{t('loading')}</div>;
  }

  return (
    <div className="settings-section">
      <h3>{t('generalSettings')}</h3>
      {error && <div className="settings-error">{error}</div>}
      
      <div className="settings-group">
        <h4>{t('language')} & Region</h4>
        <SettingSelect
          label={t('language')}
          description={t('languageDesc')}
          value={settings.language}
          options={[
            { value: 'en', label: 'English' },
            { value: 'vi', label: 'Tiếng Việt' },
            { value: 'zh', label: '中文' }
          ]}
          onChange={(value) => handleSelectChange('language', value)}
        />
        
        <SettingSelect
          label={t('timezone')}
          description={t('timezoneDesc')}
          value={settings.timezone}
          options={[
            { value: 'UTC', label: 'UTC' },
            { value: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh (GMT+7)' },
            { value: 'Asia/Shanghai', label: 'Shanghai (GMT+8)' },
            { value: 'America/New_York', label: 'New York (GMT-5)' }
          ]}
          onChange={(value) => handleSelectChange('timezone', value)}
        />
      </div>

      <div className="settings-group">
        <h4>Media</h4>
        <SettingToggle
          label={t('autoDownloadMedia')}
          description={t('autoDownloadMediaDesc')}
          checked={settings.autoDownloadMedia}
          onChange={() => handleToggle('autoDownloadMedia')}
        />
        <SettingToggle
          label={t('saveToGallery')}
          description={t('saveToGalleryDesc')}
          checked={settings.saveToGallery}
          onChange={() => handleToggle('saveToGallery')}
        />
      </div>

      <div className="settings-group">
        <h4>Display</h4>
        <SettingSelect
          label={t('fontSize')}
          description={t('fontSizeDesc')}
          value={settings.fontSize}
          options={[
            { value: 'small', label: t('small') },
            { value: 'medium', label: t('medium') },
            { value: 'large', label: t('large') }
          ]}
          onChange={(value) => handleSelectChange('fontSize', value)}
        />
        
        {/* Preview text để xem trước font size */}
        <div style={{ 
          marginTop: '16px', 
          padding: '16px', 
          backgroundColor: 'var(--bg-secondary)', 
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ 
            fontSize: 'var(--font-size-sm)', 
            color: 'var(--text-secondary)',
            marginBottom: '8px' 
          }}>
            Preview / Xem trước:
          </div>
          <div style={{ fontSize: 'var(--font-size-base)', marginBottom: '8px' }}>
            This is how regular text will look. / Đây là cách text thường sẽ hiển thị.
          </div>
          <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '500' }}>
            This is larger text for headings. / Đây là text lớn hơn cho tiêu đề.
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
