import { useState } from 'react';
import { Card, Table, Avatar, Badge, Button, Modal, Input, Tooltip } from '@sqlite-bundle/ui';
import { formatRelative, capitalize, randomInt } from '@sqlite-bundle/utils';

const generateUsers = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: ['admin', 'editor', 'viewer'][randomInt(0, 2)] as 'admin' | 'editor' | 'viewer',
    lastActive: new Date(Date.now() - randomInt(0, 7) * 86400000),
  }));

const mockUsers = generateUsers(50);

export function Users() {
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="users-page">
      <Card 
        title="User Management" 
        description={`${mockUsers.length} users total`}
      >
        <div className="users-header">
          <Input placeholder="Search users..." />
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Add User
          </Button>
        </div>

        <Table
          columns={[
            { 
              key: 'name', 
              header: 'User',
              render: (_, row) => (
                <div className="user-cell">
                  <Avatar fallback={row.name.slice(0, 2).toUpperCase()} size="sm" />
                  <div>
                    <span className="user-name">{row.name}</span>
                    <span className="user-email">{row.email}</span>
                  </div>
                </div>
              )
            },
            { 
              key: 'role', 
              header: 'Role',
              render: (v) => {
                const variant = v === 'admin' ? 'error' : v === 'editor' ? 'info' : 'default';
                return <Badge variant={variant}>{capitalize(String(v))}</Badge>;
              }
            },
            { 
              key: 'lastActive', 
              header: 'Last Active',
              render: (v) => (
                <Tooltip content={new Date(v as Date).toLocaleString()}>
                  <span>{formatRelative(v as Date)}</span>
                </Tooltip>
              )
            },
            {
              key: 'id',
              header: 'Actions',
              render: (_, row) => (
                <div className="action-buttons">
                  <Button variant="outline" size="sm" onClick={() => setSelectedUser(row)}>
                    Edit
                  </Button>
                </div>
              )
            },
          ]}
          data={mockUsers.slice(0, 10)}
        />
      </Card>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add New User"
      >
        <form className="user-form">
          <Input label="Name" placeholder="Enter name" />
          <Input label="Email" type="email" placeholder="Enter email" />
          <div className="form-buttons">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary">Create User</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
