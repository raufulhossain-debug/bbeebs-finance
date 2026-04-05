import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const secretKey = process.env.SUPABASE_SECRET_KEY!

// Client-side client (uses publishable/anon key)
export const supabase = createClient(url, anonKey)

// Server-side client (uses secret key — only used in API routes)
export const supabaseAdmin = () => createClient(url, secretKey || anonKey)
