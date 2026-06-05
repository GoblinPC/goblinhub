import type { Professions, ProfessionKey } from '../types'
import { xpProgress, xpToNextLevel, xpForLevel } from '../store'

interface Props {
  professions: Professions
  characterXp: number
  characterLevel: number
  onBack: () => void
}

const PROF_META: Record<ProfessionKey, { icon: string; label: string; color: string; glow: string }> = {
  woodcutter:  { icon: '🪓', label: 'Drwal',    color: '#80c030', glow: 'rgba(80,200,30,0.4)'   },
  miner:       { icon: '⛏',  label: 'Górnik',   color: '#6090d0', glow: 'rgba(60,120,255,0.4)'  },
  blacksmith:  { icon: '🔨', label: 'Kowal',    color: '#e08030', glow: 'rgba(220,120,30,0.4)'  },
  herbalist:   { icon: '🌿', label: 'Zielarz',  color: '#40c060', glow: 'rgba(40,180,60,0.4)'   },
  fisher:      { icon: '🎣', label: 'Rybak',    color: '#40b0c0', glow: 'rgba(40,160,200,0.4)'  },
  warrior:     { icon: '⚔️', label: 'Wojownik', color: '#d04040', glow: 'rgba(200,40,40,0.4)'   },
}

export default function StatsScreen({ professions, characterXp, characterLevel, onBack }: Props) {
  const charPct = xpProgress(characterXp, characterLevel) * 100
  const charNeeded = xpToNextLevel(characterLevel)
  const charCurrent = characterXp - xpForLevel(characterLevel)

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: '#080604', overflowY: 'auto' }}>

      {/* Ambient tło */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(60,30,10,0.6) 0%, #080604 60%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '20px 16px 40px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button onClick={onBack} style={{
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '10px', color: '#c0a060', fontFamily: 'Cinzel', fontSize: '16px',
            width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', touchAction: 'manipulation', backdropFilter: 'blur(4px)', flexShrink: 0,
          }}>←</button>
          <div>
            <h2 style={{ fontFamily: 'Cinzel', fontSize: '20px', fontWeight: 700, color: '#e0c080', margin: 0, textShadow: '0 0 16px rgba(200,140,40,0.6)' }}>Statystyki</h2>
            <p style={{ fontFamily: 'Crimson Text', fontSize: '13px', color: '#907050', margin: '2px 0 0', fontStyle: 'italic' }}>Kronika goblinich dokonań</p>
          </div>
        </div>

        {/* Karta postaci */}
        <div style={{
          background: 'rgba(20,14,6,0.9)', border: '1px solid rgba(200,140,50,0.4)',
          borderRadius: 16, padding: '18px 20px', marginBottom: 20,
          boxShadow: '0 0 30px rgba(180,100,20,0.15), inset 0 1px 0 rgba(255,200,80,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(200,140,40,0.3) 0%, rgba(100,60,10,0.6) 100%)',
              border: '2px solid rgba(200,140,50,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, flexShrink: 0,
              boxShadow: '0 0 16px rgba(180,120,30,0.4)',
            }}>🧝</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: 'Cinzel', fontSize: '18px', fontWeight: 700, color: '#e0c070', textShadow: '0 0 12px rgba(200,150,40,0.5)' }}>Goblin</span>
                <span style={{ fontFamily: 'Cinzel', fontSize: '13px', color: '#b08040' }}>lv. {characterLevel}</span>
              </div>
              <XpBar pct={charPct} color="#c8901e" glow="rgba(200,140,30,0.5)" current={charCurrent} needed={charNeeded} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatChip label="Łączne XP" value={characterXp.toLocaleString()} color="#c09040" />
            <StatChip label="Profesji" value={Object.values(professions).filter(p => p.xp > 0).length.toString()} color="#8070a0" />
          </div>
        </div>

        {/* Profesje */}
        <h3 style={{ fontFamily: 'Cinzel', fontSize: '13px', color: '#7a6040', letterSpacing: '0.08em', margin: '0 0 12px', textTransform: 'uppercase' }}>Profesje</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(Object.keys(PROF_META) as ProfessionKey[]).map(key => {
            const prof = professions[key]
            const meta = PROF_META[key]
            const pct = xpProgress(prof.xp, prof.level) * 100
            const needed = xpToNextLevel(prof.level)
            const current = prof.xp - xpForLevel(prof.level)
            return (
              <ProfCard
                key={key}
                icon={meta.icon}
                label={meta.label}
                level={prof.level}
                expeditions={prof.expeditions}
                xp={prof.xp}
                pct={pct}
                color={meta.color}
                glow={meta.glow}
                current={current}
                needed={needed}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function XpBar({ pct, color, glow, current, needed }: { pct: number; color: string; glow: string; current: number; needed: number }) {
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 3,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          boxShadow: `0 0 8px ${glow}`,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <div style={{ fontFamily: 'Cinzel', fontSize: '9px', color: '#6a5030', marginTop: 3 }}>
        {current} / {needed} XP
      </div>
    </div>
  )
}

function ProfCard({ icon, label, level, expeditions, xp, pct, color, glow, current, needed }: {
  icon: string; label: string; level: number; expeditions: number; xp: number
  pct: number; color: string; glow: string; current: number; needed: number
}) {
  const isUnlocked = xp > 0
  return (
    <div style={{
      background: isUnlocked ? 'rgba(16,12,6,0.9)' : 'rgba(10,8,5,0.7)',
      border: `1px solid ${isUnlocked ? color + '40' : 'rgba(60,50,40,0.3)'}`,
      borderRadius: 12, padding: '14px 16px',
      boxShadow: isUnlocked ? `0 0 20px ${glow}20` : 'none',
      opacity: isUnlocked ? 1 : 0.55,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: isUnlocked ? `radial-gradient(circle, ${color}25 0%, transparent 70%)` : 'rgba(40,30,20,0.5)',
          border: `1px solid ${isUnlocked ? color + '50' : 'rgba(60,50,40,0.3)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: 'Cinzel', fontSize: '14px', fontWeight: 700, color: isUnlocked ? color : '#4a3820', textShadow: isUnlocked ? `0 0 10px ${glow}` : 'none' }}>{label}</span>
            <span style={{ fontFamily: 'Cinzel', fontSize: '12px', color: isUnlocked ? '#c0a060' : '#3a2e20' }}>lv. {level}</span>
          </div>
          <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 2.5, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`, borderRadius: 2.5,
              background: `linear-gradient(90deg, ${color}80, ${color})`,
              boxShadow: `0 0 6px ${glow}`,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
            <span style={{ fontFamily: 'Cinzel', fontSize: '9px', color: '#5a4830' }}>{current}/{needed} XP</span>
            {expeditions > 0 && <span style={{ fontFamily: 'Cinzel', fontSize: '9px', color: '#4a3820' }}>wyprawy: {expeditions}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.4)', border: `1px solid ${color}30`,
      borderRadius: 8, padding: '4px 10px', display: 'flex', gap: 6, alignItems: 'center',
    }}>
      <span style={{ fontFamily: 'Cinzel', fontSize: '9px', color: '#6a5030', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontFamily: 'Cinzel', fontSize: '12px', fontWeight: 700, color }}>{value}</span>
    </div>
  )
}
