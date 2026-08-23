import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function GET() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .order('date')
    .order('time_slot')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const { date, slots } = await req.json()
  const rows = slots.map((time_slot: string) => ({ date, time_slot, is_booked: false }))
  const { error } = await supabase.from('availability').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = getSupabase()
  const { id } = await req.json()
  const { error } = await supabase.from('availability').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
