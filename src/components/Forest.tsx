import { useState, useEffect } from 'react'
import type { Inventory } from '../types'
import { startForestAmbience, stopForestAmbience, playChopping } from '../sounds'

const EXPEDITION_MS = 5000

function rollLoot(): { item: keyof Inventory; amount: number } | null {
  const r = Math.random()
  if (r < 0.25) return null
  if (r < 0.75) return { item: 'wood', amount: 1 }
  if (r < 0.95) return { item: 'wood', amount: 2 }
  return { item: 'wood', amount: 3 }
}

const FOREST_PARTICLES = [
  { left: '18%', top: '38%', delay: '0s',   dur: '4s'  },
  { left: '32%', top: '22%', delay: '1.2s', dur: '3.5s'},
  { left: '55%', top: '45%', delay: '0.6s', dur: '5s'  },
  { left: '70%', top: '30%', delay: '2s',   dur: '4.2s'},
  { left: '42%', top: '15%', delay: '0.3s', dur: '3.8s'},
  { left: '80%', top: '50%', delay: '1.8s', dur: '4.5s'},
  { left: '25%', top: '55%', delay: '2.5s', dur: '3.2s'},
  { left: '60%', top: '18%', delay: '0.9s', dur: '4.8s'},
]

const FIREFLIES = [
  { left: '15%', top: '60%', delay: '0s',   col: 'rgba(120,255,180,0.9)' },
  { left: '75%', top: '42%', delay: '1.4s', col: 'rgba(100,220,255,0.9)' },
  { left: '40%', top: '70%', delay: '0.7s', col: 'rgba(180,255,120,0.9)' },
  { left: '88%', top: '28%', delay: '2.1s', col: 'rgba(120,255,200,0.9)' },
  { left: '55%', top: '65%', delay: '1.8s', col: 'rgba(80,200,255,0.9)'  },
]

interface Props {
  inventory: Inventory
  onUpdate: (inv: Inventory) => void
  onBack: () => void
}

