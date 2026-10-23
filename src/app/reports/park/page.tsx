'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { 
  Car,
  Ticket,
  Users,
  LogOut,
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  RefreshCw,
  Clock,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';

function ParkReportsContent() {
  const [user, setUser] = useState<any>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filter, setFilter] = useState('0');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
  }, []);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [rows, setRows] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ entry: 0, onetime: 0, regular: 0, exit: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        filter,
        search,
        page: page.toString(),
        limit: limit.toString()
      });

      const res = await fetch(`/api/reports/park?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRows(data.rows || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Error loading park movements:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, filter, search, page, limit]);

  useEffect(() => {
    async function initUser() {
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const u = await userRes.json();
        setUser(u.user);
      }
    }
    initUser();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePreset = (type: string) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (type === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (type === 'yesterday') {
      const y = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setStartDate(y);
      setEndDate(y);
    } else if (type === '7days') {
      const d7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setStartDate(d7);
      setEndDate(today);
    } else if (type === '30days') {
      const d30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setStartDate(d30);
      setEndDate(today);
    } else if (type === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(startOfMonth);
      setEndDate(today);
    }
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(val || 0);
  };

  const formatNumber = (val: number) => {
    return (val || 0).toLocaleString();
  };

  return (
    <div className="app-container">
      <Sidebar user={user} />

      <main className="app-main">
        <Navbar 
          title="Park Movement Reports" 
          subtitle="Vehicle entries, exits, active sessions and outstanding tickets" 
        />

        <div className="app-content">
          {/* Controls Glass Panel */}
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Quick Range:
                </span>
                <button onClick={() => handlePreset('today')} className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '0.78rem' }}>
                  Today
                </button>
                <button onClick={() => handlePreset('yesterday')} className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '0.78rem' }}>
                  Yesterday
                </button>
                <button onClick={() => handlePreset('7days')} className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '0.78rem' }}>
                  Last 7 Days
                </button>
                <button onClick={() => handlePreset('30days')} className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '0.78rem' }}>
                  Last 30 Days
                </button>
                <button onClick={() => handlePreset('month')} className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '0.78rem' }}>
                  This Month
                </button>
              </div>

              <div>
                <button 
                  onClick={() => fetchData()} 
                  className="btn btn-secondary"
                  title="Refresh vehicle movements"
                >
                  <RefreshCw size={15} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  End Date
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Movement Filter
                </label>
                <select
                  className="form-select"
                  value={filter}
                  onChange={(e) => { setFilter(e.target.value); setPage(1); }}
                >
                  <option value="0">All Vehicle Movements</option>
                  <option value="1">Entries Only (Check-Ins)</option>
                  <option value="2">Exits Only (Check-Outs)</option>
                  <option value="3">Outstanding Tickets (In-Park)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Ticket / Access Search
                </label>
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search Ticket No..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <button type="submit" className="btn btn-secondary" style={{ padding: '0 12px' }}>
                    <Search size={16} />
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Primary Park Movement KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Total Entries
                </span>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Car size={18} color="var(--accent-primary)" />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
                {formatNumber(stats.entry)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Vehicle Check-ins
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  One-Time Tickets
                </span>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ticket size={18} color="var(--accent-emerald)" />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                {formatNumber(stats.onetime)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Barcode tickets
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Subscribers / Regular
                </span>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} color="var(--accent-cyan)" />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                {formatNumber(stats.regular)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Cards & Tag accounts
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Vehicle Exits
                </span>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LogOut size={18} color="var(--accent-amber)" />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                {formatNumber(stats.exit)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Vehicle Check-outs
              </span>
            </div>
          </div>

          {/* Table Glass Panel */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Showing <strong>{rows.length > 0 ? (page - 1) * limit + 1 : 0}</strong> - <strong>{Math.min(page * limit, total)}</strong> of <strong>{formatNumber(total)}</strong> movements
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Per page:</span>
                <select
                  className="form-select"
                  style={{ width: '80px', padding: '6px 10px', fontSize: '0.78rem' }}
                  value={limit}
                  onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1); }}
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <Loader2 size={32} className="animate-spin" color="var(--accent-primary)" />
                <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Loading vehicle movement records...
                </p>
              </div>
            ) : rows.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>No vehicle movements found matching the selected range and filters.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ticket / Access ID</th>
                      <th>Transit Type</th>
                      <th>Operation</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Time Spent</th>
                      <th>Pay Method</th>
                      <th style={{ textAlign: 'right' }}>Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                          {row.ticket || '-'}
                        </td>
                        <td>
                          <span className={`badge ${row.type === 'one-time' ? 'badge-blue' : 'badge-green'}`}>
                            {row.type || 'Regular'}
                          </span>
                        </td>
                        <td>
                          {row.operation === 'in' ? (
                            <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <ArrowDownRight size={12} /> ENTRY
                            </span>
                          ) : (
                            <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <ArrowUpRight size={12} /> EXIT
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: '#fff' }}>
                          {row.timein || '-'}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: row.timeout ? 'var(--text-muted)' : 'var(--accent-amber)' }}>
                          {row.timeout || 'Active / In-Park'}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {row.timespent || '-'}
                        </td>
                        <td>
                          <span className={`badge ${row.paytype === 'Cash' ? 'badge-green' : row.paytype === 'POS' ? 'badge-cyan' : 'badge-gray'}`}>
                            {row.paytype}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#fff' }}>
                          {formatCurrency(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Page {page} of {totalPages}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ParkReportsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <Loader2 size={32} className="animate-spin" color="var(--accent-primary)" />
      </div>
    }>
      <ParkReportsContent />
    </Suspense>
  );
}
