import type { NextRequest } from 'next/server';
import { getDbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];
    const filter = searchParams.get('filter') || '0';
    const search = searchParams.get('search') || '';

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
    const filename = `park_movement_report_${startDate}_to_${endDate}.csv`;

    const pool = getDbPool();
    const encoder = new TextEncoder();

    function escapeCsv(val: any): string {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // UTF-8 Byte Order Mark for Excel compatibility
          controller.enqueue(encoder.encode('\uFEFF'));

          const headers = [
            'ID',
            'Ticket / Access ID',
            'Transit Type',
            'Operation',
            'Time In',
            'Time Out',
            'Time Spent',
            'Payment Method',
            'Amount Paid (NGN)'
          ];
          controller.enqueue(encoder.encode(headers.map(escapeCsv).join(',') + '\r\n'));

          const chunkSize = 1000;
          let offset = 0;
          let hasMore = true;

          while (hasMore) {
            const chunkSql = `
              SELECT 
                pr.id,
                pr.ticket,
                pr.type,
                pr.operation,
                DATE_FORMAT(pr.generate_date, '%Y-%m-%d %H:%i:%s') as timein,
                pr.out_date as timeout
              FROM park_reports pr
              ${whereSql}
              ORDER BY pr.generate_date DESC, pr.id DESC
              LIMIT ? OFFSET ?
            `;

            const [rows] = await pool.query<any[]>(chunkSql, [...params, chunkSize, offset]);

            if (!rows || rows.length === 0) {
              hasMore = false;
              break;
            }

            // Fetch payments for exit records to get accurate duration, payment method, and amount
            const outTickets = [...new Set(rows.filter(r => r.operation === 'out' && r.ticket).map(r => r.ticket))];
            const paymentMap = new Map<string, { timespent: string; amount: number; channel: number }>();

            if (outTickets.length > 0) {
              const placeholders = outTickets.map(() => '?').join(',');
              const [payments] = await pool.query<any[]>(
                `SELECT access_id, timespent, amount, transaction_channel, id
                 FROM payments
                 WHERE access_id IN (${placeholders})
                 ORDER BY id DESC`,
                outTickets
              );

              for (const p of payments) {
                if (!paymentMap.has(p.access_id)) {
                  paymentMap.set(p.access_id, {
                    timespent: p.timespent || '',
                    amount: 0,
                    channel: p.transaction_channel
                  });
                }
                const entry = paymentMap.get(p.access_id)!;
                entry.amount += Number(p.amount || 0);
              }
            }

            let chunkText = '';
            for (const row of rows) {
              const pay = paymentMap.get(row.ticket);
              let paytype = 'Nill';
              if (pay) {
                if (pay.channel === 0) paytype = 'Cash';
                else if (pay.channel === 1) paytype = 'POS';
                else if (pay.channel === 2) paytype = 'Online';
                else paytype = 'Other';
              }

              const line = [
                row.id,
                row.ticket || 'N/A',
                row.type === 'one-time' ? 'One-Time' : (row.type || 'Regular'),
                row.operation === 'in' ? 'ENTRY' : (row.operation === 'out' ? 'EXIT' : String(row.operation || '').toUpperCase()),
                row.timein || 'N/A',
                row.timeout || (row.operation === 'in' ? 'Active / In-Park' : 'N/A'),
                pay ? (pay.timespent || 'N/A') : (row.operation === 'in' ? 'Active / In-Park' : 'N/A'),
                paytype,
                pay ? Number(pay.amount || 0).toFixed(2) : '0.00'
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
        } catch (streamErr: any) {
          console.error('Streaming park movement export error:', streamErr);
          controller.error(streamErr);
        }
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
    console.error('Park export route error:', err);
    return new Response('Failed to stream park report export: ' + err.message, { status: 500 });
  }
}
