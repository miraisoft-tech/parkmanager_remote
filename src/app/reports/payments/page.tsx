'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { 
  Download, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Wallet,
  Banknote,
  CreditCard,
  AlertTriangle
} from 'lucide-react';

function PaymentReportsContent() {
  const [user, setUser] = useState<any>(null);

  const [startDate, setStartDate] = useState(() => {
    const past30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return past30.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [category, setCategory] = useState('all');
  const [channel, setChannel] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!startDate || !endDate) return;
    try {
      const res = await fetch(
        `/api/reports/summary?start_date=${startDate}&end_date=${endDate}&category=${category}&channel=${channel}`
      );
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('Error loading summary:', err);
    }
  }, [startDate, endDate, category, channel]);

  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        category,
        channel,
        search,
        page: page.toString(),
        limit: limit.toString()
      });

      const res = await fetch(`/api/reports/payments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRows(data.rows || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, category, channel, search, page, limit]);

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
    fetchSummary();
  }, [fetchSummary]);

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

  const handleExport = () => {
    setExporting(true);
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      category,
      channel
    });

    window.location.href = `/api/reports/export?${params.toString()}`;
    setTimeout(() => setExporting(false), 2000);
  };

  return (
    <div className="app-container">
      <Sidebar user={user} />

      <main className="app-main">
        <Navbar 
          title="Park & Payment Reports" 
          subtitle="Unified payments, Lost/Expired tickets, Overnight, Subscribers & Streaming Export" 
        />

        <div className="app-content">
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Quick Presets:
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
                  onClick={handleExport}
                  disabled={exporting}
                  className="btn btn-success"
                  title="Stream full dataset directly from DB_REMOTE"
                >
                  {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  <span>Stream Large Dataset (CSV)</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Start Date
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    className="form-input"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  End Date
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    className="form-input"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Payment Category
                </label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                >
                  <option value="all">All Payment Categories</option>
                  <option value="payment">Payment (Regular Parking)</option>
                  <option value="overnight">Overnight Parking</option>
                  <option value="subscribers">Subscribers Payment</option>
                  <option value="lost_tickets">Lost Tickets</option>
                  <option value="expired_tickets">Expired Tickets</option>
                  <option value="no_tickets">No Tickets</option>
                  <option value="card_payments">Card Payment</option>
                  <option value="tag_payments">Tag Payment</option>
                  <option value="fines">Fines & Penalties (Lost/Expired/No-Ticket)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Payment Method
                </label>
                <select
                  className="form-select"
                  value={channel}
                  onChange={(e) => { setChannel(e.target.value); setPage(1); }}
                >
                  <option value="all">All Channels (Cash, POS, Online)</option>
                  <option value="0">Cash Only</option>
                  <option value="1">POS Only</option>
                  <option value="2">Online Only</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Search Receipt / Access ID / Cashier
                </label>
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search receipt..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <button type="submit" className="btn btn-secondary" style={{ padding: '0 14px' }}>
                    <Search size={16} />
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="kpi-grid">
            <div className="glass-panel kpi-card">
              <div className="kpi-label">
                <span>Selected Window Revenue</span>
                <Wallet size={16} color="var(--accent-primary)" />
              </div>
              <div className="kpi-value">{formatCurrency(summary?.total_amount)}</div>
              <div className="kpi-sub">{formatNumber(summary?.total_count)} transactions</div>
            </div>

            <div className="glass-panel kpi-card emerald">
              <div className="kpi-label">
                <span>Cash In</span>
                <Banknote size={16} color="var(--accent-emerald)" />
              </div>
              <div className="kpi-value">{formatCurrency(summary?.cash_amount)}</div>
              <div className="kpi-sub">Direct cash receipts</div>
            </div>

            <div className="glass-panel kpi-card cyan">
              <div className="kpi-label">
                <span>POS Transact</span>
                <CreditCard size={16} color="var(--accent-cyan)" />
              </div>
              <div className="kpi-value">{formatCurrency(summary?.pos_amount)}</div>
              <div className="kpi-sub">POS terminal transactions</div>
            </div>

            <div className="glass-panel kpi-card rose">
              <div className="kpi-label">
                <span>Fines & Penalties</span>
                <AlertTriangle size={16} color="var(--accent-rose)" />
              </div>
              <div className="kpi-value">{formatCurrency(summary?.categories?.fines?.amount)}</div>
              <div className="kpi-sub">{formatNumber(summary?.categories?.fines?.count)} lost/expired/no-tickets</div>
            </div>
          </div>

          <div className="category-grid" style={{ marginBottom: '24px' }}>
            <div 
              className={`category-card ${category === 'payment' ? 'active-filter' : ''}`}
              style={{ cursor: 'pointer', border: category === 'payment' ? '1px solid var(--accent-primary)' : undefined }}
              onClick={() => { setCategory(category === 'payment' ? 'all' : 'payment'); setPage(1); }}
              title="Click to filter by Payment"
            >
              <div className="cat-title">Payment (Regular)</div>
              <div className="cat-amount">{formatCurrency(summary?.categories?.payment?.amount || summary?.categories?.onetime?.amount)}</div>
              <div className="cat-count">{formatNumber(summary?.categories?.payment?.count || summary?.categories?.onetime?.count)} tickets</div>
            </div>

            <div 
              className={`category-card ${category === 'overnight' ? 'active-filter' : ''}`}
              style={{ cursor: 'pointer', border: category === 'overnight' ? '1px solid var(--accent-primary)' : undefined }}
              onClick={() => { setCategory(category === 'overnight' ? 'all' : 'overnight'); setPage(1); }}
              title="Click to filter by Overnight"
            >
              <div className="cat-title">Overnight Parking</div>
              <div className="cat-amount">{formatCurrency(summary?.categories?.overnight?.amount)}</div>
              <div className="cat-count">{formatNumber(summary?.categories?.overnight?.count)} tickets</div>
            </div>

            <div 
              className={`category-card ${category === 'subscribers' ? 'active-filter' : ''}`}
              style={{ cursor: 'pointer', border: category === 'subscribers' ? '1px solid var(--accent-primary)' : undefined }}
              onClick={() => { setCategory(category === 'subscribers' ? 'all' : 'subscribers'); setPage(1); }}
              title="Click to filter by Subscribers"
            >
              <div className="cat-title">Subscribers Payment</div>
              <div className="cat-amount">{formatCurrency(summary?.categories?.subscribers?.amount)}</div>
              <div className="cat-count">{formatNumber(summary?.categories?.subscribers?.count)} renewals</div>
            </div>

            <div 
              className={`category-card ${category === 'lost_tickets' ? 'active-filter' : ''}`}
              style={{ cursor: 'pointer', border: category === 'lost_tickets' ? '1px solid var(--accent-rose)' : undefined }}
              onClick={() => { setCategory(category === 'lost_tickets' ? 'all' : 'lost_tickets'); setPage(1); }}
              title="Click to filter by Lost Tickets"
            >
              <div className="cat-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Lost Tickets</span>
                <span className="badge badge-red" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>Fine</span>
              </div>
              <div className="cat-amount">{formatCurrency(summary?.categories?.lost_tickets?.amount)}</div>
              <div className="cat-count">{formatNumber(summary?.categories?.lost_tickets?.count)} tickets</div>
            </div>

            <div 
              className={`category-card ${category === 'expired_tickets' ? 'active-filter' : ''}`}
              style={{ cursor: 'pointer', border: category === 'expired_tickets' ? '1px solid var(--accent-rose)' : undefined }}
              onClick={() => { setCategory(category === 'expired_tickets' ? 'all' : 'expired_tickets'); setPage(1); }}
              title="Click to filter by Expired Tickets"
            >
              <div className="cat-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Expired Tickets</span>
                <span className="badge badge-red" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>Fine</span>
              </div>
              <div className="cat-amount">{formatCurrency(summary?.categories?.expired_tickets?.amount)}</div>
              <div className="cat-count">{formatNumber(summary?.categories?.expired_tickets?.count)} tickets</div>
            </div>

            <div 
              className={`category-card ${category === 'no_tickets' ? 'active-filter' : ''}`}
              style={{ cursor: 'pointer', border: category === 'no_tickets' ? '1px solid var(--accent-rose)' : undefined }}
              onClick={() => { setCategory(category === 'no_tickets' ? 'all' : 'no_tickets'); setPage(1); }}
              title="Click to filter by No Tickets"
            >
              <div className="cat-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>No Tickets</span>
                <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>Fine</span>
              </div>
              <div className="cat-amount">{formatCurrency(summary?.categories?.no_tickets?.amount)}</div>
              <div className="cat-count">{formatNumber(summary?.categories?.no_tickets?.count)} tickets</div>
            </div>

            <div 
              className={`category-card ${category === 'card_payments' ? 'active-filter' : ''}`}
              style={{ cursor: 'pointer', border: category === 'card_payments' ? '1px solid var(--accent-cyan)' : undefined }}
              onClick={() => { setCategory(category === 'card_payments' ? 'all' : 'card_payments'); setPage(1); }}
              title="Click to filter by Card Payments"
            >
              <div className="cat-title">Card Payment</div>
              <div className="cat-amount">{formatCurrency(summary?.categories?.card_payments?.amount)}</div>
              <div className="cat-count">{formatNumber(summary?.categories?.card_payments?.count)} cards</div>
            </div>

            <div 
              className={`category-card ${category === 'tag_payments' ? 'active-filter' : ''}`}
              style={{ cursor: 'pointer', border: category === 'tag_payments' ? '1px solid var(--accent-primary)' : undefined }}
              onClick={() => { setCategory(category === 'tag_payments' ? 'all' : 'tag_payments'); setPage(1); }}
              title="Click to filter by Tag Payments"
            >
              <div className="cat-title">Tag Payment</div>
              <div className="cat-amount">{formatCurrency(summary?.categories?.tag_payments?.amount)}</div>
              <div className="cat-count">{formatNumber(summary?.categories?.tag_payments?.count)} tags</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Showing <strong>{rows.length > 0 ? (page - 1) * limit + 1 : 0}</strong> - <strong>{Math.min(page * limit, total)}</strong> of <strong>{formatNumber(total)}</strong> payments
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
                  Loading payment records...
                </p>
              </div>
            ) : rows.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>No payment records match the selected date range and filter criteria.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Receipt No</th>
                      <th>Category</th>
                      <th>Fine Status</th>
                      <th>Access ID / Ticket</th>
                      <th>Duration / Spent</th>
                      <th>Payment Method</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th>Cashier</th>
                      <th>Date & Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 600, color: '#fff' }}>
                          {row.receipt_no || 'N/A'}
                        </td>
                        <td>
                          <span className={`badge ${
                            row.category_label.includes('Overnight') ? 'badge-amber' :
                            row.category_label.includes('Subscriber') ? 'badge-green' :
                            row.category_label.includes('Lost') ? 'badge-red' :
                            row.category_label.includes('Expired') ? 'badge-red' :
                            row.category_label.includes('No Ticket') ? 'badge-purple' :
                            row.category_label.includes('Card') ? 'badge-cyan' : 'badge-blue'
                          }`}>
                            {row.category_label}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${row.fine_status?.includes('Fine') ? 'badge-red' : 'badge-gray'}`}>
                            {row.fine_status || 'Standard'}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                          {row.access_id || '-'}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {row.timespent || '-'}
                        </td>
                        <td>
                          <span className={`badge ${
                            row.channel_label === 'Cash' ? 'badge-green' :
                            row.channel_label === 'POS' ? 'badge-cyan' : 'badge-gray'
                          }`}>
                            {row.channel_label}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#fff' }}>
                          {formatCurrency(row.amount)}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {row.cashier_name || 'System / Automated'}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          {row.transaction_date || row.created_at || '-'}
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

export default function PaymentReportsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={32} className="animate-spin" /></div>}>
      <PaymentReportsContent />
    </Suspense>
  );
}
