import React, { useState, useEffect } from 'react';
import GeneralSettings from './components/GeneralSettings';
import PrivacySettings from './components/PrivacySettings';
import SecuritySettings from './components/SecuritySettings';
import NotificationsSettings from './components/NotificationSettings';
import CallsSettings from './components/CallSettings';
import AppearanceSettings from './components/AppearanceSettings';
import { 
  getGeneralSettings, 
  getPrivacySettings, 
  getNotificationSettings, 
  getCallSettings, 
  getAppearanceSettings, 
  updateGeneralSettings, 
  updatePrivacySettings, 
  updateNotificationSettings, 
  updateCallSettings, 
  updateAppearanceSettings 
} from './services/settingsService';
import { useLanguage } from '../../i18n/LanguageContext';
import './styles/settings_new.css';

const SETTINGS_TABS = [
  { id: 'general', labelKey: 'general', icon: '⚙️' },
  { id: 'privacy', labelKey: 'privacy', icon: '🔒' },
  { id: 'security', labelKey: 'security', icon: '🛡️' },
  { id: 'notifications', labelKey: 'notifications', icon: '🔔' },
  { id: 'calls', labelKey: 'calls', icon: '📞' },
  { id: 'appearance', labelKey: 'appearance', icon: '🎨' }
];

const Settings = ({ onClose }) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingStates, setSavingStates] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Load all settings (security settings managed by SecuritySettings component)
      const [general, privacy, notifications, calls, appearance] = await Promise.all([
        getGeneralSettings(),
        getPrivacySettings(),
        getNotificationSettings(),
        getCallSettings(),
        getAppearanceSettings()
      ]);
      
      setSettings({
        general,
        privacy,
        notifications,
        calls,
        appearance
      });
      setError(null);
    } catch (err) {
      setError('Failed to load settings');
      console.error('Settings load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (category, key, value) => {
    const settingKey = `${category}.${key}`;
    
    // Optimistic UI update - cập nhật ngay lập tức
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    
    // Set saving state
    setSavingStates(prev => ({ ...prev, [settingKey]: 'saving' }));

    // Save to server
    try {
      // Call appropriate update function based on category
      const updateFunctions = {
        general: updateGeneralSettings,
        privacy: updatePrivacySettings,
        notifications: updateNotificationSettings,
        calls: updateCallSettings,
        appearance: updateAppearanceSettings
      };
      
      const updateFn = updateFunctions[category];
      if (updateFn) {
        await updateFn({ [key]: value });
      }
      
      setSavingStates(prev => ({ ...prev, [settingKey]: 'saved' }));
      
      // Clear saved indicator after 2 seconds
      setTimeout(() => {
        setSavingStates(prev => {
          const newStates = { ...prev };
          delete newStates[settingKey];
          return newStates;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to save setting:', err);
      setSavingStates(prev => ({ ...prev, [settingKey]: 'error' }));
      
      // Revert on error
      await loadSettings();
      
      if (window.showToast) {
        window.showToast('Lỗi', 'Không thể lưu cài đặt');
      }
      
      // Clear error indicator after 3 seconds
      setTimeout(() => {
        setSavingStates(prev => {
          const newStates = { ...prev };
          delete newStates[settingKey];
          return newStates;
        });
      }, 3000);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Bạn có chắc muốn đặt lại tất cả cài đặt về mặc định?')) {
      try {
        setLoading(true);
        // Reload settings as reset
        await loadSettings();
        if (window.showToast) {
          window.showToast('Thành công', 'Đã đặt lại cài đặt mặc định');
        }
      } catch (err) {
        console.error('Failed to reset settings:', err);
        if (window.showToast) {
          window.showToast('Lỗi', 'Không thể đặt lại cài đặt');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    // Check if any settings are currently being saved
    const isSaving = Object.values(savingStates).some(state => state === 'saving');
    if (isSaving) {
      if (window.confirm('Một số cài đặt đang được lưu. Bạn có chắc muốn đóng?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const renderActivePanel = () => {
    if (loading) {
      return <div className="settings-loading">{t('loading')}</div>;
    }

    if (error) {
      return (
        <div className="settings-error">
          <p>{error}</p>
          <button onClick={loadSettings}>{t('reset')}</button>
        </div>
      );
    }

    if (!settings) return null;

    const commonProps = {
      settings: settings[activeTab] || {},
      onChange: (key, value) => handleSettingChange(activeTab, key, value),
      savingStates: savingStates
    };

    switch (activeTab) {
      case 'general':
        return <GeneralSettings {...commonProps} />;
      case 'privacy':
        return <PrivacySettings {...commonProps} />;
      case 'security':
        return <SecuritySettings {...commonProps} />;
      case 'notifications':
        return <NotificationsSettings {...commonProps} />;
      case 'calls':
        return <CallsSettings {...commonProps} />;
      case 'appearance':
        return <AppearanceSettings {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="settings-modal">
      <div className="settings-overlay" onClick={handleClose}></div>
      <div className="settings-container">
        <div className="settings-header">
          <h2>{t('settings')}</h2>
          <button className="settings-close" onClick={handleClose}>✕</button>
        </div>
        
        <div className="settings-content">
          <div className="settings-sidebar">
            <nav className="settings-nav">
              {SETTINGS_TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="settings-nav-icon">{tab.icon}</span>
                  <span className="settings-nav-label">{t(tab.labelKey)}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="settings-main">
            {renderActivePanel()}
          </div>
        </div>

        <div className="settings-footer">
          <div className="settings-footer-left">
            {Object.keys(savingStates).length > 0 && (
              <div className="settings-status-indicators">
                {Object.entries(savingStates).map(([key, state]) => (
                  <span key={key} className={`settings-status-badge status-${state}`}>
                    {state === 'saving' && `⏳ ${t('saving')}`}
                    {state === 'saved' && `✓ ${t('saved')}`}
                    {state === 'error' && `✗ ${t('error')}`}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="settings-footer-actions">
            <button 
              className="settings-footer-btn btn-reset"
              onClick={handleReset}
              disabled={loading}
              title={t('reset')}
            >
              {t('reset')}
            </button>
            <button 
              className="settings-footer-btn btn-close"
              onClick={handleClose}
              disabled={loading}
            >
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
