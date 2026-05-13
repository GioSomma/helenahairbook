import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) throw new Error('Missing environment variables')
  return createClient(supabaseUrl, supabaseKey)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase()
    const body = await req.json()
    const { service_id, availability_id, name, surname, email, phone, notes } = body

    if (!service_id || !availability_id || !name || !surname || !email || !phone) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 })
    }

    const { data: slot, error: slotError } = await supabase
      .from('availability')
      .select('is_booked')
      .eq('id', availability_id)
      .single()

    if (slotError || !slot) return NextResponse.json({ error: 'Slot non trovato' }, { status: 404 })
    if (slot.is_booked) return NextResponse.json({ error: 'Slot già prenotato' }, { status: 409 })

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({ service_id, availability_id, name, surname, email, phone, notes, status: 'confirmed' })
      .select()
      .single()

    if (bookingError) return NextResponse.json({ error: bookingError.message }, { status: 500 })

    await supabase.from('availability').update({ is_booked: true }).eq('id', availability_id)

    return NextResponse.json({ success: true, booking })
  } catch (err) {
    console.error('Bookings error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('bookings')
      .select(`*, services ( name, price ), availability ( date, time_slot )`)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('Bookings GET error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
