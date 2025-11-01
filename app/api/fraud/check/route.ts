import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, beneficiaryId } = await request.json();
    if (!userId || amount == null) {
      return NextResponse.json({ error: 'userId and amount are required' }, { status: 400 });
    }

    const flags: string[] = [];
    let risk = 0;

    // Velocity check: last 60 minutes
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentTx } = await supabaseAdmin
      .from('transactions')
      .select('id, amount')
      .eq('user_id', userId)
      .gte('created_at', since);

    const velocity = recentTx?.length || 0;
    if (velocity >= 5) {
      flags.push('high_velocity');
      risk += 0.3;
    }

    // Average amount baseline
    const { data: avgAgg } = await supabaseAdmin
      .from('transactions')
      .select('amount')
      .eq('user_id', userId);
    const amounts = (avgAgg || []).map(r => Number(r.amount) || 0);
    const avg = amounts.length ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
    if (avg > 0 && amount > 5 * avg) {
      flags.push('amount_anomaly');
      risk += 0.3;
    }

    // New beneficiary check (< 24h)
    if (beneficiaryId) {
      const { data: ben } = await supabaseAdmin
        .from('beneficiaries')
        .select('created_at')
        .eq('id', beneficiaryId)
        .maybeSingle();
      if (ben?.created_at) {
        const created = new Date(ben.created_at).getTime();
        if (Date.now() - created < 24 * 60 * 60 * 1000 && amount > 1000) {
          flags.push('new_beneficiary');
          risk += 0.4;
        }
      }
    }

    const safe = risk < 0.7;
    return NextResponse.json({ safe, riskScore: Number(risk.toFixed(2)), flags });
  } catch (e) {
    console.error('Fraud check error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
