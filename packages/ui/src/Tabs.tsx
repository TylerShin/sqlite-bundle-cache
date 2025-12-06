import React, { useState } from 'react';
import { cn } from '@sqlite-bundle/utils';

export interface TabsProps {
  tabs: { id: string; label: string; content: React.ReactNode }[];
  defaultTab?: string;
  className?: string;
}

export function Tabs({ tabs, defaultTab, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  return (
    <div className={cn('tabs', className)}>
      <div className="tabs-list">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={cn('tab-trigger', activeTab === tab.id && 'tab-active')}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}
