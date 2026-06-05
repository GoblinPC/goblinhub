import { useEffect } from 'react'
import type { Inventory, Professions } from '../types'
import { playSmithing, startForgeAmbience, stopForgeAmbience } from '../sounds'
import { addProfessionXp, xpProgress, xpToNextLevel } from '../store'

// Iskry lecące w górę z paleniska
const EMBERS = [
  { left: '18%', delay: '0s',   dur: '2.2s', size: 4 },
  { left: '22%', delay: '0.4s', dur: '1.8s', size: 3 },
  { left: '15%', delay: '0.8s', dur: '2.5s', size: 5 },
  { left: '25%', delay: '1.3s', dur: '2s',   size: 3 },
  { left: '20%', delay: '1.7s', dur: '2.3s', size: 4 },
  { left: '12%', delay: '2.1s', dur: '1.9s', size: 3 },
  { left: '28%', delay: '0.6s', dur: '2.6s', size: 4 },
]

interface Props {
  inventory: Inventory
  professions: Professions
  onUpdate: (inv: Inventory, profs: Professions) => void
  onBack: () => void
}

export default function Forge({ inventory, professions, onUpdate, onBack }: Props) {
  useEffect(() => {
    startForgeAmbience()
    return () => stopForgeAmbience()
  }, [])

  const prof = professions.blacksmith
  const xpPct = xpProgress(prof.xp, prof.level) * 100
  const xpNeeded = xpToNextLevel(prof.level)

  const canLight = inventory.wood >= 1
  const canSmelt = inventory.forgeEmber >= 1 && inventory.copperOre >= 2

  function handleLight() {
    if (!canLight) return
    playSmithing()
    const newProfs = addProfessionXp(professions, 'blacksmith', 10)
    onUpdate({ ...inventory, wood: inventory.wood - 1, forgeEmber: inventory.forgeEmber + 1 }, newProfs)
  }

  function handleSmelt() {
    if (!canSmelt) return
    playSmithing()
    const newProfs = addProfessionXp(professions, 'blacksmith', 25)
    onUpdate({
      ...inventory,
      forgeEmber: inventory.forgeEmber - 1,
      copperOre: inventory.copperOre - 2,
      copperBar: inventory.copperBar + 1,
    }, newProfs)
  }

  return (
    <div className="screen-enter" style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>

      {/* Tło */}
      <img src="/assets/backgrounds/forge.webp" alt="" draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', pointerEvents: 'none', userSelect: 'none' }} />

      {/* Wielki glow paleniska */}
      <div style={{
        position: 'absolute', left: '20%', top: '36%', width: '28%', height: '14%',
        transform: 'translate(-50%, 0)',
        borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,140,20,0.7) 0%, rgba(255,80,10,0.3) 50%, transparent 75%)',
        filter: 'blur(10px)', pointerEvents: 'none', mixBlendMode: 'screen',
        animation: 'ambiForge 1.8s ease-in-out infinite',
      }} />

      {/* Żarzące węgle – dolne palenisko */}
      <div style={{
        position: 'absolute', left: '20%', top: '50%', width: '20%', height: '7%',
        transform: 'translate(-50%, 0)',
        borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,80,10,0.6) 0%, transparent 70%)',
        filter: 'blur(8px)', pointerEvents: 'none', mixBlendMode: 'screen',
        animation: 'ambiForge 2.4s ease-in-out 0.3s infinite',
      }} />

      {/* Żyrandol */}
      <div style={{
        position: 'absolute', left: '58%', top: '8%', width: '16%', height: '7%',
        transform: 'translate(-50%, 0)',
        borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,200,80,0.5) 0%, transparent 70%)',
        filter: 'blur(8px)', pointerEvents: 'none', mixBlendMode: 'screen',
        animation: 'ambiLantern 2.5s ease-in-out 0.6s infinite',
      }} />

      {/* Latarnia przy drzwiach */}
      <div style={{
        position: 'absolute', left: '51%', top: '50%',
        width: '10px', height: '10px', borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(255,200,100,0.9)', boxShadow: '0 0 14px 7px rgba(255,180,60,0.5)',
        pointerEvents: 'none', mixBlendMode: 'screen',
        animation: 'ambiLantern 1.6s ease-in-out 0.9s infinite',
      }} />

      {/* Iskry z paleniska */}
      {EMBERS.map((e, i) => (
        <div key={i} style={{
          position: 'absolute', left: e.left, top: '48%',
          width: e.size + 'px', height: e.size + 'px', borderRadius: '50%',
          background: i % 2 === 0 ? 'rgba(255,160,40,0.95)' : 'rgba(255,100,20,0.9)',
          boxShadow: '0 0 4px 2px rgba(255,120,20,0.4)',
          pointerEvents: 'none', mixBlendMode: 'screen',
          animation: `emberRise ${e.dur} ease-out ${e.delay} infinite`,
          transform: 'translate(-50%, -50%)',
        }} />
      ))}

      {/* Ciepła poświata całości */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 22% 45%, rgba(180,60,10,0.12) 0%, transparent 55%)', pointerEvents: 'none' }} />

      {/* Gradient góra */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '120px',
        background: 'linear-gradient(180deg, rgba(10,4,2,0.88) 0%, transparent 100%)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 16px 0' }}>
        <BackBtn onClick={onBack} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '22px' }}>⚒️</span>
            <h2 style={{ fontFamily: 'Cinzel', fontSize: '20px', fontWeight: 700, color: '#f0c060', margin: 0, textShadow: '0 0 16px rgba(240,140,20,0.6)' }}>Kuźnia</h2>
          </div>
          <p style={{ fontFamily: 'Crimson Text', fontSize: '13px', color: '#7a5030', margin: '2px 0 0', fontStyle: 'italic' }}>Gorące palenisko goblinich kowali</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{ fontFamily: 'Cinzel', fontSize: '10px', color: '#7a5030' }}>🔨 Kowal lv.{prof.level}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 70, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${xpPct}%`, background: 'linear-gradient(90deg,#8a4010,#e08030)', borderRadius: 2, boxShadow: '0 0 4px rgba(220,120,30,0.5)', transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontFamily: 'Cinzel', fontSize: '9px', color: '#5a3820' }}>{prof.xp % xpNeeded}/{xpNeeded}</span>
          </div>
        </div>
      </div>

      {/* Panel akcji – dół */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(0deg, rgba(10,4,2,0.98) 0%, rgba(15,6,2,0.93) 55%, transparent 100%)',
        padding: '12px 16px 32px' }}>

        {/* Surowce */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', justifyContent: 'center' }}>
          <ResourceChip icon="🪵" label="Drewno" amount={inventory.wood} color="#a07840" />
          <ResourceChip icon="🪨" label="Ruda" amount={inventory.copperOre} color="#c07850" />
          <ResourceChip icon="🔥" label="Żar" amount={inventory.forgeEmber} color="#f06020" />
          <ResourceChip icon="🔶" label="Sztabka" amount={inventory.copperBar} color="#e09050" />
        </div>

        {/* Akcja 1 */}
        <div style={{ marginBottom: '10px' }}>
          <p style={{ fontFamily: 'Crimson Text', fontSize: '13px', color: '#6a4830', margin: '0 0 6px', fontStyle: 'italic', textAlign: 'center' }}>
            🪵 Drewno ×1 → 🔥 Żar ×1
          </p>
          <button className="btn-primary" onClick={handleLight} disabled={!canLight}>
            {canLight ? '⚗️ Rozpal piec' : 'Potrzebujesz drewna'}
          </button>
        </div>

        {/* Akcja 2 */}
        <div>
          <p style={{ fontFamily: 'Crimson Text', fontSize: '13px', color: '#506030', margin: '0 0 6px', fontStyle: 'italic', textAlign: 'center' }}>
            🔥 Żar ×1 + 🪨 Ruda ×2 → 🔶 Sztabka ×1
          </p>
          <button className="btn-secondary" onClick={handleSmelt} disabled={!canSmelt}>
            {canSmelt ? '🔥 Przetop rudę miedzi' : 'Niewystarczające zasoby'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ResourceChip({ icon, label, amount, color }: { icon: string; label: string; amount: number; color: string }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.6)', border: `1px solid ${amount > 0 ? color + '55' : '#2a1a0a'}`,
      borderRadius: '10px', padding: '6px 10px', textAlign: 'center', minWidth: '60px',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{ fontSize: '18px', lineHeight: 1, marginBottom: '2px' }}>{icon}</div>
      <div style={{ fontFamily: 'Cinzel', fontSize: '16px', fontWeight: 700, color: amount > 0 ? color : '#3a2810', lineHeight: 1 }}>{amount}</div>
      <div style={{ fontFamily: 'Crimson Text', fontSize: '10px', color: '#4a3020', letterSpacing: '0.03em' }}>{label}</div>
    </div>
  )
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,200,80,0.15)',
      borderRadius: '10px', color: '#8a6040', fontFamily: 'Cinzel', fontSize: '16px',
      width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation', backdropFilter: 'blur(4px)',
    }}>←</button>
  )
}
