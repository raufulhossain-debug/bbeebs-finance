import { NextResponse } from 'next/server'
import { FinancialData, DEFAULT_DATA } from '@/lib/types'

// Fallback in-memory store if Supabase isn't configured
let memoryStore: FinancialData | null = null

async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || url === 'undefined') return null
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(url, key)
}

export async function GET() {
  try {
    const sb = await getSupabase()
    if (sb) {
      const { data, error } = await sb
        .from('financial_data')
        .select('value')
        .eq('key', 'main')
        .single()
      if (!error && data?.value) return NextResponse.json(data.value)
    }
    if (memoryStore) return NextResponse.json(memoryStore)
    return NextResponse.json(DEFAULT_DATA)
  } catch (e) {
    console.error('GET error:', e)
    if (memoryStore) return NextResponse.json(memoryStore)
    return NextResponse.json(DEFAULT_DATA)
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Always store in memory as backup
    memoryStore = body

    const sb = await getSupabase()
    if (sb) {
      const { error } = await sb
        .from('financial_data')
        .upsert({ key: 'main', value: body, updated_at: new Date().toISOString() })

      if (error) {
        console.error('Supabase upsert error:', error)
        // Still return ok since we have memory store
        return NextResponse.json({ ok: true, warning: error.message })
      }

      // Save net worth snapshot
      try {
        const { calcNetWorth, calcTotalSavings, calcTotalRetirement,
          calcPortfolioValue, calcTotalDebt, calcTotalIncome, calcSavingsRate
        } = await import('@/lib/calculations')

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
      } catch (snapErr) {
        console.error('Snapshot error (non-fatal):', snapErr)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('POST error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
