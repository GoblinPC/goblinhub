import { useState, useEffect } from 'react'
import type { Inventory, Professions } from '../types'
import { playMining, startMineAmbience, stopMineAmbience } from '../sounds'
import { addProfessionXp, expeditionMs, xpProgress, xpToNextLevel, xpForLevel } from '../store'

function rollLoot(): { item: keyof Inventory; amount: number } | null {
  const r = Math.random()
  if (r < 0.25) return null
  if (r < 0.75) return { item: 'copperOre', amount: 1 }
  if (r < 0.95) return { item: 'copperOre', amount: 2 }
  return { item: 'copperOre', amount: 3 }
}

const CRYSTALS = [
  { left: '46%', top:  '6%', size: '22%', h: '11%', delay: '0s'   },
  { left: '80%', top: '83%', size: '16%', h: '8%',  delay: '0.8s' },
  { left:  '5%', top: '45%', size: '10%', h: '6%',  delay: '1.4s' },
  { left: '65%', top: '55%', size: '10%', h: '6%',  delay: '2s'   },
]

const LANTERNS = [
  { left: '22%', top: '28%', delay: '0s'   },
  { left: '62%', top: '22%', delay: '0.5s' },
  { left: '84%', top: '38%', delay: '1.1s' },
]

const DUST = [
  { left: '30%', top: '40%', delay: '0s',   dur: '6s'  },
  { left: '55%', top: '30%', delay: '1.5s', dur: '5s'  },
  { left: '70%', top: '55%', delay: '0.8s', dur: '7s'  },
  { left: '20%', top: '60%', delay: '3s',   dur: '5.5s'},
  { left: '45%', top: '20%', delay: '2s',   dur: '6.5s'},
]

interface Props {
  inventory: Inventory
  professions: Professions
  onUpdate: (inv: Inventory, profs: Professions) => void
  onBack: () => void
}

