import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_DATA } from '@/lib/types'

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )
}

export async function GET() {
  try {
    const { data, error } = await sb()
      .from('financial_data')
      .select('value')
      .eq('key', 'main')
      .maybeSingle()

    if (error) {
      console.error('GET error:', error)
      return NextResponse.json(DEFAULT_DATA)
    }
    if (!data) return NextResponse.json(DEFAULT_DATA)
    return NextResponse.json(data.value)
  } catch (e) {
    console.error('GET fatal:', e)
    return NextResponse.json(DEFAULT_DATA)
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { error } = await sb()
      .from('financial_data')
      .upsert(
        { key: 'main', value: body, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )

    if (error) {
      console.error('POST upsert error:', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    // Save net worth snapshot (non-fatal)
    try {
      const {
        calcNetWorth, calcTotalSavings, calcTotalRetirement,
        calcPortfolioValue, calcTotalDebt, calcTotalIncome, calcSavingsRate
      } = await import('@/lib/calculations')

      await sb().from('net_worth_history').upsert({
        snapshot_date: new Date().toISOString().split('T')[0],
        net_worth: calcNetWorth(body),
        total_savings: calcTotalSavings(body),
        total_retirement: calcTotalRetirement(body),
        total_investments: calcPortfolioValue(body),
        total_debt: calcTotalDebt(body),
        monthly_income: calcTotalIncome(body),
        savings_rate: calcSavingsRate(body),
      }, { onConflict: 'snapshot_date' })
    } catch (e) {
      console.error('Snapshot error (non-fatal):', e)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('POST fatal:', e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
