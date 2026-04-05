import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const sb = supabaseAdmin()
    const { data, error } = await sb
      .from('net_worth_history')
      .select('*')
      .order('snapshot_date', { ascending: true })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json([])
  }
}
