import { useState } from 'react';
import { Card, Table, Badge, Button, Input, Avatar, Pagination } from '@sqlite-bundle/ui';
import { formatDate, formatNumber, randomInt, chunk } from '@sqlite-bundle/utils';

// Generate mock data
const generateData = (count: number) => 
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    value: randomInt(100, 10000),
    status: ['active', 'pending', 'inactive'][randomInt(0, 2)] as 'active' | 'pending' | 'inactive',
    date: new Date(Date.now() - randomInt(0, 30) * 86400000),
  }));

const mockData = generateData(100);

export function Dashboard() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(mockData.length / pageSize);
  const currentData = mockData.slice((page - 1) * pageSize, page * pageSize);

  const stats = {
    total: mockData.length,
    active: mockData.filter(d => d.status === 'active').length,
    totalValue: mockData.reduce((sum, d) => sum + d.value, 0),
  };

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <Card title="Total Items">
          <span className="stat-value">{formatNumber(stats.total)}</span>
        </Card>
        <Card title="Active">
          <span className="stat-value">{formatNumber(stats.active)}</span>
        </Card>
        <Card title="Total Value">
          <span className="stat-value">${formatNumber(stats.totalValue)}</span>
        </Card>
      </div>

      <Card title="Data Table">
        <Table
          columns={[
            { key: 'id', header: 'ID' },
            { key: 'name', header: 'Name' },
            { key: 'value', header: 'Value', render: (v) => `$${formatNumber(v as number)}` },
            { 
              key: 'status', 
              header: 'Status',
              render: (v) => {
                const variant = v === 'active' ? 'success' : v === 'pending' ? 'warning' : 'default';
                return <Badge variant={variant}>{String(v)}</Badge>;
              }
            },
            { key: 'date', header: 'Date', render: (v) => formatDate(v as Date) },
          ]}
          data={currentData}
        />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}
