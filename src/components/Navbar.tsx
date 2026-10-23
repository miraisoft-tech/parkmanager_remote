'use client';

import React from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  title?: string;
  subtitle?: string;
}

export default function Navbar({ title = 'Overview', subtitle = 'Remote Management & Analytics' }: NavbarProps) {
  return (
    <header className="app-header">
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          color: '#a5b4fc',
          fontWeight: 600
        }}>
          <RefreshCw size={12} className="animate-spin" />
          <span>Daily Sync: 23:55</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          color: '#34d399',
          fontWeight: 600
        }}>
          <ShieldCheck size={14} />
          <span>Encrypted Remote Connection</span>
        </div>
      </div>
    </header>
  );
}
