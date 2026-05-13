import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing env vars:', { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey })
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('is_booked', false)
      .gte('date', today)
      .order('date')
      .order('time_slot')

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = data ?? []
    const grouped: Record<string, { id: number; time_slot: string }[]> = {}
    for (const row of rows) {
      if (!grouped[row.date]) grouped[row.date] = []
      grouped[row.date].push({ id: row.id, time_slot: row.time_slot })
    }

    const result = Object.entries(grouped).map(([date, slots]) => ({ date, slots }))
    return NextResponse.json(result)
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
