import type { NextRequest } from 'next/server';
import { getDbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('report') || searchParams.get('type');
    if (reportType === 'park') {
      const parkExportUrl = new URL('/api/reports/park/export', request.url);
      parkExportUrl.search = searchParams.toString();
      return Response.redirect(parkExportUrl.toString(), 307);
    }

    const startDate = searchParams.get('start_date') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];
    const category = searchParams.get('category') || 'all';
    const channel = searchParams.get('channel') || 'all';

    const startDateTime = `${startDate} 00:00:00`;
    const endDateTime = `${endDate} 23:59:59`;

    const whereClauses: string[] = [
      'payments.transaction_date BETWEEN ? AND ?'
    ];
    const params: any[] = [startDateTime, endDateTime];

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

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const filename = `park_report_${startDate}_to_${endDate}.csv`;

    const pool = getDbPool();
    const encoder = new TextEncoder();

    function escapeCsv(val: any): string {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode('\uFEFF'));

        const headers = [
          'ID',
          'Receipt No',
          'Transaction Date',
          'Category',
          'Fine Status',
          'Access ID / Ticket',
          'Duration / Spent',
          'Payment Method',
          'Amount (NGN)',
          'Cashier'
        ];
        controller.enqueue(encoder.encode(headers.map(escapeCsv).join(',') + '\r\n'));

        const chunkSize = 1000;
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const chunkSql = `
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
                WHEN payments.type = 1 THEN 'Regular Parking'
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

          const [rows] = await pool.query<any[]>(chunkSql, [...params, chunkSize, offset]);

          if (!rows || rows.length === 0) {
            hasMore = false;
            break;
          }

          let chunkText = '';
          for (const row of rows) {
            const line = [
              row.id,
              row.receipt_no || 'N/A',
              row.transaction_date || row.created_at || 'N/A',
              row.category_label,
              row.fine_status,
              row.access_id || 'N/A',
              row.timespent || 'N/A',
              row.channel_label,
              Number(row.amount || 0).toFixed(2),
              row.cashier_name || 'System / Automated'
            ];
            chunkText += line.map(escapeCsv).join(',') + '\r\n';
          }

          controller.enqueue(encoder.encode(chunkText));
          offset += rows.length;

          if (rows.length < chunkSize) {
            hasMore = false;
          }
        }

        controller.close();
      }
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-transform'
      }
    });
  } catch (err: any) {
    console.error('Streaming export error:', err);
    return new Response('Failed to stream export: ' + err.message, { status: 500 });
  }
}
