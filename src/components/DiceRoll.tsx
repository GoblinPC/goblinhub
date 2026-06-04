import { useEffect, useRef, useState } from 'react'
import type { DiceResult } from '../types'
import { ITEM_LABELS, ITEM_COLORS } from './ItemRow'

interface Props {
  result: DiceResult
  onDone?: () => void
}

const ROLL_DURATION_MS = 1000
const TICK_MS = 60

export default function DiceRoll({ result, onDone }: Props) {
  const [display, setDisplay] = useState<number>(1)
  const [done, setDone] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setDisplay(1)
    setDone(false)

    intervalRef.current = setInterval(() => {
      setDisplay(Math.floor(Math.random() * 20) + 1)
    }, TICK_MS)

    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setDisplay(result.roll)
      setDone(true)
      onDone?.()
    }, ROLL_DURATION_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [result.roll])

  const rollColor = result.roll === 20
    ? '#f0e040'
    : result.roll >= 16
    ? '#60d080'
    : result.roll >= 6
    ? '#f0c060'
    : '#c06050'

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div
        className="dice-display"
        style={{
          color: done ? rollColor : '#a07850',
          transition: done ? 'color 0.2s ease' : 'none',
          filter: done ? `drop-shadow(0 0 16px ${rollColor})` : 'none',
        }}
      >
        {display}
      </div>

      <div className="text-center" style={{ color: '#9e8060', fontFamily: 'Cinzel', fontSize: '13px', letterSpacing: '0.05em' }}>
        {done ? (
          result.roll === 20
            ? '✦ KRYTYCZNY SUKCES ✦'
            : result.roll >= 16
            ? 'Świetny wynik!'
            : result.roll >= 6
            ? 'Wynik: ' + result.roll
            : 'Brak szczęścia...'
        ) : (
          'Rzucasz...'
        )}
      </div>

      {done && (
        <div className="loot-pop w-full">
          {result.loot ? (
            <div
              className="item-badge flex items-center justify-center gap-3"
              style={{ borderColor: ITEM_COLORS[result.loot.item] + '55', background: ITEM_COLORS[result.loot.item] + '15' }}
            >
              <span style={{ color: ITEM_COLORS[result.loot.item], fontFamily: 'Cinzel', fontWeight: 700, fontSize: '20px' }}>
                +{result.loot.amount}
              </span>
              <span style={{ color: '#d4a870', fontSize: '17px' }}>
                {ITEM_LABELS[result.loot.item]}
              </span>
            </div>
          ) : (
            <div className="item-badge text-center" style={{ color: '#6a5040', fontFamily: 'Cinzel', fontSize: '15px' }}>
              Nic nie znalazłeś
            </div>
          )}
        </div>
      )}
    </div>
  )
}
