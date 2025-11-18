import React, { useState, useEffect } from 'react';
import { getNotificationSettings, updateNotificationSettings } from '../services/settingsService';
import { useLanguage } from '../../../i18n/LanguageContext';
import SettingToggle from './common/SettingToggle';
import SettingSelect from './common/SettingSelect';

const NotificationSettings = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({
    messageNotifications: true,
    messageSound: true,
    messageVibrate: true,
    groupNotifications: true,
    groupSound: true,
    callNotifications: true,
    callRingtone: 'default',
    showPreview: true,
    notificationLight: true,
    // Toast notification settings
    toastEnabled: true,
    toastPosition: 'bottom-right',
    toastDuration: 7000,
    toastSound: true,
    toastMaxCount: 5
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getNotificationSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError('Failed to load notification settings');
      console.error('Error loading notification settings:', err);
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
      await updateNotificationSettings({ [key]: newValue });
      setError(null);
      
      // Trigger custom event để notify components khác trong cùng tab
      window.dispatchEvent(new CustomEvent('settingsChanged', { 
        detail: { category: 'notifications', key, value: newValue } 
      }));
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
      await updateNotificationSettings({ [key]: value });
      setError(null);
      
      // Trigger custom event để notify components khác trong cùng tab
      window.dispatchEvent(new CustomEvent('settingsChanged', { 
        detail: { category: 'notifications', key, value } 
      }));
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
      <h3>{t('notificationSettings')}</h3>
      {error && <div className="settings-error">{error}</div>}
      
      <div className="settings-group">
        <h4>{t('messageNotifications').toUpperCase()}</h4>
        <SettingToggle
          label={t('messageNotifications')}
          description={t('messageNotificationsDesc')}
          checked={settings.messageNotifications}
          onChange={() => handleToggle('messageNotifications')}
        />
        {settings.messageNotifications && (
          <>
            <SettingToggle
              label={t('soundEnabled')}
              description={t('soundEnabledDesc')}
              checked={settings.messageSound}
              onChange={() => handleToggle('messageSound')}
            />
            <SettingToggle
              label={t('vibrationEnabled')}
              description={t('vibrationEnabledDesc')}
              checked={settings.messageVibrate}
              onChange={() => handleToggle('messageVibrate')}
            />
            <SettingToggle
              label={t('notificationPreview')}
              description={t('notificationPreviewDesc')}
              checked={settings.showPreview}
              onChange={() => handleToggle('showPreview')}
            />
          </>
        )}
      </div>

      <div className="settings-group">
        <h4>{t('groupNotifications').toUpperCase()}</h4>
        <SettingToggle
          label={t('groupNotifications')}
          description={t('groupNotificationsDesc')}
          checked={settings.groupNotifications}
          onChange={() => handleToggle('groupNotifications')}
        />
        {settings.groupNotifications && (
          <SettingToggle
            label={t('soundEnabled')}
            description={t('soundEnabledDesc')}
            checked={settings.groupSound}
            onChange={() => handleToggle('groupSound')}
          />
        )}
      </div>

      <div className="settings-group">
        <h4>{t('toastNotifications') || 'THÔNG BÁO POPUP'}</h4>
        <p className="settings-description">
          {t('toastNotificationsDesc') || 'Thông báo tin nhắn mới xuất hiện dưới dạng popup ở góc màn hình'}
        </p>
        
        <SettingToggle
          label={t('enableToastNotifications') || 'Bật thông báo popup'}
          description={t('enableToastNotificationsDesc') || 'Hiển thị thông báo tin nhắn dưới dạng popup'}
          checked={settings.toastEnabled}
          onChange={() => handleToggle('toastEnabled')}
        />
        
        {settings.toastEnabled && (
          <>
            <SettingSelect
              label={t('toastPosition') || 'Vị trí hiển thị'}
              description={t('toastPositionDesc') || 'Chọn vị trí hiển thị popup thông báo'}
              value={settings.toastPosition}
              options={[
                { value: 'bottom-right', label: t('bottomRight') || 'Góc dưới bên phải' },
                { value: 'bottom-left', label: t('bottomLeft') || 'Góc dưới bên trái' },
                { value: 'top-right', label: t('topRight') || 'Góc trên bên phải' },
                { value: 'top-left', label: t('topLeft') || 'Góc trên bên trái' }
              ]}
              onChange={(value) => handleSelectChange('toastPosition', value)}
            />
            
            <SettingSelect
              label={t('toastDuration') || 'Thời gian hiển thị'}
              description={t('toastDurationDesc') || 'Thời gian popup tự động biến mất'}
              value={settings.toastDuration}
              options={[
                { value: 3000, label: '3 ' + (t('seconds') || 'giây') },
                { value: 5000, label: '5 ' + (t('seconds') || 'giây') },
                { value: 7000, label: '7 ' + (t('seconds') || 'giây') + ' (' + (t('default') || 'mặc định') + ')' },
                { value: 10000, label: '10 ' + (t('seconds') || 'giây') },
                { value: 0, label: t('manual') || 'Đóng thủ công' }
              ]}
              onChange={(value) => handleSelectChange('toastDuration', parseInt(value))}
            />
            
            <SettingToggle
              label={t('toastSound') || 'Âm thanh thông báo'}
              description={t('toastSoundDesc') || 'Phát âm thanh khi có thông báo mới'}
              checked={settings.toastSound}
              onChange={() => handleToggle('toastSound')}
            />
            
            <SettingSelect
              label={t('maxToastCount') || 'Số lượng popup tối đa'}
              description={t('maxToastCountDesc') || 'Giới hạn số popup hiển thị cùng lúc'}
              value={settings.toastMaxCount}
              options={[
                { value: 3, label: '3 ' + (t('notifications') || 'thông báo') },
                { value: 5, label: '5 ' + (t('notifications') || 'thông báo') + ' (' + (t('default') || 'mặc định') + ')' },
                { value: 7, label: '7 ' + (t('notifications') || 'thông báo') },
                { value: 10, label: '10 ' + (t('notifications') || 'thông báo') }
              ]}
              onChange={(value) => handleSelectChange('toastMaxCount', parseInt(value))}
            />
          </>
        )}
      </div>

      <div className="settings-group">
        <h4>{t('callNotifications').toUpperCase()}</h4>
        <SettingToggle
          label={t('callNotifications')}
          description={t('callNotificationsDesc')}
          checked={settings.callNotifications}
          onChange={() => handleToggle('callNotifications')}
        />
        {settings.callNotifications && (
          <SettingSelect
            label="Ringtone"
            value={settings.callRingtone}
            options={[
              { value: 'default', label: t('default') },
              { value: 'classic', label: 'Classic' },
              { value: 'modern', label: 'Modern' },
              { value: 'silent', label: 'Silent' }
            ]}
            onChange={(value) => handleSelectChange('callRingtone', value)}
          />
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;
