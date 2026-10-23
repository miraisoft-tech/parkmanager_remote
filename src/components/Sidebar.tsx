'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Receipt, 
  LogOut, 
  Database,
  CircleCheck,
  Building2
} from 'lucide-react';

interface SidebarProps {
  user?: {
    name?: string;
    email?: string;
    role?: string;
  } | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navLinks = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard'
    },
    {
      href: '/reports/payments',
      label: 'Park & Payment Reports',
      icon: Receipt,
      active: pathname.startsWith('/reports/payments')
    }
  ];

  return (
    <aside className="app-sidebar">
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingLeft: '8px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'var(--gradient-brand)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <Building2 size={20} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            ParkManager
          </h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
            Management Portal
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px 6px' }}>
          Menu
        </div>
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                fontWeight: item.active ? 600 : 500,
                color: item.active ? '#fff' : 'var(--text-muted)',
                background: item.active ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                border: item.active ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={18} color={item.active ? '#818cf8' : 'var(--text-muted)'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Remote DB Status Badge */}
      <div style={{
        padding: '12px 14px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
          <Database size={14} color="var(--accent-cyan)" />
          <span>Remote Database</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
          <CircleCheck size={12} />
          <span>DB_REMOTE Active</span>
        </div>
      </div>

      {/* User info & Logout */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {user?.name || 'Administrator'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {user?.email || 'admin@vpms.com'}
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Sign Out"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fb7185')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
