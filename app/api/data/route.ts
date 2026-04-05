import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { DEFAULT_DATA } from '@/lib/types'

export async function GET() {
  try {
    const sb = supabaseAdmin()
    const { data, error } = await sb
      .from('financial_data')
      .select('value')
      .eq('key', 'main')
      .single()

    if (error || !data) {
      return NextResponse.json(DEFAULT_DATA)
    }
    return NextResponse.json(data.value)
  } catch {
    return NextResponse.json(DEFAULT_DATA)
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const sb = supabaseAdmin()

    const { error } = await sb
      .from('financial_data')
      .upsert({ key: 'main', value: body, updated_at: new Date().toISOString() })

    if (error) throw error

    // Save net worth snapshot
    const { calcNetWorth, calcTotalSavings, calcTotalRetirement, calcPortfolioValue, calcTotalDebt, calcTotalIncome, calcSavingsRate } = await import('@/lib/calculations')
    await sb.from('net_worth_history').upsert({
      snapshot_date: new Date().toISOString().split('T')[0],
      net_worth: calcNetWorth(body),
      total_savings: calcTotalSavings(body),
      total_retirement: calcTotalRetirement(body),
      total_investments: calcPortfolioValue(body),
      total_debt: calcTotalDebt(body),
      monthly_income: calcTotalIncome(body),
      savings_rate: calcSavingsRate(body),
    }, { onConflict: 'snapshot_date' })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
