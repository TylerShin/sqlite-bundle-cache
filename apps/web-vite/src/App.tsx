import { useState } from 'react';
import { Button, Card, Input, Modal } from '@sqlite-bundle/ui';
import { formatDate, capitalize, truncate } from '@sqlite-bundle/utils';

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="app">
      <header className="header">
        <h1>SQLite Bundle PoC - Vite</h1>
        <p>Built with Vite + SQLite Cache experiment</p>
      </header>

      <main className="main">
        <Card title="Date Utility Demo" description="Using @sqlite-bundle/utils">
          <p>Today: {formatDate(new Date())}</p>
        </Card>

        <Card title="String Utility Demo">
          <p>Capitalized: {capitalize('hello world')}</p>
          <p>Truncated: {truncate('This is a very long text that should be truncated', 30)}</p>
        </Card>

        <Card title="UI Components">
          <Input
            label="Enter something"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type here..."
          />
          <div className="button-group">
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              Open Modal
            </Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
          </div>
        </Card>
      </main>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Hello from Modal"
      >
        <p>You entered: {inputValue || '(nothing yet)'}</p>
      </Modal>
    </div>
  );
}

export default App;
