'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Clock from '@/components/Clock'
import {
  pairLogs, sumDuration, formatDuration,
  formatTaipeiTime,
  getTaipeiDate, getTodayTaipei,
  type LogEntry,
} from '@/lib/time'

type DailyGroup = {
  date: string
  totalSeconds: number
}

export default function DashboardPage() {
  const [allLogs, setAllLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [searchDate, setSearchDate] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const fetchLogs = useCallback(async () => {
    const today = getTodayTaipei()
    const cleanupKey = 'work_logs:lastCleanupDate'
    const lastCleanup = typeof window !== 'undefined' ? localStorage.getItem(cleanupKey) : null

    if (lastCleanup !== today) {
      const cleanupResponse = await fetch('/api/log/cleanup', { method: 'POST' })
      if (cleanupResponse.ok) {
        localStorage.setItem(cleanupKey, today)
      }
    }

    const { data, error } = await supabase
      .from('work_logs')
      .select('*')
      .order('timestamp', { ascending: true })
    if (!error) setAllLogs(data as LogEntry[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const handleLog = async (type: 'check_in' | 'check_out') => {
    if ((type === 'check_in' && isWorking) || (type === 'check_out' && !isWorking)) {
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })

      if (!response.ok) {
        return
      }

      await fetchLogs()
    } finally {
      setActionLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Today
  const today = getTodayTaipei()
  const todayLogs = allLogs.filter(l => getTaipeiDate(l.timestamp) === today)
  const todayTotal = sumDuration(pairLogs(todayLogs))
  const latestLog = allLogs.length > 0 ? allLogs[allLogs.length - 1] : null
  const isWorking = latestLog?.type === 'check_in'
  const canCheckIn = !actionLoading && !isWorking
  const canCheckOut = !actionLoading && isWorking

  // History grouped by date
  const dateMap = new Map<string, LogEntry[]>()
  for (const log of allLogs) {
    const date = getTaipeiDate(log.timestamp)
    if (!dateMap.has(date)) dateMap.set(date, [])
    dateMap.get(date)!.push(log)
  }
  const history: DailyGroup[] = [...dateMap.entries()]
    .map(([date, logs]) => ({ date, totalSeconds: sumDuration(pairLogs(logs)) }))
    .sort((a, b) => b.date.localeCompare(a.date))

  // Search
  const searchLogs = searchDate
    ? allLogs.filter(l => getTaipeiDate(l.timestamp) === searchDate)
    : []
  const searchTotal = sumDuration(pairLogs(searchLogs))

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Work Tracker</h1>
          <button onClick={handleSignOut} className="text-sm text-gray-400 hover:text-red-500 transition">
            Sign Out
          </button>
        </div>

        {/* Clock */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <Clock isWorking={isWorking} />
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleLog('check_in')}
            disabled={!canCheckIn}
            className="bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl text-lg font-semibold disabled:opacity-50 transition"
          >
            Clock In
          </button>
          <button
            onClick={() => handleLog('check_out')}
            disabled={!canCheckOut}
            className="bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl text-lg font-semibold disabled:opacity-50 transition"
          >
            Clock Out
          </button>
        </div>

        {/* Today */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-3">Today</h2>
          {todayLogs.length === 0 ? (
            <p className="text-gray-400 text-sm">No records yet.</p>
          ) : (
            <>
              <ul className="space-y-2 mb-3">
                {[...todayLogs].reverse().map(log => (
                  <li key={log.id} className="flex justify-between text-sm">
                    <span className={log.type === 'check_in' ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                      {log.type === 'check_in' ? '▶ Clock In' : '■ Clock Out'}
                    </span>
                    <span className="font-mono text-gray-600">
                      {formatTaipeiTime(log.timestamp)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="border-t pt-3 flex justify-between font-semibold text-sm">
                <span>Total</span>
                <span className="font-mono text-blue-600">{formatDuration(todayTotal)}</span>
              </div>
            </>
          )}
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-3">Search by Date</h2>
          <input
            type="date"
            value={searchDate}
            onChange={e => setSearchDate(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchDate && (
            <div className="mt-4">
              {searchLogs.length === 0 ? (
                <p className="text-gray-400 text-sm">No records for this date.</p>
              ) : (
                <>
                  <ul className="space-y-2 mb-3">
                    {searchLogs.map(log => (
                      <li key={log.id} className="flex justify-between text-sm">
                        <span className={log.type === 'check_in' ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                          {log.type === 'check_in' ? '▶ Clock In' : '■ Clock Out'}
                        </span>
                        <span className="font-mono text-gray-600">
                          {formatTaipeiTime(log.timestamp)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t pt-3 flex justify-between font-semibold text-sm">
                    <span>Total</span>
                    <span className="font-mono text-blue-600">{formatDuration(searchTotal)}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* History */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-3">History</h2>
          {history.length === 0 ? (
            <p className="text-gray-400 text-sm">No history yet.</p>
          ) : (
            <ul className="space-y-2">
              {history.map(group => (
                <li key={group.date} className="flex justify-between text-sm border-b pb-2 last:border-0">
                  <span className="text-gray-600">{group.date}</span>
                  <span className="font-mono font-semibold text-blue-600">
                    {formatDuration(group.totalSeconds)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  )
}