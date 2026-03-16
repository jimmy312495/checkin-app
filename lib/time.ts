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
  
  // Returns YYYY-MM-DD in Taipei time
  export function getTaipeiDate(timestamp: string): string {
    return new Date(timestamp).toLocaleDateString('en-CA', {
      timeZone: 'Asia/Taipei',
    })
  }
  
  export function getTodayTaipei(): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })
  }