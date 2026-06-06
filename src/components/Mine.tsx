import { useState, useEffect, useRef } from 'react'
import type { Inventory, Professions } from '../types'
import { playMining, startMineAmbience, stopMineAmbience } from '../sounds'
import { addProfessionXp, xpProgress, xpToNextLevel, xpForLevel } from '../store'

const TOTAL_HP = 100
const MAX_CHARGE_DAMAGE = 42   // full charge + peak
const MIN_DAMAGE = 5           // instant tap
const PEAK_BONUS = 1.4         // +40% for releasing during peak
const CHARGE_FILL_MS = 2600    // ms to fill charge 0→100

type PulsePhase = 'silent' | 'rising' | 'peak' | 'falling'
type LootItem = { item: keyof Inventory; amount: number; label: string; icon: string }
interface Spark { id: number; x: number; y: number; dx: number; dy: number }

function calcStars(peakHits: number, totalHits: number, elapsedMs: number): number {
  if (totalHits === 0) return 1
  const acc = peakHits / totalHits
  const sec = elapsedMs / 1000
  if (acc >= 0.75 && sec < 10) return 5
  if (acc >= 0.55 && sec < 16) return 4
  if (acc >= 0.35) return 3
  if (acc >= 0.15) return 2
  return 1
}

function rollLoot(stars: number): LootItem[] {
  const loot: LootItem[] = []
  const stone = 1 + Math.floor(Math.random() * (stars >= 4 ? 3 : 2))
  loot.push({ item: 'stone', amount: stone, label: 'Kamień', icon: '🪨' })
  const r = Math.random()
  const copper  = 0.10 + stars * 0.02
  const iron    = 0.03 + stars * 0.01
  const diamond = 0.004 + stars * 0.0012
  if (r < diamond)                 loot.push({ item: 'diamond',  amount: 1, label: 'Diament',       icon: '💎' })
  else if (r < diamond + iron)     loot.push({ item: 'ironOre',  amount: 1, label: 'Ruda żelaza',   icon: '⚙️' })
  else if (r < diamond + iron + copper) loot.push({ item: 'copperOre', amount: 1, label: 'Ruda miedzi', icon: '🔶' })
  return loot
}

const CRYSTALS = [
  { left: '46%', top: '6%',  size: '22%', h: '11%', delay: '0s'   },
  { left: '80%', top: '83%', size: '16%', h: '8%',  delay: '0.8s' },
  { left: '5%',  top: '45%', size: '10%', h: '6%',  delay: '1.4s' },
  { left: '65%', top: '55%', size: '10%', h: '6%',  delay: '2s'   },
]
const LANTERNS = [
  { left: '22%', top: '28%', delay: '0s'   },
  { left: '62%', top: '22%', delay: '0.5s' },
  { left: '84%', top: '38%', delay: '1.1s' },
]
const DUST = [
  { left: '30%', top: '40%', delay: '0s',   dur: '6s'   },
  { left: '55%', top: '30%', delay: '1.5s', dur: '5s'   },
  { left: '70%', top: '55%', delay: '0.8s', dur: '7s'   },
  { left: '20%', top: '60%', delay: '3s',   dur: '5.5s' },
  { left: '45%', top: '20%', delay: '2s',   dur: '6.5s' },
]

interface Props {
  inventory: Inventory
  professions: Professions
  energy: number
  onUpdate: (inv: Inventory, profs: Professions, energyCost?: number) => void
  onBack: () => void
}

