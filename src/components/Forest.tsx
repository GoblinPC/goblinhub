import { useState, useEffect } from 'react'
import type { Inventory, DiceResult } from '../types'
import DiceRoll from './DiceRoll'
import { startForestAmbience, stopForestAmbience, playChopping } from '../sounds'

function rollForest(): DiceResult {
  const roll = Math.floor(Math.random() * 20) + 1
  let loot: DiceResult['loot'] = null
  if (roll >= 16 && roll <= 19) loot = { item: 'wood', amount: 2 }
  else if (roll === 20) loot = { item: 'wood', amount: 3 }
  else if (roll >= 6) loot = { item: 'wood', amount: 1 }
  return { roll, loot }
}

// Pyłki leśne
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

// Świetliki
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
  const [result, setResult] = useState<DiceResult | null>(null)
  const [rolling, setRolling] = useState(false)

  useEffect(() => {
    startForestAmbience()
    return () => stopForestAmbience()
  }, [])

  function handleGather() {
    if (rolling) return
    playChopping()
    setRolling(true)
    setResult(rollForest())
  }

  function handleDone() {
    if (result?.loot) {
      onUpdate({ ...inventory, wood: inventory.wood + result.loot.amount })
    }
    setRolling(false)
  }

  return (
    <div className="screen-enter" style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>

      {/* Tło */}
      <img src="/assets/backgrounds/forest.webp" alt="" draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', pointerEvents: 'none', userSelect: 'none' }} />

      {/* Kryształy niebieskie lewo */}
      <div style={{ position: 'absolute', left: '14%', top: '52%', width: '18%', height: '10%',
        borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(80,160,255,0.7) 0%, transparent 70%)',
        filter: 'blur(8px)', pointerEvents: 'none', mixBlendMode: 'screen',
        animation: 'ambiMine 2.8s ease-in-out infinite' }} />

      {/* Światło korony drzew */}
      <div style={{ position: 'absolute', left: '30%', top: '0%', width: '40%', height: '30%',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(120,200,100,0.18) 0%, transparent 70%)',
        filter: 'blur(12px)', pointerEvents: 'none', mixBlendMode: 'screen',
        animation: 'ambiForest 5s ease-in-out infinite' }} />

      {/* Pyłki magiczne */}
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

      {/* Świetliki */}
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

      {/* Ciemny gradient góra (header) */}
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
        {/* Wood counter */}
        <div style={{ marginLeft: 'auto', background: 'rgba(10,20,8,0.75)', border: '1px solid rgba(100,180,60,0.4)', borderRadius: '10px', padding: '6px 12px', backdropFilter: 'blur(6px)' }}>
          <span style={{ fontFamily: 'Cinzel', fontSize: '11px', color: '#8ab060', letterSpacing: '0.05em' }}>🪵</span>
          <span style={{ fontFamily: 'Cinzel', fontSize: '16px', fontWeight: 700, color: '#a0d060', marginLeft: 6 }}>{inventory.wood}</span>
        </div>
      </div>

      {/* Panel akcji – dół */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(0deg, rgba(2,8,4,0.97) 0%, rgba(4,12,6,0.92) 60%, transparent 100%)',
        padding: '0 16px 32px' }}>

        {/* Dice area */}
        <div style={{ minHeight: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0 8px' }}>
          {result ? (
            <DiceRoll result={result} onDone={handleDone} />
          ) : (
            <p style={{ fontFamily: 'Crimson Text', fontSize: '16px', color: '#3a5028', fontStyle: 'italic', margin: 0 }}>
              Naciśnij przycisk i rzuć kośćmi fortuny...
            </p>
          )}
        </div>

        <button className="btn-primary" onClick={handleGather} disabled={rolling}
          style={{ marginBottom: '8px', background: rolling ? undefined : 'linear-gradient(135deg, #2a6010, #4a9020)', borderColor: rolling ? undefined : '#70c030' }}>
          {rolling ? 'Szukasz...' : 'Zbieraj drewno'}
        </button>
        <p style={{ fontFamily: 'Crimson Text', fontSize: '12px', color: '#2a4018', fontStyle: 'italic', textAlign: 'center', margin: 0 }}>
          k20 · 1–5 nic · 6–15 ×1 · 16–19 ×2 · 20 ×3
        </p>
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
