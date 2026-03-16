'use client'

import { useEffect, useState } from 'react'

type ClockProps = {
  isWorking?: boolean
}

export default function Clock({ isWorking = false }: ClockProps) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl bg-white/80 p-6 text-center  backdrop-blur-sm">
      <p className="font-mono text-5xl font-bold tracking-tight text-black sm:text-6xl">
        {time.toLocaleTimeString('zh-TW', {
          timeZone: 'Asia/Taipei',
          hour12: false,
        })}
      </p>

      <p className="mt-3 text-lg font-medium text-slate-600">
        {time.toLocaleDateString('zh-TW', {
          timeZone: 'Asia/Taipei',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long',
        })}
      </p>

      <p className={`mt-3 text-lg font-semibold ${isWorking ? 'text-green-700' : 'text-slate-500'}`}>
        Current: {isWorking ? 'Working' : 'Not working'}
      </p>
    </div>
  )
}