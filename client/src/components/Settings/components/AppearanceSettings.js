import React, { useState, useEffect } from 'react';
import { getAppearanceSettings, updateAppearanceSettings } from '../services/settingsService';
import { useLanguage } from '../../../i18n/LanguageContext';
import SettingToggle from './common/SettingToggle';
import SettingSelect from './common/SettingSelect';

const AppearanceSettings = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({
    theme: 'auto',
    chatWallpaper: 'default',
    bubbleStyle: 'rounded',
    showAvatars: true,
    compactMode: false,
    animationsEnabled: true,
    emojiSize: 'medium'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getAppearanceSettings();
      setSettings(data);
      setError(null);
      
      // Apply theme immediately
      applyTheme(data.theme);
    } catch (err) {
      setError('Failed to load appearance settings');
      console.error('Error loading appearance settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (theme) => {
    const root = document.documentElement;
    const body = document.body;
    
    // Remove both classes first
    root.classList.remove('dark-theme', 'light-theme');
    body.classList.remove('dark-theme', 'light-theme');
    
    if (theme === 'dark') {
      root.classList.add('dark-theme');
      body.classList.add('dark-theme');
    } else if (theme === 'light') {
      root.classList.add('light-theme');
      body.classList.add('light-theme');
    } else {
      // Auto - use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark-theme');
        body.classList.add('dark-theme');
      } else {
        root.classList.add('light-theme');
        body.classList.add('light-theme');
      }
    }
  };

  const handleToggle = async (key) => {
    const oldValue = settings[key];
    const newValue = !oldValue;
    
    // Optimistic update
    setSettings(prev => ({ ...prev, [key]: newValue }));
    
    try {
      await updateAppearanceSettings({ [key]: newValue });
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
    
    // Apply theme change immediately
    if (key === 'theme') {
      applyTheme(value);
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: value } }));
    }
    
    try {
      await updateAppearanceSettings({ [key]: value });
      setError(null);
    } catch (err) {
      // Rollback on error
      setSettings(prev => ({ ...prev, [key]: oldValue }));
      if (key === 'theme') {
        applyTheme(oldValue);
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: oldValue } }));
      }
      setError(`Failed to update ${key}`);
      console.error('Error updating setting:', err);
    }
  };

  if (loading) {
    return <div className="settings-loading">{t('loading')}...</div>;
  }

  return (
    <div className="settings-section">
      <h3>{t('appearanceSettings').toUpperCase()}</h3>
      {error && <div className="settings-error">{error}</div>}
      
      <div className="settings-group">
        <h4>{t('theme').toUpperCase()}</h4>
        <SettingSelect
          label={t('darkMode')}
          description={t('darkModeDesc')}
          value={settings.theme}
          options={[
            { value: 'auto', label: t('auto') + ' (System)' },
            { value: 'light', label: t('light') },
            { value: 'dark', label: t('dark') }
          ]}
          onChange={(value) => handleSelectChange('theme', value)}
        />
        <div className="theme-preview">
          {settings.theme === 'light' && <div className="preview-light">☀️ {t('light')} {t('theme')}</div>}
          {settings.theme === 'dark' && <div className="preview-dark">🌙 {t('dark')} {t('theme')}</div>}
          {settings.theme === 'auto' && <div className="preview-auto">🔄 {t('auto')} (follows system)</div>}
        </div>
      </div>

      <div className="settings-group">
        <h4>CHAT APPEARANCE</h4>
        <SettingSelect
          label={t('chatWallpaper')}
          description={t('chatWallpaperDesc')}
          value={settings.chatWallpaper}
          options={[
            { value: 'default', label: t('default') },
            { value: 'none', label: t('none') },
            { value: 'gradient1', label: 'Gradient Blue' },
            { value: 'gradient2', label: 'Gradient Purple' },
            { value: 'pattern1', label: 'Pattern 1' },
            { value: 'pattern2', label: 'Pattern 2' }
          ]}
          onChange={(value) => handleSelectChange('chatWallpaper', value)}
        />
        <SettingSelect
          label={t('bubbleStyle')}
          description={t('bubbleStyleDesc')}
          value={settings.bubbleStyle}
          options={[
            { value: 'rounded', label: 'Rounded' },
            { value: 'squared', label: 'Squared' },
            { value: 'minimal', label: 'Minimal' }
          ]}
          onChange={(value) => handleSelectChange('bubbleStyle', value)}
        />
      </div>

      <div className="settings-group">
        <h4>DISPLAY OPTIONS</h4>
        <SettingToggle
          label="Show avatars in chat"
          description="Display profile pictures in conversations"
          checked={settings.showAvatars}
          onChange={() => handleToggle('showAvatars')}
        />
        <SettingToggle
          label={t('compactMode')}
          description={t('compactModeDesc')}
          checked={settings.compactMode}
          onChange={() => handleToggle('compactMode')}
        />
        <SettingToggle
          label="Enable animations"
          description="Show smooth transitions and animations"
          checked={settings.animationsEnabled}
          onChange={() => handleToggle('animationsEnabled')}
        />
      </div>

      <div className="settings-group">
        <h4>EMOJI & STICKERS</h4>
        <SettingSelect
          label="Emoji size"
          value={settings.emojiSize}
          options={[
            { value: 'small', label: t('small') },
            { value: 'medium', label: t('medium') },
            { value: 'large', label: t('large') }
          ]}
          onChange={(value) => handleSelectChange('emojiSize', value)}
        />
      </div>
    </div>
  );
};

export default AppearanceSettings;
