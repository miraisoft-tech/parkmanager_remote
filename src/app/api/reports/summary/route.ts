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

    const [totals] = await query<any>(
      `SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN transaction_channel = 0 THEN amount ELSE 0 END), 0) as cash_amount,
        COALESCE(SUM(CASE WHEN transaction_channel = 1 THEN amount ELSE 0 END), 0) as pos_amount,
        COALESCE(SUM(CASE WHEN transaction_channel = 2 THEN amount ELSE 0 END), 0) as online_amount
       FROM payments
       ${whereSql}`,
      params
    );

    const categoryParams: any[] = [startDateTime, endDateTime];
    let channelFilterClause = '';
    if (channel !== 'all') {
      channelFilterClause = ' AND transaction_channel = ?';
      categoryParams.push(parseInt(channel, 10));
    }

    const [cats] = await query<any>(
      `SELECT 
        COUNT(CASE WHEN type = 1 AND (timespent NOT LIKE '%Overnite%' OR timespent IS NULL) THEN 1 END) as onetime_count,
        COALESCE(SUM(CASE WHEN type = 1 AND (timespent NOT LIKE '%Overnite%' OR timespent IS NULL) THEN amount ELSE 0 END), 0) as onetime_amount,

        COUNT(CASE WHEN type = 1 AND timespent LIKE '%Overnite%' THEN 1 END) as overnight_count,
        COALESCE(SUM(CASE WHEN type = 1 AND timespent LIKE '%Overnite%' THEN amount ELSE 0 END), 0) as overnight_amount,

        COUNT(CASE WHEN type = 2 THEN 1 END) as subs_count,
        COALESCE(SUM(CASE WHEN type = 2 THEN amount ELSE 0 END), 0) as subs_amount,

        COUNT(CASE WHEN type = 9 THEN 1 END) as lost_count,
        COALESCE(SUM(CASE WHEN type = 9 THEN amount ELSE 0 END), 0) as lost_amount,

        COUNT(CASE WHEN type = 3 THEN 1 END) as exp_count,
        COALESCE(SUM(CASE WHEN type = 3 THEN amount ELSE 0 END), 0) as exp_amount,

        COUNT(CASE WHEN type = 7 THEN 1 END) as noticket_count,
        COALESCE(SUM(CASE WHEN type = 7 THEN amount ELSE 0 END), 0) as noticket_amount,

        COUNT(CASE WHEN type = 6 THEN 1 END) as card_count,
        COALESCE(SUM(CASE WHEN type = 6 THEN amount ELSE 0 END), 0) as card_amount,

        COUNT(CASE WHEN type = 8 THEN 1 END) as tag_count,
        COALESCE(SUM(CASE WHEN type = 8 THEN amount ELSE 0 END), 0) as tag_amount,

        COUNT(CASE WHEN type IN (3, 7, 9) THEN 1 END) as fines_count,
        COALESCE(SUM(CASE WHEN type IN (3, 7, 9) THEN amount ELSE 0 END), 0) as fines_amount
       FROM payments
       WHERE transaction_date BETWEEN ? AND ?
       ${channelFilterClause}`,
      categoryParams
    );

    return NextResponse.json({
      total_count: Number(totals?.total_count || 0),
      total_amount: Number(totals?.total_amount || 0),
      cash_amount: Number(totals?.cash_amount || 0),
      pos_amount: Number(totals?.pos_amount || 0),
      online_amount: Number(totals?.online_amount || 0),
      categories: {
        payment: {
          label: 'Regular Parking',
          count: Number(cats?.onetime_count || 0),
          amount: Number(cats?.onetime_amount || 0)
        },
        onetime: {
          label: 'Regular Parking',
          count: Number(cats?.onetime_count || 0),
          amount: Number(cats?.onetime_amount || 0)
        },
        overnight: {
          label: 'Overnight Parking',
          count: Number(cats?.overnight_count || 0),
          amount: Number(cats?.overnight_amount || 0)
        },
        subscribers: {
          label: 'Subscribers Payment',
          count: Number(cats?.subs_count || 0),
          amount: Number(cats?.subs_amount || 0)
        },
        lost_tickets: {
          label: 'Lost Tickets',
          count: Number(cats?.lost_count || 0),
          amount: Number(cats?.lost_amount || 0)
        },
        expired_tickets: {
          label: 'Expired Tickets',
          count: Number(cats?.exp_count || 0),
          amount: Number(cats?.exp_amount || 0)
        },
        no_tickets: {
          label: 'No Tickets',
          count: Number(cats?.noticket_count || 0),
          amount: Number(cats?.noticket_amount || 0)
        },
        card_payments: {
          label: 'Card Payments',
          count: Number(cats?.card_count || 0),
          amount: Number(cats?.card_amount || 0)
        },
        tag_payments: {
          label: 'Tag Payments',
          count: Number(cats?.tag_count || 0),
          amount: Number(cats?.tag_amount || 0)
        },
        fines: {
          label: 'Fines & Penalties',
          count: Number(cats?.fines_count || 0),
          amount: Number(cats?.fines_amount || 0)
        }
      }
    });
  } catch (err: any) {
    console.error('Error fetching summary:', err);
    return NextResponse.json(
      { error: 'Failed to calculate payment summary.' },
      { status: 500 }
    );
  }
}
