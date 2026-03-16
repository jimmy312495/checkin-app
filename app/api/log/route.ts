import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { type } = await request.json()

  if (!['check_in', 'check_out'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const { data: latestLog, error: latestLogError } = await supabase
    .from('work_logs')
    .select('type')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestLogError) {
    return NextResponse.json({ error: latestLogError.message }, { status: 500 })
  }

  const isWorking = latestLog?.type === 'check_in'
  if (type === 'check_in' && isWorking) {
    return NextResponse.json({ error: 'Already clocked in.' }, { status: 409 })
  }
  if (type === 'check_out' && !isWorking) {
    return NextResponse.json({ error: 'Cannot clock out while not working.' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('work_logs')
    .insert({ user_id: user.id, type })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}