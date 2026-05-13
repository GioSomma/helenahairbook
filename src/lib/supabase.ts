import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Service = {
  id: number
  name: string
  description: string
  price: string
  duration: string
  active: boolean
}

export type Availability = {
  id: number
  date: string
  time_slot: string
  is_booked: boolean
}

export type Booking = {
  id?: string
  service_id: number
  availability_id: number
  name: string
  surname: string
  email: string
  phone: string
  notes: string
  status?: string
  created_at?: string
}
