import { useState, useEffect, useRef } from 'react'
import type { Inventory, Professions } from '../types'
import { startForestAmbience, stopForestAmbience, playChopping } from '../sounds'
import { addProfessionXp, xpProgress, xpToNextLevel, xpForLevel } from '../store'

const TOTAL_HP    = 100
const ZONE_HALF   = 11   // sweet zone half-height in %
const PERFECT_THR = 4    // "perfect" if within 4% of sweet center

const DMG = { perfect: 22, good: 14, ok: 7, miss: 2 } as const
type Quality = keyof typeof DMG

type LootItem = { item: keyof Inventory; amount: number; label: string; icon: string }
interface Chip { id: number; x: number; y: number; dx: number; dy: number; rot: number }
interface FloatLabel { id: number; y: number; text: string; color: string }

function rollLoot(stars: number): LootItem[] {
  const wood = 1 + Math.floor(Math.random() * (stars >= 4 ? 4 : 3))
  const loot: LootItem[] = [{ item: 'wood', amount: wood, label: 'Drewno', icon: '🪵' }]
  if (Math.random() < 0.05 + stars * 0.015)
    loot.push({ item: 'herbs', amount: 1, label: 'Zioła', icon: '🌿' })
  return loot
}

function calcStars(perfect: number, good: number, total: number): number {
  if (total === 0) return 1
  const ratio = (perfect * 2 + good) / (total * 2)
  if (ratio >= 0.85) return 5
  if (ratio >= 0.65) return 4
  if (ratio >= 0.45) return 3
  if (ratio >= 0.25) return 2
  return 1
}

const BARK_LINES = [
  { x: 14, o: 0.13 }, { x: 30, o: 0.19 }, { x: 48, o: 0.10 },
  { x: 64, o: 0.16 }, { x: 80, o: 0.12 },
]
const GRAIN_RINGS = [18, 32, 47, 61, 76, 89]

const PARTICLES = [
  { left: '18%', top: '38%', delay: '0s',   dur: '4s'   },
  { left: '32%', top: '22%', delay: '1.2s', dur: '3.5s' },
  { left: '55%', top: '45%', delay: '0.6s', dur: '5s'   },
  { left: '70%', top: '30%', delay: '2s',   dur: '4.2s' },
  { left: '42%', top: '15%', delay: '0.3s', dur: '3.8s' },
  { left: '80%', top: '50%', delay: '1.8s', dur: '4.5s' },
  { left: '25%', top: '55%', delay: '2.5s', dur: '3.2s' },
  { left: '60%', top: '18%', delay: '0.9s', dur: '4.8s' },
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
  professions: Professions
  energy: number
  onUpdate: (inv: Inventory, profs: Professions, energyCost?: number) => void
  onBack: () => void
}

