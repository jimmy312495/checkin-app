'use client'

import { useEffect, useState } from 'react'

export default function Clock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="text-center">
      <p className="text-5xl font-mono font-bold tracking-widest">
        {time.toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei' })}
      </p>
      <p className="text-gray-500 mt-1 text-sm">
        {time.toLocaleDateString('zh-TW', {
          timeZone: 'Asia/Taipei',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long',
        })}
      </p>
    </div>
  )
}