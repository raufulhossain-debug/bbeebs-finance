import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const secretKey = process.env.SUPABASE_SECRET_KEY
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(url!, secretKey || anonKey!)
    const { data, error } = await sb.from('financial_data').select('key').limit(1)
    return NextResponse.json({
      url_set: !!url,
      anon_set: !!anonKey,
      secret_set: !!secretKey,
      url_preview: url?.slice(0, 40),
      supabase_result: error ? `ERROR: ${error.message} (code: ${error.code})` : `OK, rows: ${data?.length}`,
    })
  } catch(e) {
    return NextResponse.json({ fatal: String(e) })
  }
}
