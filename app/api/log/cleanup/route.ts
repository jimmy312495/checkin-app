import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTaipeiDate, getTodayTaipei } from '@/lib/time'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: latestLog, error: latestLogError } = await supabase
    .from('work_logs')
    .select('id,type,timestamp')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestLogError) {
    return NextResponse.json({ error: latestLogError.message }, { status: 500 })
  }

  if (!latestLog) {
    return NextResponse.json({ cleaned: false })
  }

  const today = getTodayTaipei()
  const latestWorkday = getTaipeiDate(latestLog.timestamp)

  if (latestLog.type !== 'check_in' || latestWorkday >= today) {
    return NextResponse.json({ cleaned: false })
  }

  const { error: deleteError } = await supabase
    .from('work_logs')
    .delete()
    .eq('id', latestLog.id)
    .eq('user_id', user.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ cleaned: true, deletedId: latestLog.id })
}
