'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

interface Props {
  deadline: string  // ISO string — already the modified deadline (real - 8h)
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function DeadlineTimer({ deadline, size = 'md', showLabel = true }: Props) {
  const calc = useCallback(() => {
    const diff = new Date(deadline).getTime() - Date.now()
    if (diff <= 0) return null
    return {
      diff,
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000)
    }
  }, [deadline])

  const [timeLeft, setTimeLeft] = useState(calc)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const tick = () => {
      const t = calc()
      setTimeLeft(t)
      if (!t) return
      // Update every second if < 1 hour, else every minute
      const interval = t.diff < 3600000 ? 1000 : 60000
      timeoutRef.current = setTimeout(tick, interval)
    }

    timeoutRef.current = setTimeout(tick, 1000)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [calc])

  if (!timeLeft) {
    return (
      <span className="font-mono font-semibold text-sm" style={{ color: 'var(--r)' }}>
        DEADLINE PASSED
      </span>
    )
  }

  const isUrgent = timeLeft.diff < 6 * 3600000   // < 6h: red
  const isWarning = timeLeft.diff < 24 * 3600000  // < 24h: amber

  const display = timeLeft.days > 0
    ? `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m`
    : timeLeft.hours > 0
      ? `${timeLeft.hours}h ${timeLeft.minutes}m${isUrgent ? ` ${timeLeft.seconds}s` : ''}`
      : `${timeLeft.minutes}m ${timeLeft.seconds}s`

  const colorStyle = isUrgent
    ? 'var(--r)'
    : isWarning
      ? 'var(--s)'
      : 'var(--t2)'

  const sizeClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm'

  return (
    <div
      className={`inline-flex items-center gap-2 ${isUrgent ? 'animate-pulse' : ''}`}
      style={isUrgent ? {
        background: 'var(--r-dim)',
        border: '1px solid var(--r-border)',
        borderRadius: '10px',
        padding: '6px 12px',
      } : undefined}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        style={{ color: colorStyle }}
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span
        className={`font-mono font-semibold ${sizeClass}`}
        style={{ color: colorStyle }}
      >
        {display}
      </span>
      {showLabel && (
        <span
          className="text-xs font-medium uppercase"
          style={{ color: 'var(--t3)', letterSpacing: '0.08em' }}
        >
          left
        </span>
      )}
    </div>
  )
}
