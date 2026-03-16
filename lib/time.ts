export type LogEntry = {
    id: string
    type: 'check_in' | 'check_out'
    timestamp: string
  }
  
  export type WorkSession = {
    checkIn: Date
    checkOut: Date | null
    duration: number | null // seconds
  }
  
  export function pairLogs(logs: LogEntry[]): WorkSession[] {
    const sorted = [...logs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
  
    const sessions: WorkSession[] = []
    let pendingCheckIn: Date | null = null
  
    for (const log of sorted) {
      if (log.type === 'check_in') {
        pendingCheckIn = new Date(log.timestamp)
      } else if (log.type === 'check_out' && pendingCheckIn) {
        const checkOut = new Date(log.timestamp)
        const duration = Math.floor(
          (checkOut.getTime() - pendingCheckIn.getTime()) / 1000
        )
        sessions.push({ checkIn: pendingCheckIn, checkOut, duration })
        pendingCheckIn = null
      }
    }
  
    if (pendingCheckIn) {
      sessions.push({ checkIn: pendingCheckIn, checkOut: null, duration: null })
    }
  
    return sessions
  }
  
  export function sumDuration(sessions: WorkSession[]): number {
    return sessions.reduce((acc, s) => acc + (s.duration ?? 0), 0)
  }
  
  export function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

export function formatTaipeiTime(timestamp: string): string {
  return new Intl.DateTimeFormat('zh-TW-u-hc-h23', {
    timeZone: 'Asia/Taipei',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(timestamp))
}

const WORKDAY_START_HOUR = 6

const taipeiDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Taipei',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function formatWorkdayKey(date: Date): string {
  const parts = taipeiDateTimeFormatter.formatToParts(date)
  const getValue = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find(part => part.type === type)?.value ?? 0)

  const taipeiMs = Date.UTC(
    getValue('year'),
    getValue('month') - 1,
    getValue('day'),
    getValue('hour'),
    getValue('minute'),
    getValue('second')
  )

  // Shift boundary to 06:00 (Taipei), so 00:00-05:59 belongs to previous workday.
  const shifted = new Date(taipeiMs - WORKDAY_START_HOUR * 60 * 60 * 1000)
  const y = shifted.getUTCFullYear()
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0')
  const d = String(shifted.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Returns YYYY-MM-DD by Taipei workday boundary (starts at 06:00).
export function getTaipeiDate(timestamp: string): string {
  return formatWorkdayKey(new Date(timestamp))
}

export function getTodayTaipei(): string {
  return formatWorkdayKey(new Date())
}