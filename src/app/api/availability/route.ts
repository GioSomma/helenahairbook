import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('is_booked', false)
    .gte('date', today)
    .order('date')
    .order('time_slot')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Raggruppa per data
  const grouped: Record<string, { id: number; time_slot: string }[]> = {}
  for (const row of data) {
    if (!grouped[row.date]) grouped[row.date] = []
    grouped[row.date].push({ id: row.id, time_slot: row.time_slot })
  }

  const result = Object.entries(grouped).map(([date, slots]) => ({
    date,
    slots,
  }))

  return NextResponse.json(result)
}
