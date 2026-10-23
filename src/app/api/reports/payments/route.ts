import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];
    const category = searchParams.get('category') || 'all';
    const channel = searchParams.get('channel') || 'all';
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '25', 10)));
    const offset = (page - 1) * limit;

    const startDateTime = `${startDate} 00:00:00`;
    const endDateTime = `${endDate} 23:59:59`;

    const whereClauses: string[] = [
      '(payments.transaction_date BETWEEN ? AND ? OR payments.created_at BETWEEN ? AND ?)'
    ];
    const params: any[] = [startDateTime, endDateTime, startDateTime, endDateTime];

    if (category !== 'all') {
      switch (category) {
        case 'onetime':
        case 'payment':
          whereClauses.push("payments.type = 1 AND (payments.timespent NOT LIKE '%Overnite%' OR payments.timespent IS NULL)");
          break;
        case 'overnight':
          whereClauses.push("payments.type = 1 AND payments.timespent LIKE '%Overnite%'");
          break;
        case 'subscribers':
          whereClauses.push('payments.type = 2');
          break;
        case 'expired_tickets':
          whereClauses.push('payments.type = 3');
          break;
        case 'cards':
        case 'card_payments':
          whereClauses.push('payments.type = 6');
          break;
        case 'no_tickets':
          whereClauses.push('payments.type = 7');
          break;
        case 'tag':
        case 'tag_payments':
          whereClauses.push('payments.type = 8');
          break;
        case 'lost_tickets':
          whereClauses.push('payments.type = 9');
          break;
        case 'fine':
        case 'fines':
          whereClauses.push('payments.type IN (3, 7, 9)');
          break;
      }
    }

    if (channel !== 'all') {
      whereClauses.push('payments.transaction_channel = ?');
      params.push(parseInt(channel, 10));
    }

    if (search.trim()) {
      whereClauses.push('(payments.receipt_no LIKE ? OR payments.access_id LIKE ? OR users.name LIKE ?)');
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM payments
      LEFT JOIN users ON users.id = payments.staff_id
      ${whereSql}
    `;
    const [countRes] = await query<any>(countSql, params);
    const total = Number(countRes?.total || 0);

    const dataSql = `
      SELECT 
        payments.id,
        payments.receipt_no,
        payments.access_id,
        payments.type,
        payments.amount,
        payments.transaction_channel,
        payments.timespent,
        payments.transaction_date,
        payments.created_at,
        users.name as cashier_name,
        CASE 
          WHEN payments.type = 1 AND payments.timespent LIKE '%Overnite%' THEN 'Overnight'
          WHEN payments.type = 1 THEN 'Payment'
          WHEN payments.type = 2 THEN 'Subscribers Payment'
          WHEN payments.type = 3 THEN 'Expired Ticket'
          WHEN payments.type = 4 THEN 'Online Registration'
          WHEN payments.type = 5 THEN 'Online Renewal'
          WHEN payments.type = 6 THEN 'Card Payment'
          WHEN payments.type = 7 THEN 'No Ticket'
          WHEN payments.type = 8 THEN 'Tag Payment'
          WHEN payments.type = 9 THEN 'Lost Ticket'
          ELSE 'Other Payment'
        END as category_label,
        CASE 
          WHEN payments.type = 9 THEN 'Fine (Lost Ticket)'
          WHEN payments.type = 3 THEN 'Fine (Expired Ticket)'
          WHEN payments.type = 7 THEN 'Fine (No Ticket)'
          ELSE 'Standard'
        END as fine_status,
        CASE 
          WHEN payments.transaction_channel = 0 THEN 'Cash'
          WHEN payments.transaction_channel = 1 THEN 'POS'
          WHEN payments.transaction_channel = 2 THEN 'Online'
          ELSE 'Other'
        END as channel_label
      FROM payments
      LEFT JOIN users ON users.id = payments.staff_id
      ${whereSql}
      ORDER BY payments.id DESC
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...params, limit, offset];
    const rows = await query<any>(dataSql, dataParams);

    return NextResponse.json({
      rows: rows.map(r => ({
        ...r,
        amount: Number(r.amount || 0)
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err: any) {
    console.error('Error fetching payments:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve payment records.' },
      { status: 500 }
    );
  }
}
