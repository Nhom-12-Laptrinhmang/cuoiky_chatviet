import React, { useState, useEffect } from 'react';
import { getCallSettings, updateCallSettings } from '../services/settingsService';
import { useLanguage } from '../../../i18n/LanguageContext';
import SettingToggle from './common/SettingToggle';
import SettingSelect from './common/SettingSelect';

const CallSettings = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({
    videoEnabled: true,
    audioEnabled: true,
    lowDataMode: false,
    callWaiting: true,
    speakerphone: false,
    videoQuality: 'auto',
    microphoneDevice: 'default',
    cameraDevice: 'default',
    speakerDevice: 'default'
  });
  const [devices, setDevices] = useState({
    microphones: [],
    cameras: [],
    speakers: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSettings();
    loadDevices();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getCallSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError('Failed to load call settings');
      console.error('Error loading call settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDevices = async () => {
    try {
      // Get available media devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        microphones: devices.filter(d => d.kind === 'audioinput').map(d => ({
          value: d.deviceId,
          label: d.label || `Microphone ${d.deviceId.slice(0, 8)}`
        })),
        cameras: devices.filter(d => d.kind === 'videoinput').map(d => ({
          value: d.deviceId,
          label: d.label || `Camera ${d.deviceId.slice(0, 8)}`
        })),
        speakers: devices.filter(d => d.kind === 'audiooutput').map(d => ({
          value: d.deviceId,
          label: d.label || `Speaker ${d.deviceId.slice(0, 8)}`
        }))
      });
    } catch (err) {
      console.error('Error loading devices:', err);
    }
  };

  const handleToggle = async (key) => {
    const oldValue = settings[key];
    const newValue = !oldValue;
    
    // Optimistic update
    setSettings(prev => ({ ...prev, [key]: newValue }));
    
    try {
      await updateCallSettings({ [key]: newValue });
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
      await updateCallSettings({ [key]: value });
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
      <h3>{t('callSettings')}</h3>
      {error && <div className="settings-error">{error}</div>}
      
      <div className="settings-group">
        <h4>CALL PREFERENCES</h4>
        <SettingToggle
          label={t('videoByDefault')}
          description={t('videoByDefaultDesc')}
          checked={settings.videoEnabled}
          onChange={() => handleToggle('videoEnabled')}
        />
        <SettingToggle
          label="Enable audio calls"
          description="Allow audio calling functionality"
          checked={settings.audioEnabled}
          onChange={() => handleToggle('audioEnabled')}
        />
        <SettingToggle
          label={t('dataSaving')}
          description={t('dataSavingDesc')}
          checked={settings.lowDataMode}
          onChange={() => handleToggle('lowDataMode')}
        />
        <SettingToggle
          label={t('callWaiting')}
          description={t('callWaitingDesc')}
          checked={settings.callWaiting}
          onChange={() => handleToggle('callWaiting')}
        />
      </div>

      {settings.videoEnabled && (
        <div className="settings-group">
          <h4>VIDEO SETTINGS</h4>
          <SettingSelect
            label={t('videoQuality')}
            description={t('videoQualityDesc')}
            value={settings.videoQuality}
            options={[
              { value: 'auto', label: t('auto') },
              { value: 'high', label: 'High (720p)' },
              { value: 'medium', label: t('medium') + ' (480p)' },
              { value: 'low', label: 'Low (360p)' }
            ]}
            onChange={(value) => handleSelectChange('videoQuality', value)}
          />
          {devices.cameras.length > 0 && (
            <SettingSelect
              label={t('camera')}
              value={settings.cameraDevice}
              options={[
                { value: 'default', label: t('default') + ' Camera' },
                ...devices.cameras
              ]}
              onChange={(value) => handleSelectChange('cameraDevice', value)}
            />
          )}
        </div>
      )}

      <div className="settings-group">
        <h4>AUDIO SETTINGS</h4>
        {devices.microphones.length > 0 && (
          <SettingSelect
            label={t('audioInput')}
            description={t('audioInputDesc')}
            value={settings.microphoneDevice}
            options={[
              { value: 'default', label: t('default') + ' Microphone' },
              ...devices.microphones
            ]}
            onChange={(value) => handleSelectChange('microphoneDevice', value)}
          />
        )}
        {devices.speakers.length > 0 && (
          <SettingSelect
            label={t('audioOutput')}
            description={t('audioOutputDesc')}
            value={settings.speakerDevice}
            options={[
              { value: 'default', label: t('default') + ' Speaker' },
              ...devices.speakers
            ]}
            onChange={(value) => handleSelectChange('speakerDevice', value)}
          />
        )}
      </div>
    </div>
  );
};

export default CallSettings;
