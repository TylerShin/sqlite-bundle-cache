import { useState } from 'react';
import { Card, Input, Checkbox, Button, Accordion, Dropdown } from '@sqlite-bundle/ui';

export function Settings() {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: true,
    autoSave: false,
    language: 'en',
  });

  const accordionItems = [
    {
      id: 'general',
      title: 'General Settings',
      content: (
        <div className="settings-group">
          <Input label="Display Name" placeholder="Enter name" />
          <Input label="Email" type="email" placeholder="Enter email" />
          <Dropdown
            trigger={<Button variant="outline">Language: {settings.language.toUpperCase()}</Button>}
          >
            <button onClick={() => setSettings(s => ({ ...s, language: 'en' }))}>English</button>
            <button onClick={() => setSettings(s => ({ ...s, language: 'ko' }))}>한국어</button>
            <button onClick={() => setSettings(s => ({ ...s, language: 'ja' }))}>日本語</button>
          </Dropdown>
        </div>
      ),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      content: (
        <div className="settings-group">
          <Checkbox 
            label="Enable notifications"
            checked={settings.notifications}
            onChange={(e) => setSettings(s => ({ ...s, notifications: e.target.checked }))}
          />
          <Checkbox 
            label="Email notifications"
          />
          <Checkbox 
            label="Push notifications"
          />
        </div>
      ),
    },
    {
      id: 'appearance',
      title: 'Appearance',
      content: (
        <div className="settings-group">
          <Checkbox 
            label="Dark mode"
            checked={settings.darkMode}
            onChange={(e) => setSettings(s => ({ ...s, darkMode: e.target.checked }))}
          />
          <Checkbox 
            label="Compact view"
          />
        </div>
      ),
    },
    {
      id: 'advanced',
      title: 'Advanced',
      content: (
        <div className="settings-group">
          <Checkbox 
            label="Auto-save"
            checked={settings.autoSave}
            onChange={(e) => setSettings(s => ({ ...s, autoSave: e.target.checked }))}
          />
          <Button variant="outline">Clear Cache</Button>
          <Button variant="outline">Reset Settings</Button>
        </div>
      ),
    },
  ];

  return (
    <Card title="Settings">
      <Accordion items={accordionItems} allowMultiple />
      <div className="settings-footer">
        <Button variant="primary">Save Changes</Button>
      </div>
    </Card>
  );
}
