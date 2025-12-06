import { useState } from 'react';
import {
  Button, Card, Input, Modal, Avatar, Badge, Checkbox,
  Dropdown, Tabs, Toast, Tooltip, Dialog, Accordion, Table, Pagination
} from '@sqlite-bundle/ui';
import {
  formatDate, formatRelative, capitalize, truncate, slugify,
  debounce, cn, clamp, randomInt, formatNumber,
  isEmail, isEmpty, deepClone, chunk, unique
} from '@sqlite-bundle/utils';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { Users } from './pages/Users';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showToast, setShowToast] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', content: <Dashboard /> },
    { id: 'users', label: 'Users', content: <Users /> },
    { id: 'settings', label: 'Settings', content: <Settings /> },
  ];

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1>SQLite Bundle PoC - Vite</h1>
          <Badge variant="success">v1.0.0</Badge>
        </div>
        <div className="header-right">
          <Tooltip content="View profile">
            <Avatar fallback="JD" size="md" />
          </Tooltip>
        </div>
      </header>

      <nav className="nav">
        <Tabs tabs={tabs} />
      </nav>

      <main className="main">
        {tabs.find(t => t.id === activeTab)?.content}
      </main>

      <footer className="footer">
        <p>Built on {formatDate(new Date())}</p>
        <Button variant="outline" size="sm" onClick={() => setShowToast(true)}>
          Show Toast
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setDialogOpen(true)}>
          Open Dialog
        </Button>
      </footer>

      {showToast && (
        <Toast 
          message="This is a notification!" 
          type="success" 
          onClose={() => setShowToast(false)} 
        />
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Example Dialog"
        description="This is a sample dialog component."
        footer={
          <div className="dialog-buttons">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setDialogOpen(false)}>Confirm</Button>
          </div>
        }
      >
        <p>Dialog content goes here.</p>
      </Dialog>
    </div>
  );
}

export default App;