export default function Forest({ inventory, onUpdate, onBack }: Props) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [loot, setLoot] = useState<{ item: keyof Inventory; amount: number } | null>(null)

  useEffect(() => {
    startForestAmbience()
    return () => stopForestAmbience()
  }, [])

  useEffect(() => {
    if (status !== 'running') return
    const start = Date.now()
    const tick = setInterval(() => {
      const pct = Math.min((Date.now() - start) / EXPEDITION_MS * 100, 100)
      setProgress(pct)
      if (pct >= 100) {
        clearInterval(tick)
        const result = rollLoot()
        setLoot(result)
        setStatus('done')
        playChopping()
      }
    }, 50)
    return () => clearInterval(tick)
  }, [status])

  function handleSend() {
    setStatus('running')
    setProgress(0)
  }

  function handleCollect() {
    if (loot) onUpdate({ ...inventory, wood: inventory.wood + loot.amount })
    setLoot(null)
    setStatus('idle')
    setProgress(0)
  }

  const secondsLeft = status === 'running'
    ? Math.max(0, Math.ceil((EXPEDITION_MS - progress / 100 * EXPEDITION_MS) / 1000))
    : 0

  return (
    <div className="screen-enter" style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>

      <img src="/assets/backgrounds/forest.webp" alt="" draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', pointerEvents: 'none', userSelect: 'none' }} />

      <div style={{ position: 'absolute', left: '14%', top: '52%', width: '18%', height: '10%',
        borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(80,160,255,0.7) 0%, transparent 70%)',
        filter: 'blur(8px)', pointerEvents: 'none', mixBlendMode: 'screen',
        animation: 'ambiMine 2.8s ease-in-out infinite' }} />

      <div style={{ position: 'absolute', left: '30%', top: '0%', width: '40%', height: '30%',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(120,200,100,0.18) 0%, transparent 70%)',
        filter: 'blur(12px)', pointerEvents: 'none', mixBlendMode: 'screen',
        animation: 'ambiForest 5s ease-in-out infinite' }} />

      {FOREST_PARTICLES.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: p.left, top: p.top,
          width: '4px', height: '4px', borderRadius: '50%',
          background: i % 2 === 0 ? 'rgba(120,255,180,0.85)' : 'rgba(80,200,255,0.85)',
          boxShadow: '0 0 6px 3px rgba(80,220,160,0.4)',
          pointerEvents: 'none', mixBlendMode: 'screen',
          animation: `forestFloat ${p.dur} ease-in-out ${p.delay} infinite`,
          transform: 'translate(-50%,-50%)',
        }} />
      ))}

      {FIREFLIES.map((f, i) => (
        <div key={i} style={{
          position: 'absolute', left: f.left, top: f.top,
          width: '6px', height: '6px', borderRadius: '50%',
          background: f.col, boxShadow: `0 0 8px 4px ${f.col}`,
          pointerEvents: 'none', mixBlendMode: 'screen',
          animation: `fireflyBlink 2.2s ease-in-out ${f.delay} infinite`,
          transform: 'translate(-50%,-50%)',
        }} />
      ))}

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100px',
        background: 'linear-gradient(180deg, rgba(2,8,4,0.82) 0%, transparent 100%)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 16px 0' }}>
        <BackBtn onClick={onBack} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '22px' }}>🌲</span>
            <h2 style={{ fontFamily: 'Cinzel', fontSize: '20px', fontWeight: 700, color: '#c8f0a0', margin: 0, textShadow: '0 0 16px rgba(80,200,80,0.6)' }}>Las</h2>
          </div>
          <p style={{ fontFamily: 'Crimson Text', fontSize: '13px', color: '#7a9060', margin: '2px 0 0', fontStyle: 'italic' }}>Magiczny las goblinów</p>
        </div>
        <div style={{ marginLeft: 'auto', background: 'rgba(10,20,8,0.75)', border: '1px solid rgba(100,180,60,0.4)', borderRadius: '10px', padding: '6px 12px', backdropFilter: 'blur(6px)' }}>
          <span style={{ fontFamily: 'Cinzel', fontSize: '11px', color: '#8ab060', letterSpacing: '0.05em' }}>🪵</span>
          <span style={{ fontFamily: 'Cinzel', fontSize: '16px', fontWeight: 700, color: '#a0d060', marginLeft: 6 }}>{inventory.wood}</span>
        </div>
      </div>

      {/* Panel akcji */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(0deg, rgba(2,8,4,0.97) 0%, rgba(4,12,6,0.92) 60%, transparent 100%)',
        padding: '0 16px 32px' }}>

        {/* Obszar wyniku / paska */}
        <div style={{ minHeight: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 0 12px', gap: 12 }}>

          {status === 'idle' && (
            <p style={{ fontFamily: 'Crimson Text', fontSize: '16px', color: '#3a5028', fontStyle: 'italic', margin: 0 }}>
              Wyślij drwala na wyprawę po drewno...
            </p>
          )}

          {status === 'running' && (
            <>
              <p style={{ fontFamily: 'Crimson Text', fontSize: '15px', color: '#6a8a50', fontStyle: 'italic', margin: 0 }}>
                Drwal w lesie... {secondsLeft}s
              </p>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.07)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '4px',
                  background: 'linear-gradient(90deg, #2a6010, #70c030)',
                  width: `${progress}%`,
                  transition: 'width 0.05s linear',
                  boxShadow: '0 0 8px rgba(80,200,40,0.5)',
                }} />
              </div>
            </>
          )}

          {status === 'done' && (
            loot ? (
              <div className="loot-pop" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                background: 'rgba(40,100,20,0.25)', border: '1px solid rgba(80,180,40,0.35)',
                borderRadius: '12px', padding: '14px 24px', width: '100%',
              }}>
                <span style={{ fontFamily: 'Cinzel', fontWeight: 700, fontSize: '26px', color: '#80d040' }}>+{loot.amount}</span>
                <span style={{ fontSize: '22px' }}>🪵</span>
                <span style={{ fontFamily: 'Crimson Text', fontSize: '17px', color: '#a0c070' }}>Drewno</span>
              </div>
            ) : (
              <div style={{
                fontFamily: 'Cinzel', fontSize: '14px', color: '#4a5a38',
                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(60,80,40,0.3)',
                borderRadius: '12px', padding: '14px 24px', width: '100%', textAlign: 'center',
              }}>
                Drwal wrócił z pustymi rękami
              </div>
            )
          )}
        </div>

        {status === 'done' ? (
          <button className="btn-primary" onClick={handleCollect}
            style={{ background: 'linear-gradient(135deg, #2a6010, #4a9020)', borderColor: '#70c030' }}>
            Zbierz i wróć
          </button>
        ) : (
          <button className="btn-primary" onClick={handleSend} disabled={status === 'running'}
            style={{ background: status === 'idle' ? 'linear-gradient(135deg, #2a6010, #4a9020)' : undefined, borderColor: status === 'idle' ? '#70c030' : undefined }}>
            {status === 'running' ? 'Drwal w drodze...' : 'Wyślij drwala'}
          </button>
        )}
      </div>
    </div>
  )
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '10px', color: '#a0b890', fontFamily: 'Cinzel', fontSize: '16px',
      width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation', backdropFilter: 'blur(4px)',
    }}>←</button>
  )
}