export default function Forest({ inventory, professions, onUpdate, onBack }: Props) {
  const [hp,         setHp]         = useState(TOTAL_HP)
  const [markerY,    setMarkerY]    = useState(50)
  const [sweetY,     setSweetY]     = useState(50)
  const [shake,      setShake]      = useState(false)
  const [chips,      setChips]      = useState<Chip[]>([])
  const [labels,     setLabels]     = useState<FloatLabel[]>([])
  const [gamePhase,  setGamePhase]  = useState<'chopping' | 'falling' | 'loot'>('chopping')
  const [loot,       setLoot]       = useState<LootItem[]>([])
  const [stars,      setStars]      = useState(0)
  const [firstChop,  setFirstChop]  = useState(false)

  const hpRef       = useRef(TOTAL_HP)
  const tRef        = useRef(0)
  const perfectRef  = useRef(0)
  const goodRef     = useRef(0)
  const totalRef    = useRef(0)
  const chipIdRef   = useRef(0)
  const labelIdRef  = useRef(0)
  const phaseRef    = useRef<'chopping' | 'falling' | 'loot'>('chopping')

  const prof     = professions.woodcutter
  const xpPct    = xpProgress(prof.xp, prof.level) * 100
  const xpLeft   = prof.xp - xpForLevel(prof.level)
  const xpNeeded = xpToNextLevel(prof.level)
  const hpPct    = (hp / TOTAL_HP) * 100
  // Lean angle 0° → 28° as damage accumulates
  const treeAngle = (1 - hp / TOTAL_HP) * 28

  useEffect(() => { startForestAmbience(); return () => stopForestAmbience() }, [])
  useEffect(() => { hpRef.current = hp }, [hp])
  useEffect(() => { phaseRef.current = gamePhase }, [gamePhase])

  // ── Marker animation ─────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'chopping') return
    const iv = setInterval(() => {
      tRef.current += 0.016
      const hpRatio = hpRef.current / TOTAL_HP
      // Speed: 1.3 rad/s (calm) → 3.4 rad/s (last 20% hp)
      const speed = 1.3 + (1 - hpRatio) * 2.1
      const y = 50 + 40 * Math.sin(tRef.current * speed)
      setMarkerY(y)
    }, 16)
    return () => clearInterval(iv)
  }, [gamePhase])

  // ── Chop ─────────────────────────────────────────────────────────────────
  function handleChop() {
    if (phaseRef.current !== 'chopping') return
    if (!firstChop) setFirstChop(true)

    const dist = Math.abs(markerY - sweetY)
    const quality: Quality =
      dist <= PERFECT_THR         ? 'perfect'
      : dist <= ZONE_HALF         ? 'good'
      : dist <= ZONE_HALF * 2.2   ? 'ok'
      : 'miss'

    const damage = DMG[quality]
    playChopping()

    if (quality !== 'miss') {
      setShake(true)
      setTimeout(() => setShake(false), 220)
    }

    // Track stats
    totalRef.current++
    if (quality === 'perfect') perfectRef.current++
    else if (quality === 'good') goodRef.current++

    // Float label
    const labelColor = quality === 'perfect' ? '#ffe050'
      : quality === 'good' ? '#90e040'
      : quality === 'ok'   ? '#a0a0a0'
      : '#ff5030'
    const labelText = quality === 'perfect' ? '⭐ Idealnie!'
      : quality === 'good' ? 'Trafiłeś!'
      : quality === 'ok'   ? 'Słabe...'
      : 'Pudło'
    const lid = labelIdRef.current++
    setLabels(prev => [...prev, { id: lid, y: markerY, text: labelText, color: labelColor }])
    setTimeout(() => setLabels(prev => prev.filter(l => l.id !== lid)), 900)

    // Wood chips from left side of trunk at hit Y
    const chipCount = quality === 'perfect' ? 8 : quality === 'good' ? 5 : quality === 'ok' ? 3 : 1
    const newChips: Chip[] = Array.from({ length: chipCount }, () => ({
      id: chipIdRef.current++,
      x: 0,
      y: markerY,
      dx: -(18 + Math.random() * 35),
      dy: (Math.random() - 0.4) * 22,
      rot: Math.random() * 360,
    }))
    setChips(prev => [...prev, ...newChips])
    setTimeout(() => setChips(prev => prev.filter(c => !newChips.some(n => n.id === c.id))), 600)

    // Shift sweet zone after each hit (stays within 20-80%)
    setSweetY(prev => {
      const delta = (Math.random() - 0.5) * 24
      return Math.max(20, Math.min(80, prev + delta))
    })

    // Apply damage
    const newHp = Math.max(0, hpRef.current - damage)
    hpRef.current = newHp
    setHp(newHp)

    if (newHp <= 0) {
      setGamePhase('falling')
      phaseRef.current = 'falling'
      setTimeout(() => {
        const s = calcStars(perfectRef.current, goodRef.current, totalRef.current)
        setStars(s)
        setLoot(rollLoot(s))
        setGamePhase('loot')
      }, 600)
    }
  }

  function handleCollect() {
    const newInv = { ...inventory }
    loot.forEach(l => { (newInv[l.item] as number) += l.amount })
    const xpGain = stars * 8
    const newProfs = addProfessionXp(professions, 'woodcutter', xpGain, true)
    onUpdate(newInv, newProfs, 5)
    // Reset
    perfectRef.current = 0
    goodRef.current = 0
    totalRef.current = 0
    hpRef.current = TOTAL_HP
    tRef.current = 0
    setHp(TOTAL_HP)
    setSweetY(50)
    setGamePhase('chopping')
    setLoot([])
    setStars(0)
    setFirstChop(false)
  }

  // ── Marker visual ─────────────────────────────────────────────────────────
  const dist      = Math.abs(markerY - sweetY)
  const proximity = Math.max(0, 1 - dist / (ZONE_HALF * 2.5))
  const inZone    = dist <= ZONE_HALF

  const markerColor = inZone
    ? 'rgba(255,255,200,0.98)'
    : proximity > 0.5
    ? `rgba(255,${Math.round(180 + proximity * 60)},60,0.9)`
    : 'rgba(140,190,255,0.75)'

  const markerGlow = inZone
    ? '0 0 22px rgba(255,240,80,1), 0 0 40px rgba(255,200,50,0.6)'
    : `0 0 ${7 + proximity * 14}px rgba(255,${Math.round(140 + proximity * 90)},50,${0.3 + proximity * 0.6})`

  const bandOpacity = 0.06 + proximity * 0.22

  const fallAngle = gamePhase === 'falling' ? 88 : treeAngle

  return (
    <div className="screen-enter" style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
      <img src="/assets/backgrounds/forest.webp" alt="" draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', pointerEvents: 'none', userSelect: 'none' }} />

      {/* Ambient */}
      <div style={{ position: 'absolute', left: '14%', top: '52%', width: '18%', height: '10%', borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(80,160,255,0.7) 0%,transparent 70%)', filter: 'blur(8px)', pointerEvents: 'none', mixBlendMode: 'screen', animation: 'ambiMine 2.8s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', left: '30%', top: '0%', width: '40%', height: '30%', background: 'radial-gradient(ellipse at 50% 0%,rgba(120,200,100,0.18) 0%,transparent 70%)', filter: 'blur(12px)', pointerEvents: 'none', mixBlendMode: 'screen', animation: 'ambiForest 5s ease-in-out infinite' }} />
      {PARTICLES.map((p, i) => (
        <div key={i} style={{ position: 'absolute', left: p.left, top: p.top, width: 4, height: 4, borderRadius: '50%', background: i % 2 === 0 ? 'rgba(120,255,180,0.85)' : 'rgba(80,200,255,0.85)', boxShadow: '0 0 6px 3px rgba(80,220,160,0.4)', pointerEvents: 'none', mixBlendMode: 'screen', animation: `forestFloat ${p.dur} ease-in-out ${p.delay} infinite`, transform: 'translate(-50%,-50%)' }} />
      ))}
      {FIREFLIES.map((f, i) => (
        <div key={i} style={{ position: 'absolute', left: f.left, top: f.top, width: 6, height: 6, borderRadius: '50%', background: f.col, boxShadow: `0 0 8px 4px ${f.col}`, pointerEvents: 'none', mixBlendMode: 'screen', animation: `fireflyBlink 2.2s ease-in-out ${f.delay} infinite`, transform: 'translate(-50%,-50%)' }} />
      ))}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 100, background: 'linear-gradient(180deg,rgba(2,8,4,0.82) 0%,transparent 100%)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '20px 16px 0', zIndex: 10 }}>
        <BackBtn onClick={onBack} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>🌲</span>
            <h2 style={{ fontFamily: 'Cinzel', fontSize: 20, fontWeight: 700, color: '#c8f0a0', margin: 0, textShadow: '0 0 16px rgba(80,200,80,0.6)' }}>Las</h2>
          </div>
          <p style={{ fontFamily: 'Crimson Text', fontSize: 13, color: '#b0d890', margin: '2px 0 0', fontStyle: 'italic', textShadow: '0 1px 6px rgba(0,0,0,0.95)' }}>Magiczny las goblinów</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{ background: 'rgba(10,20,8,0.85)', border: '1px solid rgba(100,180,60,0.5)', borderRadius: 10, padding: '4px 10px', backdropFilter: 'blur(8px)' }}>
            <span style={{ fontFamily: 'Cinzel', fontSize: 11, color: '#8ab060' }}>🪵</span>
            <span style={{ fontFamily: 'Cinzel', fontSize: 15, fontWeight: 700, color: '#a0d060', marginLeft: 5 }}>{inventory.wood}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.55)', borderRadius: 6, padding: '2px 6px', backdropFilter: 'blur(4px)' }}>
            <span style={{ fontFamily: 'Cinzel', fontSize: 10, color: '#90c060', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>🪓 lv.{prof.level}</span>
            <div style={{ width: 55, height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${xpPct}%`, background: 'linear-gradient(90deg,#3a7010,#80c030)', borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontFamily: 'Cinzel', fontSize: 9, color: '#80a860' }}>{xpLeft}/{xpNeeded}</span>
          </div>
        </div>
      </div>

      {/* Full-screen tap zone */}
      {gamePhase === 'chopping' && (
        <div
          onPointerDown={handleChop}
          style={{ position: 'absolute', inset: 0, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', zIndex: 5 }}
        />
      )}

      {/* ── Chopping area ───────────────────────────────────────────────────── */}
      {gamePhase !== 'loot' && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>

          {/* Hint */}
          <div style={{ height: 22 }}>
            {!firstChop && (
              <span style={{ fontFamily: 'Crimson Text', fontSize: 14, color: 'rgba(160,220,100,0.7)', fontStyle: 'italic', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
                Uderz gdy marker jest w złotej strefie
              </span>
            )}
          </div>

          {/* Trunk + marker */}
          <div className={shake ? 'rock-shake' : ''}>
            <div
              style={{
                position: 'relative',
                width: 'min(68px, 18vw)',
                height: 'min(295px, 65vh)',
                background: 'linear-gradient(90deg, #5a3620 0%, #8b5e3c 22%, #a07048 50%, #8b5e3c 78%, #5a3620 100%)',
                borderRadius: '5px 5px 10px 10px',
                cursor: 'default',
                userSelect: 'none',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transformOrigin: 'bottom center',
                transform: `rotate(${fallAngle}deg)`,
                transition: gamePhase === 'falling' ? 'transform 0.55s cubic-bezier(0.4,0,0.8,1)' : 'transform 0.15s ease-out',
                overflow: 'hidden',
              }}
            >
              {/* Vertical bark lines */}
              {BARK_LINES.map((b, i) => (
                <div key={i} style={{ position: 'absolute', left: `${b.x}%`, top: '4%', bottom: '2%', width: 1, background: `rgba(0,0,0,${b.o})`, pointerEvents: 'none' }} />
              ))}
              {/* Horizontal grain rings */}
              {GRAIN_RINGS.map((y, i) => (
                <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${y}%`, height: 1, background: 'rgba(0,0,0,0.09)', pointerEvents: 'none' }} />
              ))}

              {/* Sweet zone band */}
              <div style={{
                position: 'absolute', left: 0, right: 0,
                top: `${sweetY - ZONE_HALF}%`,
                height: `${ZONE_HALF * 2}%`,
                background: `rgba(255,210,60,${bandOpacity})`,
                borderTop: `1px solid rgba(255,210,60,${bandOpacity * 2.5})`,
                borderBottom: `1px solid rgba(255,210,60,${bandOpacity * 2.5})`,
                pointerEvents: 'none',
                transition: 'top 0.45s ease-out, background 0.15s, border-color 0.15s',
              }} />

              {/* Marker */}
              <div style={{
                position: 'absolute',
                left: '50%',
                top: `${markerY}%`,
                transform: 'translate(-50%, -50%)',
                width: inZone ? 28 : 22,
                height: inZone ? 28 : 22,
                borderRadius: '50%',
                background: markerColor,
                boxShadow: markerGlow,
                pointerEvents: 'none',
                transition: 'width 0.08s, height 0.08s, box-shadow 0.08s, background 0.08s',
              }} />

              {/* Wood chips */}
              {chips.map(c => (
                <div key={c.id} style={{
                  position: 'absolute',
                  left: '8%',
                  top: `${c.y}%`,
                  width: 5, height: 3,
                  borderRadius: 1,
                  background: '#9b6840',
                  pointerEvents: 'none',
                  '--dx': `${c.dx}px`,
                  '--dy': `${c.dy}px`,
                  animation: 'woodChip 0.55s ease-out both',
                } as React.CSSProperties} />
              ))}
            </div>
          </div>

          {/* Float labels (rendered outside rotating trunk) */}
          <div style={{ position: 'absolute', top: 0, left: '100%', width: 120, pointerEvents: 'none' }}>
            {labels.map(l => (
              <div key={l.id} style={{
                position: 'absolute',
                top: `${l.y}%`,
                left: 8,
                fontFamily: 'Cinzel', fontSize: 13, fontWeight: 700,
                color: l.color,
                textShadow: '0 1px 6px rgba(0,0,0,0.9)',
                whiteSpace: 'nowrap',
                animation: 'labelFloat 0.9s ease-out both',
                pointerEvents: 'none',
              }}>{l.text}</div>
            ))}
          </div>

          {/* HP bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 'min(200px, 55vw)' }}>
            <span style={{ fontFamily: 'Cinzel', fontSize: 9, color: 'rgba(120,180,60,0.6)', width: 14, textAlign: 'center' }}>♥</span>
            <div style={{ flex: 1, height: 8, background: 'rgba(0,0,0,0.5)', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{
                height: '100%', width: `${hpPct}%`,
                background: hpPct > 50 ? 'linear-gradient(90deg,#3a7010,#70b820)'
                  : hpPct > 25 ? 'linear-gradient(90deg,#7a6010,#c0a020)'
                  : 'linear-gradient(90deg,#7a2010,#c04020)',
                borderRadius: 4, transition: 'width 0.1s ease-out, background 0.3s',
                boxShadow: '0 0 6px rgba(100,200,40,0.4)',
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Loot overlay */}
      {gamePhase === 'loot' && <LootPanel stars={stars} loot={loot} onCollect={handleCollect} />}

      {/* Leave button */}
      {gamePhase !== 'loot' && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 16px 32px', background: 'linear-gradient(0deg,rgba(2,8,4,0.95) 0%,rgba(4,12,6,0.8) 60%,transparent 100%)', zIndex: 10 }}>
          <button className="btn-primary" onClick={onBack}
            style={{ background: 'rgba(5,15,5,0.8)', borderColor: 'rgba(60,120,40,0.3)', color: '#507040' }}>
            ← Opuść las
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Loot panel ──────────────────────────────────────────────────────────────

function LootPanel({ stars, loot, onCollect }: { stars: number; loot: LootItem[]; onCollect: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, background: 'rgba(0,8,0,0.72)', backdropFilter: 'blur(5px)', animation: 'slideUp 0.2s ease-out both' }}>
      <div style={{ display: 'flex', gap: 10 }}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} style={{ fontSize: 34, color: i < stars ? '#a8e840' : 'rgba(255,255,255,0.15)', filter: i < stars ? 'drop-shadow(0 0 8px rgba(120,220,40,0.7))' : 'none' }}>★</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', padding: '0 24px' }}>
        {loot.map((l, i) => (
          <div key={i} className="loot-pop" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(20,60,10,0.4)', border: '1px solid rgba(80,160,40,0.4)', borderRadius: 14, padding: '14px 22px', animationDelay: `${i * 0.1}s` }}>
            <span style={{ fontSize: 24 }}>{l.icon}</span>
            <span style={{ fontFamily: 'Cinzel', fontWeight: 700, fontSize: 24, color: '#a0d060' }}>+{l.amount}</span>
            <span style={{ fontFamily: 'Crimson Text', fontSize: 16, color: '#80b050' }}>{l.label}</span>
          </div>
        ))}
      </div>
      <button className="btn-primary" onClick={onCollect}
        style={{ background: 'linear-gradient(135deg,#2a6010,#4a9020)', borderColor: '#70c030', animation: 'lootPop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.3s both' }}>
        Tnij dalej! 🪓
      </button>
    </div>
  )
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#a0b890', fontFamily: 'Cinzel', fontSize: 16, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation', backdropFilter: 'blur(4px)' }}>←</button>
  )
}