export default function Mine({ inventory, professions, onUpdate, onBack }: Props) {
  const [hp, setHp] = useState(TOTAL_HP)
  const [holding, setHolding] = useState(false)
  const [charge, setCharge] = useState(0)          // 0–100
  const [pulsePhase, setPulsePhase] = useState<PulsePhase>('silent')
  const [peakRingKey, setPeakRingKey] = useState(0)
  const [shake, setShake] = useState(false)
  const [missFlash, setMissFlash] = useState(false)
  const [sparks, setSparks] = useState<Spark[]>([])
  const [gamePhase, setGamePhase] = useState<'mining' | 'loot'>('mining')
  const [loot, setLoot] = useState<LootItem[]>([])
  const [stars, setStars] = useState(0)
  const [firstHit, setFirstHit] = useState(false)

  const holdingRef     = useRef(false)
  const chargeRef      = useRef(0)
  const hpRef          = useRef(TOTAL_HP)
  const pulseRef       = useRef<PulsePhase>('silent')
  const gamePhaseRef   = useRef<'mining' | 'loot'>('mining')
  const peakHitsRef    = useRef(0)
  const totalHitsRef   = useRef(0)
  const startRef       = useRef(Date.now())
  const sparkIdRef     = useRef(0)
  const rockRef        = useRef<HTMLDivElement>(null)

  const prof   = professions.miner
  const xpPct  = xpProgress(prof.xp, prof.level) * 100
  const xpLeft = prof.xp - xpForLevel(prof.level)
  const xpNeeded = xpToNextLevel(prof.level)
  const hpPct  = (hp / TOTAL_HP) * 100
  const crackLevel = Math.floor((1 - hp / TOTAL_HP) * 4)

  useEffect(() => { startMineAmbience(); return () => stopMineAmbience() }, [])

  // Keep gamePhaseRef in sync
  useEffect(() => { gamePhaseRef.current = gamePhase }, [gamePhase])

  // ── Rhythm loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'mining') return
    const timers: ReturnType<typeof setTimeout>[] = []
    let dead = false
    const s = (fn: () => void, ms: number) => { const t = setTimeout(fn, ms); timers.push(t) }

    function cycle() {
      if (dead) return
      const hpRatio = hpRef.current / TOTAL_HP
      const gap = 380 + hpRatio * 1020  // 380 ms (frantic) → 1400 ms (calm)

      setPulsePhase('silent');  pulseRef.current = 'silent'
      s(() => {
        if (dead) return
        setPulsePhase('rising'); pulseRef.current = 'rising'
        s(() => {
          if (dead) return
          setPulsePhase('peak');   pulseRef.current = 'peak'
          setPeakRingKey(k => k + 1)
          s(() => {
            if (dead) return
            // Miss penalty – still holding when peak ends
            if (holdingRef.current && chargeRef.current > 8) {
              chargeRef.current = Math.max(0, chargeRef.current - 38)
              setCharge(chargeRef.current)
              setMissFlash(true)
              s(() => setMissFlash(false), 320)
            }
            setPulsePhase('falling'); pulseRef.current = 'falling'
            s(cycle, 270)
          }, 410)
        }, 230)
      }, gap)
    }

    cycle()
    return () => { dead = true; timers.forEach(clearTimeout) }
  }, [gamePhase])

  // ── Charge fills while holding ───────────────────────────────────────────
  useEffect(() => {
    if (!holding || gamePhase !== 'mining') return
    const iv = setInterval(() => {
      setCharge(prev => {
        const next = Math.min(100, prev + (100 / CHARGE_FILL_MS) * 30)
        chargeRef.current = next
        return next
      })
    }, 30)
    return () => clearInterval(iv)
  }, [holding, gamePhase])

  // ── Global pointer up ────────────────────────────────────────────────────
  useEffect(() => {
    const up = () => { if (holdingRef.current) release() }
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => { window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up) }
  }, [])   // release uses only refs → safe without deps

  function startHold(e: React.PointerEvent) {
    if (gamePhaseRef.current !== 'mining' || holdingRef.current) return
    e.preventDefault()
    holdingRef.current = true
    setHolding(true)
  }

  function release() {
    if (!holdingRef.current || gamePhaseRef.current !== 'mining') return
    holdingRef.current = false
    setHolding(false)

    const c   = chargeRef.current
    const peak = pulseRef.current === 'peak'
    chargeRef.current = 0
    setCharge(0)

    const base   = MIN_DAMAGE + (c / 100) * (MAX_CHARGE_DAMAGE - MIN_DAMAGE)
    const damage = Math.round(peak ? base * PEAK_BONUS : base)

    totalHitsRef.current++
    if (peak && c > 25) peakHitsRef.current++
    if (!firstHit) setFirstHit(true)

    playMining()
    if (damage >= 14) { setShake(true); setTimeout(() => setShake(false), 280) }

    // Sparks – quantity and speed scale with damage
    const count = Math.max(3, Math.floor(damage / 4))
    const newSparks: Spark[] = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.8
      const speed = 14 + Math.random() * (18 + damage * 0.6)
      return {
        id: sparkIdRef.current++,
        x: 35 + Math.random() * 30,
        y: 30 + Math.random() * 35,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
      }
    })
    setSparks(p => [...p, ...newSparks])
    setTimeout(() => setSparks(p => p.filter(s => !newSparks.some(n => n.id === s.id))), 580)

    setHp(prev => {
      const next = Math.max(0, prev - damage)
      hpRef.current = next
      if (next <= 0) {
        const elapsed = Date.now() - startRef.current
        const s = calcStars(peakHitsRef.current, totalHitsRef.current, elapsed)
        setStars(s)
        setLoot(rollLoot(s))
        setGamePhase('loot')
      }
      return next
    })
  }

  function handleCollect() {
    const newInv = { ...inventory }
    loot.forEach(l => { (newInv[l.item] as number) += l.amount })
    const newProfs = addProfessionXp(professions, 'miner', stars * 8, true)
    onUpdate(newInv, newProfs, 5)
    peakHitsRef.current = 0
    totalHitsRef.current = 0
    startRef.current = Date.now()
    hpRef.current = TOTAL_HP
    setHp(TOTAL_HP)
    setGamePhase('mining')
    setLoot([])
    setStars(0)
  }

  // ── Visuals ───────────────────────────────────────────────────────────────
  const glowIntensity = pulsePhase === 'silent' ? 0.12 : pulsePhase === 'rising' ? 0.55 : pulsePhase === 'peak' ? 1.0 : 0.3

  const chargeColor = charge < 33 ? `rgba(60,120,255,${0.5 + charge/120})`
    : charge < 66 ? 'rgba(255,200,50,0.75)'
    : 'rgba(255,100,30,0.9)'

  const rockShadow = [
    '0 14px 44px rgba(0,0,0,0.9)',
    `0 0 ${28 + glowIntensity * 65}px rgba(255,${Math.round(80 + glowIntensity * 130)},30,${0.12 + glowIntensity * 0.72})`,
    holding
      ? `inset 0 0 ${14 + charge * 0.38}px ${chargeColor}`
      : 'inset 0 -6px 16px rgba(0,0,0,0.5)',
    missFlash ? '0 0 45px rgba(255,30,30,0.85)' : '',
  ].filter(Boolean).join(', ')

  const rockBg = crackLevel === 0 ? 'radial-gradient(ellipse at 45% 38%, #8a7260 0%, #5a4535 45%, #3a2a1e 100%)'
    : crackLevel === 1 ? 'radial-gradient(ellipse at 45% 38%, #7a6250 0%, #4e3a2a 45%, #30221a 100%)'
    : crackLevel === 2 ? 'radial-gradient(ellipse at 45% 38%, #6a5242 0%, #42302a 45%, #281a12 100%)'
    : 'radial-gradient(ellipse at 45% 38%, #5a3e32 0%, #36281e 45%, #201410 100%)'

  const rockScale = pulsePhase === 'peak' ? 1.026 : pulsePhase === 'rising' ? 1.01 : 1.0

  return (
    <div className="screen-enter" style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
      <img src="/assets/backgrounds/mine.webp" alt="" draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', pointerEvents: 'none', userSelect: 'none' }} />

      {CRYSTALS.map((c, i) => (
        <div key={i} style={{ position: 'absolute', left: c.left, top: c.top, width: c.size, height: c.h, transform: 'translate(-50%,0)', borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(60,140,255,0.65) 0%,transparent 70%)', filter: 'blur(7px)', pointerEvents: 'none', mixBlendMode: 'screen', animation: `ambiMine 3s ease-in-out ${c.delay} infinite` }} />
      ))}
      {LANTERNS.map((l, i) => (
        <div key={i} style={{ position: 'absolute', left: l.left, top: l.top, width: 12, height: 12, borderRadius: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(255,200,80,0.95)', boxShadow: '0 0 16px 8px rgba(255,180,50,0.5)', pointerEvents: 'none', mixBlendMode: 'screen', animation: `ambiLantern 1.8s ease-in-out ${l.delay} infinite` }} />
      ))}
      {DUST.map((d, i) => (
        <div key={i} style={{ position: 'absolute', left: d.left, top: d.top, width: 3, height: 3, borderRadius: '50%', background: 'rgba(180,160,140,0.6)', pointerEvents: 'none', animation: `mineDust ${d.dur} ease-in-out ${d.delay} infinite`, transform: 'translate(-50%,-50%)' }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%,transparent 40%,rgba(5,10,30,0.25) 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 110, background: 'linear-gradient(180deg,rgba(2,4,15,0.88) 0%,transparent 100%)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '20px 16px 0' }}>
        <BackBtn onClick={onBack} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>⛏️</span>
            <h2 style={{ fontFamily: 'Cinzel', fontSize: 20, fontWeight: 700, color: '#a0c8f0', margin: 0, textShadow: '0 0 16px rgba(60,120,255,0.5)' }}>Kopalnia</h2>
          </div>
          <p style={{ fontFamily: 'Crimson Text', fontSize: 13, color: '#90b8d8', margin: '2px 0 0', fontStyle: 'italic', textShadow: '0 1px 6px rgba(0,0,0,0.95)' }}>Głębiny pełne kryształów</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{ background: 'rgba(5,8,20,0.85)', border: '1px solid rgba(60,100,200,0.5)', borderRadius: 10, padding: '4px 10px', backdropFilter: 'blur(8px)' }}>
            <span style={{ fontFamily: 'Cinzel', fontSize: 11, color: '#6080b0' }}>🪨</span>
            <span style={{ fontFamily: 'Cinzel', fontSize: 15, fontWeight: 700, color: '#80a0d0', marginLeft: 5 }}>{inventory.stone}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.55)', borderRadius: 6, padding: '2px 6px', backdropFilter: 'blur(4px)' }}>
            <span style={{ fontFamily: 'Cinzel', fontSize: 10, color: '#80a8d0', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>⛏ lv.{prof.level}</span>
            <div style={{ width: 55, height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${xpPct}%`, background: 'linear-gradient(90deg,#1a3060,#4080d0)', borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontFamily: 'Cinzel', fontSize: 9, color: '#6080a0' }}>{xpLeft}/{xpNeeded}</span>
          </div>
        </div>
      </div>

      {/* ── Mining area ──────────────────────────────────────────────────────── */}
      {gamePhase === 'mining' && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -52%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

          {/* Dynamic hint */}
          <div style={{ height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!firstHit && !holding && (
              <span style={{ fontFamily: 'Crimson Text', fontSize: 14, color: 'rgba(180,150,100,0.75)', fontStyle: 'italic', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
                Przytrzymaj skałę
              </span>
            )}
            {holding && pulsePhase !== 'peak' && (
              <span style={{ fontFamily: 'Cinzel', fontSize: 13, color: 'rgba(120,160,220,0.7)', letterSpacing: 2 }}>
                · · ·
              </span>
            )}
            {holding && pulsePhase === 'peak' && (
              <span style={{ fontFamily: 'Cinzel', fontSize: 15, fontWeight: 700, color: '#ffb830', textShadow: '0 0 12px rgba(255,180,30,0.8)', letterSpacing: 1 }}>
                ⚡ PUŚĆ!
              </span>
            )}
          </div>

          {/* Rock + shake wrapper */}
          <div className={shake ? 'rock-shake' : ''}>
            <div
              ref={rockRef}
              onPointerDown={startHold}
              style={{
                position: 'relative',
                width: 'min(270px, 76vw)',
                height: 'min(192px, 54vw)',
                borderRadius: '45% 55% 42% 58% / 52% 48% 56% 44%',
                background: rockBg,
                boxShadow: rockShadow,
                transform: `scale(${rockScale})`,
                transition: 'box-shadow 0.16s ease-out, transform 0.16s ease-out',
                cursor: 'pointer',
                userSelect: 'none',
                touchAction: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Surface texture */}
              {[{l:'22%',t:'30%',s:8},{l:'60%',t:'18%',s:6},{l:'75%',t:'58%',s:9},{l:'35%',t:'65%',s:7},{l:'50%',t:'42%',s:5},{l:'15%',t:'55%',s:6}].map((d, i) => (
                <div key={i} style={{ position: 'absolute', left: d.l, top: d.t, width: d.s, height: d.s * 0.6, borderRadius: '50%', background: 'rgba(0,0,0,0.22)', pointerEvents: 'none' }} />
              ))}

              {/* Cracks */}
              {crackLevel >= 1 && (
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }} viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M 48,12 L 52,28 L 46,40" stroke="rgba(0,0,0,0.55)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
              )}
              {crackLevel >= 2 && (
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }} viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M 48,12 L 52,28 L 46,40 L 50,58 L 44,72" stroke="rgba(0,0,0,0.65)" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <path d="M 68,22 L 63,38 L 72,52" stroke="rgba(0,0,0,0.45)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                </svg>
              )}
              {crackLevel >= 3 && (
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }} viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M 48,12 L 52,28 L 46,40 L 50,58 L 44,72 L 50,85" stroke="rgba(0,0,0,0.75)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <path d="M 68,22 L 63,38 L 72,52 L 65,65" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M 28,32 L 34,48 L 26,60" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                  <path d="M 52,28 L 64,34" stroke="rgba(0,0,0,0.4)" strokeWidth="1" fill="none" strokeLinecap="round" />
                </svg>
              )}

              {/* Peak ripple ring */}
              {pulsePhase === 'peak' && (
                <div key={peakRingKey} style={{
                  position: 'absolute',
                  left: '50%', top: '50%',
                  width: '115%', height: '115%',
                  borderRadius: '45% 55% 42% 58% / 52% 48% 56% 44%',
                  border: '3px solid rgba(255,180,50,0.85)',
                  pointerEvents: 'none',
                  animation: 'peakRipple 0.42s ease-out both',
                  transform: 'translate(-50%,-50%)',
                }} />
              )}

              {/* Sparks */}
              {sparks.map(s => (
                <div key={s.id} style={{
                  position: 'absolute',
                  left: `${s.x}%`, top: `${s.y}%`,
                  width: 5, height: 5, borderRadius: '50%',
                  background: Math.random() > 0.5 ? '#ffb040' : '#ff7020',
                  pointerEvents: 'none',
                  '--dx': `${s.dx}px`,
                  '--dy': `${s.dy}px`,
                  animation: 'sparkFly 0.52s ease-out both',
                } as React.CSSProperties} />
              ))}
            </div>
          </div>

          {/* Charge bar + HP bar */}
          <div style={{ width: 'min(270px, 76vw)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Charge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'Cinzel', fontSize: 9, color: 'rgba(180,140,80,0.6)', width: 14, textAlign: 'center' }}>⚡</span>
              <div style={{ flex: 1, height: 7, background: 'rgba(0,0,0,0.4)', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{
                  height: '100%', width: `${charge}%`,
                  background: charge < 33 ? 'linear-gradient(90deg,#1a3080,#2060d0)'
                    : charge < 66 ? 'linear-gradient(90deg,#806020,#d0a030)'
                    : 'linear-gradient(90deg,#c04010,#ff6820)',
                  borderRadius: 4,
                  transition: 'width 0.04s linear, background 0.4s',
                  boxShadow: holding ? `0 0 8px ${chargeColor}` : 'none',
                }} />
              </div>
            </div>
            {/* HP */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'Cinzel', fontSize: 9, color: 'rgba(160,80,50,0.6)', width: 14, textAlign: 'center' }}>♥</span>
              <div style={{ flex: 1, height: 10, background: 'rgba(0,0,0,0.55)', borderRadius: 5, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{
                  height: '100%', width: `${hpPct}%`,
                  background: hpPct > 50 ? 'linear-gradient(90deg,#b84020,#e06030)'
                    : hpPct > 25 ? 'linear-gradient(90deg,#903020,#c04828)'
                    : 'linear-gradient(90deg,#601818,#982020)',
                  borderRadius: 5, transition: 'width 0.1s ease-out, background 0.3s',
                  boxShadow: '0 0 8px rgba(255,70,30,0.5)',
                }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loot overlay */}
      {gamePhase === 'loot' && <LootPanel stars={stars} loot={loot} onCollect={handleCollect} />}

      {/* Leave button */}
      {gamePhase === 'mining' && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 16px 32px', background: 'linear-gradient(0deg,rgba(2,4,15,0.95) 0%,rgba(4,8,25,0.8) 60%,transparent 100%)' }}>
          <button className="btn-primary" onClick={onBack}
            style={{ background: 'rgba(5,10,25,0.8)', borderColor: 'rgba(60,100,200,0.3)', color: '#5070a0' }}>
            ← Opuść kopalnię
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Loot panel ──────────────────────────────────────────────────────────────

function LootPanel({ stars, loot, onCollect }: { stars: number; loot: LootItem[]; onCollect: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, background: 'rgba(0,0,10,0.72)', backdropFilter: 'blur(5px)', animation: 'slideUp 0.2s ease-out both' }}>
      <div style={{ display: 'flex', gap: 10 }}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} style={{ fontSize: 34, color: i < stars ? '#f8c030' : 'rgba(255,255,255,0.15)', filter: i < stars ? 'drop-shadow(0 0 8px rgba(255,200,0,0.7))' : 'none' }}>★</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', padding: '0 24px' }}>
        {loot.length === 0
          ? <div style={{ fontFamily: 'Cinzel', fontSize: 14, color: '#3a4a60', background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: '14px 24px', border: '1px solid rgba(40,60,100,0.3)' }}>Pusta skała...</div>
          : loot.map((l, i) => (
            <div key={i} className="loot-pop" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(20,40,100,0.35)', border: '1px solid rgba(60,120,200,0.4)', borderRadius: 14, padding: '14px 22px', animationDelay: `${i * 0.1}s` }}>
              <span style={{ fontSize: 24 }}>{l.icon}</span>
              <span style={{ fontFamily: 'Cinzel', fontWeight: 700, fontSize: 24, color: '#a0c0e0' }}>+{l.amount}</span>
              <span style={{ fontFamily: 'Crimson Text', fontSize: 16, color: '#80a8c8' }}>{l.label}</span>
            </div>
          ))
        }
      </div>
      <button className="btn-primary" onClick={onCollect}
        style={{ background: 'linear-gradient(135deg,#1a3060,#2a50a0)', borderColor: '#4080d0', animation: 'lootPop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.3s both' }}>
        Kop dalej! ⛏
      </button>
    </div>
  )
}

// ─── Back button ─────────────────────────────────────────────────────────────

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#8090b0', fontFamily: 'Cinzel', fontSize: 16, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation', backdropFilter: 'blur(4px)' }}>←</button>
  )
}
