'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { 
  Wallet, 
  CreditCard, 
  Banknote, 
  Receipt, 
  ArrowUpRight, 
  TrendingUp, 
  AlertTriangle, 
  Car, 
  Moon, 
  Users, 
  Tag, 
  Download,
  Loader2,
  Ban
} from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const today = new Date();
    const past30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const s = past30.toISOString().split('T')[0];
    const e = today.toISOString().split('T')[0];
    setStartDate(s);
    setEndDate(e);
  }, []);

  useEffect(() => {
    if (!startDate || !endDate) return;

    async function loadData() {
      try {
        setLoading(true);
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const u = await userRes.json();
          setUser(u.user);
        }

        const summaryRes = await fetch(`/api/reports/summary?start_date=${startDate}&end_date=${endDate}`);
        if (summaryRes.ok) {
          const s = await summaryRes.json();
          setSummary(s);
        }

        const paymentsRes = await fetch(`/api/reports/payments?start_date=${startDate}&end_date=${endDate}&limit=8`);
        if (paymentsRes.ok) {
          const p = await paymentsRes.json();
          setRecentPayments(p.rows || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [startDate, endDate]);

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
          title="Executive Dashboard" 
          subtitle="Real-time synchronized revenue metrics from DB_REMOTE" 
        />

        <div className="app-content">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '28px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                Financial & Operations Overview
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Displaying 30-day reporting window ({startDate} to {endDate})
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Link href="/reports/payments" className="btn btn-primary">
                <span>View Full Reports</span>
                <ArrowUpRight size={16} />
              </Link>
              <a 
                href={`/api/reports/export?start_date=${startDate}&end_date=${endDate}`}
                className="btn btn-success"
              >
                <Download size={16} />
                <span>Stream 30-Day CSV</span>
              </a>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '80px', textAlign: 'center' }}>
              <Loader2 size={36} className="animate-spin" color="var(--accent-cyan)" />
              <p style={{ marginTop: '16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Fetching synchronized data from DB_REMOTE...
              </p>
            </div>
          ) : (
            <>
              <div className="kpi-grid">
                <div className="glass-panel kpi-card">
                  <div className="kpi-label">
                    <span>Total Revenue</span>
                    <Wallet size={16} color="var(--accent-primary)" />
                  </div>
                  <div className="kpi-value">
                    {formatCurrency(summary?.total_amount)}
                  </div>
                  <div className="kpi-sub">
                    {formatNumber(summary?.total_count)} total transactions recorded
                  </div>
                </div>

                <div className="glass-panel kpi-card emerald">
                  <div className="kpi-label">
                    <span>Cash Collections</span>
                    <Banknote size={16} color="var(--accent-emerald)" />
                  </div>
                  <div className="kpi-value">
                    {formatCurrency(summary?.cash_amount)}
                  </div>
                  <div className="kpi-sub">
                    Direct cash receipts
                  </div>
                </div>

                <div className="glass-panel kpi-card cyan">
                  <div className="kpi-label">
                    <span>POS Terminal Transact</span>
                    <CreditCard size={16} color="var(--accent-cyan)" />
                  </div>
                  <div className="kpi-value">
                    {formatCurrency(summary?.pos_amount)}
                  </div>
                  <div className="kpi-sub">
                    Card & contactless payments
                  </div>
                </div>

                <div className="glass-panel kpi-card rose">
                  <div className="kpi-label">
                    <span>Fines & Penalties</span>
                    <AlertTriangle size={16} color="var(--accent-rose)" />
                  </div>
                  <div className="kpi-value">
                    {formatCurrency(summary?.categories?.fines?.amount)}
                  </div>
                  <div className="kpi-sub">
                    {formatNumber(summary?.categories?.fines?.count)} lost/expired violations
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                      Payment Categories Breakdown
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Granular reporting across all ticket and subscriber types
                    </p>
                  </div>
                  <Link href="/reports/payments" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                    Detailed Table &rarr;
                  </Link>
                </div>

                <div className="category-grid">
                  <div className="category-card">
                    <div className="cat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Car size={14} color="#818cf8" />
                      <span>One-Time Parking</span>
                    </div>
                    <div className="cat-amount">{formatCurrency(summary?.categories?.onetime?.amount)}</div>
                    <div className="cat-count">{formatNumber(summary?.categories?.onetime?.count)} tickets</div>
                  </div>

                  <div className="category-card">
                    <div className="cat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Moon size={14} color="#fbbf24" />
                      <span>Overnight Parking</span>
                    </div>
                    <div className="cat-amount">{formatCurrency(summary?.categories?.overnight?.amount)}</div>
                    <div className="cat-count">{formatNumber(summary?.categories?.overnight?.count)} tickets</div>
                  </div>

                  <div className="category-card">
                    <div className="cat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} color="#34d399" />
                      <span>Subscribers</span>
                    </div>
                    <div className="cat-amount">{formatCurrency(summary?.categories?.subscribers?.amount)}</div>
                    <div className="cat-count">{formatNumber(summary?.categories?.subscribers?.count)} renewals</div>
                  </div>

                  <div className="category-card">
                    <div className="cat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={14} color="#fb7185" />
                      <span>Lost Tickets</span>
                    </div>
                    <div className="cat-amount">{formatCurrency(summary?.categories?.lost_tickets?.amount)}</div>
                    <div className="cat-count">{formatNumber(summary?.categories?.lost_tickets?.count)} tickets</div>
                  </div>

                  <div className="category-card">
                    <div className="cat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={14} color="#f43f5e" />
                      <span>Expired Tickets</span>
                    </div>
                    <div className="cat-amount">{formatCurrency(summary?.categories?.expired_tickets?.amount)}</div>
                    <div className="cat-count">{formatNumber(summary?.categories?.expired_tickets?.count)} tickets</div>
                  </div>

                  <div className="category-card">
                    <div className="cat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Ban size={14} color="#c084fc" />
                      <span>No Tickets</span>
                    </div>
                    <div className="cat-amount">{formatCurrency(summary?.categories?.no_tickets?.amount)}</div>
                    <div className="cat-count">{formatNumber(summary?.categories?.no_tickets?.count)} tickets</div>
                  </div>

                  <div className="category-card">
                    <div className="cat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CreditCard size={14} color="#38bdf8" />
                      <span>Card Payments</span>
                    </div>
                    <div className="cat-amount">{formatCurrency(summary?.categories?.card_payments?.amount)}</div>
                    <div className="cat-count">{formatNumber(summary?.categories?.card_payments?.count)} cards</div>
                  </div>

                  <div className="category-card">
                    <div className="cat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Tag size={14} color="#94a3b8" />
                      <span>Tag Payments</span>
                    </div>
                    <div className="cat-amount">{formatCurrency(summary?.categories?.tag_payments?.amount)}</div>
                    <div className="cat-count">{formatNumber(summary?.categories?.tag_payments?.count)} tags</div>
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                      Recent Synchronized Transactions
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Latest payment events synced to DB_REMOTE
                    </p>
                  </div>
                  <Link href="/reports/payments" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
                    <span>View All & Export</span>
                  </Link>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Receipt No</th>
                        <th>Category</th>
                        <th>Access ID</th>
                        <th>Duration</th>
                        <th>Method</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                        <th>Cashier</th>
                        <th>Transaction Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPayments.map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 600, color: '#fff' }}>
                            {item.receipt_no || 'N/A'}
                          </td>
                          <td>
                            <span className={`badge ${
                              item.category_label.includes('Overnight') ? 'badge-amber' :
                              item.category_label.includes('Subscriber') ? 'badge-green' :
                              item.category_label.includes('Lost') ? 'badge-red' :
                              item.category_label.includes('Expired') ? 'badge-red' :
                              item.category_label.includes('Card') ? 'badge-purple' : 'badge-blue'
                            }`}>
                              {item.category_label}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                            {item.access_id || '-'}
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>
                            {item.timespent || '-'}
                          </td>
                          <td>
                            <span className={`badge ${
                              item.channel_label === 'Cash' ? 'badge-green' :
                              item.channel_label === 'POS' ? 'badge-cyan' : 'badge-gray'
                            }`}>
                              {item.channel_label}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#fff' }}>
                            {formatCurrency(item.amount)}
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {item.cashier_name || 'System / Automated'}
                          </td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                            {item.transaction_date || item.created_at || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