export default function Mine({ inventory, professions, onUpdate, onBack }: Props) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [loot, setLoot] = useState<{ item: keyof Inventory; amount: number } | null>(null)

  const prof = professions.miner
  const duration = expeditionMs(prof)

  useEffect(() => {
    startMineAmbience()
    return () => stopMineAmbience()
  }, [])

  useEffect(() => {
    if (status !== 'running') return
    const start = Date.now()
    const tick = setInterval(() => {
      const pct = Math.min((Date.now() - start) / duration * 100, 100)
      setProgress(pct)
      if (pct >= 100) {
        clearInterval(tick)
        const result = rollLoot()
        setLoot(result)
        setStatus('done')
        playMining()
      }
    }, 50)
    return () => clearInterval(tick)
  }, [status])

  function handleSend() {
    setStatus('running')
    setProgress(0)
  }

  function handleCollect() {
    const newProfs = addProfessionXp(professions, 'miner', 20, true)
    const newInv = loot ? { ...inventory, copperOre: inventory.copperOre + loot.amount } : inventory
    onUpdate(newInv, newProfs)
    setLoot(null)
    setStatus('idle')
    setProgress(0)
  }

  const secondsLeft = status === 'running'
    ? Math.max(0, Math.ceil((duration - progress / 100 * duration) / 1000))
    : 0

  const xpPct = xpProgress(prof.xp, prof.level) * 100
  const xpNeeded = xpToNextLevel(prof.level)

  return (
    <div className="screen-enter" style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>

      <img src="/assets/backgrounds/mine.webp" alt="" draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', pointerEvents: 'none', userSelect: 'none' }} />

      {CRYSTALS.map((c, i) => (
        <div key={i} style={{
          position: 'absolute', left: c.left, top: c.top, width: c.size, height: c.h,
          transform: 'translate(-50%, 0)',
          borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(60,140,255,0.65) 0%, transparent 70%)',
          filter: 'blur(7px)', pointerEvents: 'none', mixBlendMode: 'screen',
          animation: `ambiMine 3s ease-in-out ${c.delay} infinite`,
        }} />
      ))}

      {LANTERNS.map((l, i) => (
        <div key={i} style={{
          position: 'absolute', left: l.left, top: l.top,
          width: '12px', height: '12px', borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 200, 80, 0.95)',
          boxShadow: '0 0 16px 8px rgba(255,180,50,0.5)',
          pointerEvents: 'none', mixBlendMode: 'screen',
          animation: `ambiLantern 1.8s ease-in-out ${l.delay} infinite`,
        }} />
      ))}

      {DUST.map((d, i) => (
        <div key={i} style={{
          position: 'absolute', left: d.left, top: d.top,
          width: '3px', height: '3px', borderRadius: '50%',
          background: 'rgba(180,160,140,0.6)',
          pointerEvents: 'none',
          animation: `mineDust ${d.dur} ease-in-out ${d.delay} infinite`,
          transform: 'translate(-50%,-50%)',
        }} />
      ))}

      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(5,10,30,0.25) 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '110px',
        background: 'linear-gradient(180deg, rgba(2,4,15,0.88) 0%, transparent 100%)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 16px 0' }}>
        <BackBtn onClick={onBack} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '22px' }}>⛏️</span>
            <h2 style={{ fontFamily: 'Cinzel', fontSize: '20px', fontWeight: 700, color: '#a0c8f0', margin: 0, textShadow: '0 0 16px rgba(60,120,255,0.5)' }}>Kopalnia</h2>
          </div>
          <p style={{ fontFamily: 'Crimson Text', fontSize: '13px', color: '#90b8d8', margin: '2px 0 0', fontStyle: 'italic', textShadow: '0 1px 6px rgba(0,0,0,0.95)' }}>Głębiny pełne kryształów</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{ background: 'rgba(5,8,20,0.85)', border: '1px solid rgba(60,100,200,0.5)', borderRadius: '10px', padding: '4px 10px', backdropFilter: 'blur(8px)' }}>
            <span style={{ fontFamily: 'Cinzel', fontSize: '11px', color: '#6080b0' }}>🪨</span>
            <span style={{ fontFamily: 'Cinzel', fontSize: '15px', fontWeight: 700, color: '#80a0d0', marginLeft: 5 }}>{inventory.copperOre}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.55)', borderRadius: 6, padding: '2px 6px', backdropFilter: 'blur(4px)' }}>
            <span style={{ fontFamily: 'Cinzel', fontSize: '10px', color: '#80a8d0', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>⛏ lv.{prof.level}</span>
            <div style={{ width: 55, height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${xpPct}%`, background: 'linear-gradient(90deg,#1a3060,#4080d0)', borderRadius: 2, boxShadow: '0 0 4px rgba(60,120,255,0.5)', transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontFamily: 'Cinzel', fontSize: '9px', color: '#6080a0' }}>{prof.xp - xpForLevel(prof.level)}/{xpNeeded}</span>
          </div>
        </div>
      </div>

      {/* Panel akcji */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(0deg, rgba(2,4,15,0.97) 0%, rgba(4,8,25,0.92) 60%, transparent 100%)',
        padding: '0 16px 32px' }}>

        <div style={{ minHeight: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 0 12px', gap: 12 }}>

          {status === 'idle' && (
            <p style={{ fontFamily: 'Crimson Text', fontSize: '16px', color: '#2a3850', fontStyle: 'italic', margin: 0 }}>
              Wyślij górnika w głąb kopalni...
            </p>
          )}

          {status === 'running' && (
            <>
              <p style={{ fontFamily: 'Crimson Text', fontSize: '15px', color: '#4a6080', fontStyle: 'italic', margin: 0 }}>
                Górnik kopie... {secondsLeft}s
              </p>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.07)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '4px',
                  background: 'linear-gradient(90deg, #1a3060, #4080d0)',
                  width: `${progress}%`,
                  transition: 'width 0.05s linear',
                  boxShadow: '0 0 8px rgba(60,120,255,0.5)',
                }} />
              </div>
            </>
          )}

          {status === 'done' && (
            loot ? (
              <div className="loot-pop" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                background: 'rgba(20,40,100,0.25)', border: '1px solid rgba(60,120,200,0.35)',
                borderRadius: '12px', padding: '14px 24px', width: '100%',
              }}>
                <span style={{ fontFamily: 'Cinzel', fontWeight: 700, fontSize: '26px', color: '#80a0d0' }}>+{loot.amount}</span>
                <span style={{ fontSize: '22px' }}>🪨</span>
                <span style={{ fontFamily: 'Crimson Text', fontSize: '17px', color: '#90b0d0' }}>Ruda miedzi</span>
              </div>
            ) : (
              <div style={{
                fontFamily: 'Cinzel', fontSize: '14px', color: '#2a3850',
                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(40,60,100,0.3)',
                borderRadius: '12px', padding: '14px 24px', width: '100%', textAlign: 'center',
              }}>
                Górnik wrócił z pustymi rękami
              </div>
            )
          )}
        </div>

        {status === 'done' ? (
          <button className="btn-primary" onClick={handleCollect}
            style={{ background: 'linear-gradient(135deg, #1a3060, #2a50a0)', borderColor: '#4080d0' }}>
            Zbierz i wróć
          </button>
        ) : (
          <button className="btn-primary" onClick={handleSend} disabled={status === 'running'}
            style={{ background: status === 'idle' ? 'linear-gradient(135deg, #1a3060, #2a50a0)' : undefined, borderColor: status === 'idle' ? '#4080d0' : undefined }}>
            {status === 'running' ? 'Górnik w drodze...' : 'Wyślij górnika'}
          </button>
        )}
      </div>
    </div>
  )
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '10px', color: '#8090b0', fontFamily: 'Cinzel', fontSize: '16px',
      width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation', backdropFilter: 'blur(4px)',
    }}>←</button>
  )
}
