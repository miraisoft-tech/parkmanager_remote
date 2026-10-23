import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];
    const filter = searchParams.get('filter') || '0';
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '25', 10)));
    const offset = (page - 1) * limit;

    const startDateTime = `${startDate} 00:00:00`;
    const endDateTime = `${endDate} 23:59:59`;

    // Movement Filter SQL
    const whereClauses: string[] = [
      'pr.generate_date BETWEEN ? AND ?'
    ];
    const params: any[] = [startDateTime, endDateTime];

    if (filter === '1') {
      whereClauses.push("pr.operation = 'in'");
    } else if (filter === '2') {
      whereClauses.push("pr.operation = 'out'");
    } else if (filter === '3') {
      whereClauses.push("pr.operation = 'in' AND NOT EXISTS (SELECT 1 FROM park_reports p2 WHERE p2.ticket = pr.ticket AND p2.operation = 'out')");
    }

    if (search.trim()) {
      whereClauses.push('pr.ticket LIKE ?');
      params.push(`%${search.trim()}%`);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    // Total Count for Pagination
    const countSql = `
      SELECT COUNT(*) as total
      FROM park_reports pr
      ${whereSql}
    `;
    const [countRes] = await query<any>(countSql, params);
    const total = Number(countRes?.total || 0);

    // Summary Metrics for the Range
    const statsSql = `
      SELECT 
        COUNT(CASE WHEN operation = 'in' THEN 1 END) as entry_count,
        COUNT(CASE WHEN operation = 'in' AND type = 'one-time' THEN 1 END) as onetime_count,
        COUNT(CASE WHEN operation = 'in' AND type != 'one-time' THEN 1 END) as regular_count,
        COUNT(CASE WHEN operation = 'out' THEN 1 END) as exit_count
      FROM park_reports
      WHERE generate_date BETWEEN ? AND ?
    `;
    const [statsRes] = await query<any>(statsSql, [startDateTime, endDateTime]);

    // Data query with payment details when applicable
    const dataSql = `
      SELECT 
        pr.id,
        pr.ticket,
        pr.type,
        pr.operation,
        DATE_FORMAT(pr.generate_date, '%Y-%m-%d %H:%i:%s') as timein,
        pr.out_date as timeout,
        COALESCE(p.timespent, '') as timespent,
        COALESCE(p.amount, 0) as amount,
        CASE 
          WHEN p.transaction_channel = 0 THEN 'Cash'
          WHEN p.transaction_channel = 1 THEN 'POS'
          WHEN p.transaction_channel = 2 THEN 'Online'
          ELSE 'Nill'
        END as paytype
      FROM park_reports pr
      LEFT JOIN (
        SELECT access_id, timespent, amount, transaction_channel
        FROM payments
        WHERE id IN (
          SELECT MAX(id) FROM payments GROUP BY access_id
        )
      ) p ON p.access_id = pr.ticket AND pr.operation = 'out'
      ${whereSql}
      ORDER BY pr.generate_date DESC, pr.id DESC
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...params, limit, offset];
    const rows = await query<any>(dataSql, dataParams);

    return NextResponse.json({
      rows: rows.map(r => ({
        ...r,
        amount: Number(r.amount || 0)
      })),
      stats: {
        entry: Number(statsRes?.entry_count || 0),
        onetime: Number(statsRes?.onetime_count || 0),
        regular: Number(statsRes?.regular_count || 0),
        exit: Number(statsRes?.exit_count || 0)
      },
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err: any) {
    console.error('Error fetching park reports:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve park movement records.' },
      { status: 500 }
    );
  }
}
