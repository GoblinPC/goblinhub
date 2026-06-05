import { useState } from 'react'
import type { Inventory, DiceResult } from '../types'
import DiceRoll from './DiceRoll'
import { useEffect } from 'react'
import { playMining, startMineAmbience, stopMineAmbience } from '../sounds'

function rollMine(): DiceResult {
  const roll = Math.floor(Math.random() * 20) + 1
  let loot: DiceResult['loot'] = null
  if (roll >= 16 && roll <= 19) loot = { item: 'copperOre', amount: 2 }
  else if (roll === 20) loot = { item: 'copperOre', amount: 3 }
  else if (roll >= 6) loot = { item: 'copperOre', amount: 1 }
  return { roll, loot }
}

// Kryształy niebieskie – pozycje z grafiki
const CRYSTALS = [
  { left: '46%', top:  '6%', size: '22%', h: '11%', delay: '0s'   },
  { left: '80%', top: '83%', size: '16%', h: '8%',  delay: '0.8s' },
  { left:  '5%', top: '45%', size: '10%', h: '6%',  delay: '1.4s' },
  { left: '65%', top: '55%', size: '10%', h: '6%',  delay: '2s'   },
]

// Latarnie
const LANTERNS = [
  { left: '22%', top: '28%', delay: '0s'   },
  { left: '62%', top: '22%', delay: '0.5s' },
  { left: '84%', top: '38%', delay: '1.1s' },
]

// Pył kopalni
const DUST = [
  { left: '30%', top: '40%', delay: '0s',   dur: '6s'  },
  { left: '55%', top: '30%', delay: '1.5s', dur: '5s'  },
  { left: '70%', top: '55%', delay: '0.8s', dur: '7s'  },
  { left: '20%', top: '60%', delay: '3s',   dur: '5.5s'},
  { left: '45%', top: '20%', delay: '2s',   dur: '6.5s'},
]

interface Props {
  inventory: Inventory
  onUpdate: (inv: Inventory) => void
  onBack: () => void
}

export default function Mine({ inventory, onUpdate, onBack }: Props) {
  const [result, setResult] = useState<DiceResult | null>(null)
  const [rolling, setRolling] = useState(false)

  useEffect(() => {
    startMineAmbience()
    return () => stopMineAmbience()
  }, [])

  function handleMine() {
    if (rolling) return
    playMining()
    setRolling(true)
    setResult(rollMine())
  }

  function handleDone() {
    if (result?.loot) {
      onUpdate({ ...inventory, copperOre: inventory.copperOre + result.loot.amount })
    }
    setRolling(false)
  }

  return (
    <div className="screen-enter" style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>

      {/* Tło */}
      <img src="/assets/backgrounds/mine.webp" alt="" draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', pointerEvents: 'none', userSelect: 'none' }} />

      {/* Kryształy */}
      {CRYSTALS.map((c, i) => (
        <div key={i} style={{
          position: 'absolute', left: c.left, top: c.top, width: c.size, height: c.h,
          transform: 'translate(-50%, 0)',
          borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(60,140,255,0.65) 0%, transparent 70%)',
          filter: 'blur(7px)', pointerEvents: 'none', mixBlendMode: 'screen',
          animation: `ambiMine 3s ease-in-out ${c.delay} infinite`,
        }} />
      ))}

      {/* Latarnie */}
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

      {/* Pył kopalniany */}
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

      {/* Ciemny ambient – niebieskie ściany */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(5,10,30,0.25) 100%)', pointerEvents: 'none' }} />

      {/* Gradient góra */}
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
          <p style={{ fontFamily: 'Crimson Text', fontSize: '13px', color: '#507090', margin: '2px 0 0', fontStyle: 'italic' }}>Głębiny pełne kryształów</p>
        </div>
        <div style={{ marginLeft: 'auto', background: 'rgba(5,8,20,0.75)', border: '1px solid rgba(60,100,200,0.4)', borderRadius: '10px', padding: '6px 12px', backdropFilter: 'blur(6px)' }}>
          <span style={{ fontFamily: 'Cinzel', fontSize: '11px', color: '#6080b0' }}>🪨</span>
          <span style={{ fontFamily: 'Cinzel', fontSize: '16px', fontWeight: 700, color: '#80a0d0', marginLeft: 6 }}>{inventory.copperOre}</span>
        </div>
      </div>

      {/* Panel akcji */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(0deg, rgba(2,4,15,0.97) 0%, rgba(4,8,25,0.92) 60%, transparent 100%)',
        padding: '0 16px 32px' }}>

        <div style={{ minHeight: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0 8px' }}>
          {result ? (
            <DiceRoll result={result} onDone={handleDone} />
          ) : (
            <p style={{ fontFamily: 'Crimson Text', fontSize: '16px', color: '#2a3850', fontStyle: 'italic', margin: 0 }}>
              Chwyć kilof i uderzaj w ścianę...
            </p>
          )}
        </div>

        <button className="btn-primary" onClick={handleMine} disabled={rolling}
          style={{ marginBottom: '8px', background: rolling ? undefined : 'linear-gradient(135deg, #1a3060, #2a50a0)', borderColor: rolling ? undefined : '#4080d0' }}>
          {rolling ? 'Kopiesz...' : 'Kop rudę miedzi'}
        </button>
        <p style={{ fontFamily: 'Crimson Text', fontSize: '12px', color: '#1e2840', fontStyle: 'italic', textAlign: 'center', margin: 0 }}>
          k20 · 1–5 nic · 6–15 ×1 · 16–19 ×2 · 20 ×3
        </p>
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
