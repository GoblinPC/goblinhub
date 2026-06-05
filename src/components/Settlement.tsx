import { useEffect, useState, useRef } from 'react'
import type { Screen, Inventory } from '../types'
import { startHubMusic, stopHubMusic, playHoverPreview, stopHoverPreview } from '../sounds'

type HoveredBuilding = 'forge' | 'forest' | 'mine' | null

// ─── HOTSPOT CONFIG ───────────────────────────────────────────────────────────
// Wszystkie pozycje w % względem kontenera 9:16.
// Zmień te wartości, żeby dopasować hotspoty do grafiki.
const HOTSPOTS = {
  forge: {
    top: '10%',
    left: '0%',
    width: '46%',
    height: '46%',
    label: 'Kuźnia',
    glowColor: 'rgba(240, 100, 20, 0.35)',
    borderColor: 'rgba(240, 130, 40, 0.6)',
  },
  forest: {
    top: '0%',
    right: '0%',
    width: '56%',
    height: '50%',
    label: 'Las',
    glowColor: 'rgba(40, 200, 120, 0.25)',
    borderColor: 'rgba(60, 220, 140, 0.55)',
  },
  mine: {
    top: '53%',
    left: '0%',
    width: '42%',
    height: '31%',
    label: 'Kopalnia',
    glowColor: 'rgba(60, 120, 240, 0.3)',
    borderColor: 'rgba(80, 160, 255, 0.6)',
  },
} as const

// ─── AMBIENT FX CONFIG ────────────────────────────────────────────────────────
// Pozycje efektów świetlnych w % — łatwe do przesunięcia.
const FORGE_GLOW  = { left: '21%', top:  '33%', w: '14%', h: '9%'  }
const MINE_GLOW   = { left: '10%', top:  '63%', w: '14%', h: '8%'  }
const FOREST_GLOW = { left: '55%', top:  '22%', w: '16%', h: '9%'  }

const LANTERNS = [
  { left: '28%', top: '57%' },
  { left:  '7%', top: '84%' },
  { left: '22%', top: '67%' },
  { left: '42%', top: '60%' },
]

const PARTICLES = [
  { left: '58%', top: '14%', delay: '0s'    },
  { left: '72%', top: '28%', delay: '0.6s'  },
  { left: '65%', top: '10%', delay: '1.2s'  },
  { left: '80%', top: '20%', delay: '0.3s'  },
  { left: '62%', top: '36%', delay: '1.8s'  },
  { left: '76%', top: '32%', delay: '0.9s'  },
  { left: '68%', top: '40%', delay: '2.1s'  },
]
// ─── Hover effect particles ───────────────────────────────────────────────────

const FORGE_HOVER_EMBERS = [
  { left: '16%', top: '46%', delay: '0s',   dur: '1.4s' },
  { left: '20%', top: '44%', delay: '0.3s', dur: '1.2s' },
  { left: '13%', top: '48%', delay: '0.6s', dur: '1.6s' },
  { left: '24%', top: '45%', delay: '0.9s', dur: '1.3s' },
  { left: '18%', top: '47%', delay: '1.2s', dur: '1.5s' },
]

const MINE_HOVER_CRYSTALS = [
  { left: '10%', top: '58%', delay: '0s'    },
  { left: '18%', top: '65%', delay: '0.15s' },
  { left:  '6%', top: '72%', delay: '0.3s'  },
  { left: '25%', top: '60%', delay: '0.45s' },
  { left: '14%', top: '78%', delay: '0.6s'  },
  { left: '30%', top: '68%', delay: '0.2s'  },
]

const FOREST_HOVER_PARTICLES = [
  { left: '52%', top: '12%', delay: '0s',   dur: '1.8s' },
  { left: '68%', top: '20%', delay: '0.2s', dur: '2s'   },
  { left: '78%', top: '10%', delay: '0.4s', dur: '1.6s' },
  { left: '60%', top: '28%', delay: '0.6s', dur: '2.2s' },
  { left: '85%', top: '18%', delay: '0.1s', dur: '1.9s' },
  { left: '73%', top: '35%', delay: '0.8s', dur: '1.7s' },
]
// ──────────────────────────────────────────────────────────────────────────────

interface Props {
  inventory: Inventory
  onNavigate: (screen: Screen) => void
}

export default function Settlement({ inventory, onNavigate }: Props) {
  const total = Object.values(inventory).reduce((a, b) => a + b, 0)
  const [hovered, setHovered] = useState<HoveredBuilding>(null)
  const hoverRef = useRef<HoveredBuilding>(null)

  useEffect(() => {
    startHubMusic()
    return () => stopHubMusic()
  }, [])

  function onEnter(id: Exclude<HoveredBuilding, null>) {
    if (hoverRef.current === id) return
    hoverRef.current = id
    setHovered(id)
    playHoverPreview(id)
  }

  function onLeave() {
    hoverRef.current = null
    setHovered(null)
    stopHoverPreview()
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden', background: '#0a0806' }}>

      {/* ── Background image ─────────────────────────────────────── */}
      <img
        src="/assets/backgrounds/settlement.webp"
        alt="Goblinia osada"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center top',
          userSelect: 'none',
          pointerEvents: 'none',
          draggable: false,
        } as React.CSSProperties}
        draggable={false}
      />

      {/* ── Ambient: Forge glow (intensywniejszy przy hover) ─────── */}
      <div className="amb-forge-glow" style={{
        position: 'absolute', left: FORGE_GLOW.left, top: FORGE_GLOW.top,
        width: FORGE_GLOW.w, height: FORGE_GLOW.h, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(255,160,40,0.55) 0%, transparent 70%)',
        filter: 'blur(6px)', pointerEvents: 'none', mixBlendMode: 'screen',
        transition: 'opacity 0.3s, transform 0.3s',
        opacity: hovered === 'forge' ? 0 : 1,
      }} />

      {/* ── Hover burst: Kuźnia – wielki płomień ─────────────────── */}
      <div style={{
        position: 'absolute', left: '10%', top: '22%', width: '36%', height: '38%',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(255,140,20,0.82) 0%, rgba(255,80,10,0.4) 45%, transparent 70%)',
        filter: 'blur(14px)', pointerEvents: 'none', mixBlendMode: 'screen',
        opacity: hovered === 'forge' ? 1 : 0,
        transform: hovered === 'forge' ? 'scale(1.1)' : 'scale(0.8)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        animation: hovered === 'forge' ? 'ambiForge 1.1s ease-in-out infinite' : 'none',
      }} />
      {/* iskry hover kuźni */}
      {hovered === 'forge' && FORGE_HOVER_EMBERS.map((e, i) => (
        <div key={i} style={{
          position: 'absolute', left: e.left, top: e.top,
          width: '5px', height: '5px', borderRadius: '50%',
          background: i % 2 === 0 ? 'rgba(255,200,60,0.95)' : 'rgba(255,120,20,0.9)',
          boxShadow: '0 0 6px 3px rgba(255,140,20,0.5)',
          pointerEvents: 'none', mixBlendMode: 'screen',
          animation: `emberRise ${e.dur} ease-out ${e.delay} infinite`,
          transform: 'translate(-50%,-50%)',
        }} />
      ))}

      {/* ── Ambient: Mine crystal shimmer ────────────────────────── */}
      <div className="amb-mine-glow" style={{
        position: 'absolute', left: MINE_GLOW.left, top: MINE_GLOW.top,
        width: MINE_GLOW.w, height: MINE_GLOW.h, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(80,180,255,0.5) 0%, transparent 70%)',
        filter: 'blur(8px)', pointerEvents: 'none', mixBlendMode: 'screen',
        opacity: hovered === 'mine' ? 0 : 1,
        transition: 'opacity 0.3s',
      }} />

      {/* ── Hover burst: Kopalnia – mienące się kryształy ────────── */}
      <div style={{
        position: 'absolute', left: '2%', top: '50%', width: '44%', height: '34%',
        borderRadius: '40%',
        background: 'radial-gradient(ellipse, rgba(100,200,255,0.75) 0%, rgba(40,100,255,0.35) 50%, transparent 70%)',
        filter: 'blur(12px)', pointerEvents: 'none', mixBlendMode: 'screen',
        opacity: hovered === 'mine' ? 1 : 0,
        transform: hovered === 'mine' ? 'scale(1.05)' : 'scale(0.85)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        animation: hovered === 'mine' ? 'ambiMine 1.6s ease-in-out infinite' : 'none',
      }} />
      {/* kryształy hover kopalni */}
      {hovered === 'mine' && MINE_HOVER_CRYSTALS.map((c, i) => (
        <div key={i} style={{
          position: 'absolute', left: c.left, top: c.top,
          width: '6px', height: '6px', borderRadius: '50%',
          background: 'rgba(120,220,255,0.95)',
          boxShadow: '0 0 10px 5px rgba(60,160,255,0.6)',
          pointerEvents: 'none', mixBlendMode: 'screen',
          animation: `fireflyBlink 0.8s ease-in-out ${c.delay} infinite`,
          transform: 'translate(-50%,-50%)',
        }} />
      ))}

      {/* ── Ambient: Forest crystal shimmer ─────────────────────── */}
      <div className="amb-forest-glow" style={{
        position: 'absolute', left: FOREST_GLOW.left, top: FOREST_GLOW.top,
        width: FOREST_GLOW.w, height: FOREST_GLOW.h, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(40,220,160,0.45) 0%, transparent 70%)',
        filter: 'blur(7px)', pointerEvents: 'none', mixBlendMode: 'screen',
        opacity: hovered === 'forest' ? 0 : 1,
        transition: 'opacity 0.3s',
      }} />

      {/* ── Hover burst: Las – magiczny blask lasu ───────────────── */}
      <div style={{
        position: 'absolute', left: '42%', top: '0%', width: '58%', height: '54%',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(80,255,160,0.55) 0%, rgba(40,200,120,0.25) 50%, transparent 70%)',
        filter: 'blur(14px)', pointerEvents: 'none', mixBlendMode: 'screen',
        opacity: hovered === 'forest' ? 1 : 0,
        transform: hovered === 'forest' ? 'scale(1.08)' : 'scale(0.85)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        animation: hovered === 'forest' ? 'ambiForest 2s ease-in-out infinite' : 'none',
      }} />
      {/* pyłki hover lasu */}
      {hovered === 'forest' && FOREST_HOVER_PARTICLES.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: p.left, top: p.top,
          width: '5px', height: '5px', borderRadius: '50%',
          background: i % 2 === 0 ? 'rgba(120,255,180,0.95)' : 'rgba(60,220,255,0.9)',
          boxShadow: '0 0 7px 3px rgba(80,220,160,0.5)',
          pointerEvents: 'none', mixBlendMode: 'screen',
          animation: `forestFloat ${p.dur} ease-in-out ${p.delay} infinite`,
          transform: 'translate(-50%,-50%)',
        }} />
      ))}

      {/* ── Ambient: Lanterns ────────────────────────────────────── */}
      {LANTERNS.map((l, i) => (
        <div key={i} className="amb-lantern" style={{
          position: 'absolute', left: l.left, top: l.top,
          width: '10px', height: '10px', borderRadius: '50%',
          background: 'rgba(255, 210, 80, 0.9)',
          boxShadow: '0 0 8px 4px rgba(255,200,60,0.6)',
          pointerEvents: 'none', animationDelay: `${i * 0.37}s`,
          transform: 'translate(-50%, -50%)', mixBlendMode: 'screen',
        }} />
      ))}

      {/* ── Ambient: Forest magic particles ─────────────────────── */}
      {PARTICLES.map((p, i) => (
        <div key={i} className="amb-particle" style={{
          position: 'absolute', left: p.left, top: p.top,
          width: '5px', height: '5px', borderRadius: '50%',
          background: 'rgba(120, 255, 200, 0.85)',
          boxShadow: '0 0 6px 3px rgba(60,220,160,0.5)',
          pointerEvents: 'none', animationDelay: p.delay,
          transform: 'translate(-50%, -50%)', mixBlendMode: 'screen',
        }} />
      ))}

      {/* ── Hotspot: Kuźnia ──────────────────────────────────────── */}
      <HotspotButton
        label="Kuźnia"
        config={HOTSPOTS.forge}
        onClick={() => { onLeave(); onNavigate('forge') }}
        onEnter={() => onEnter('forge')}
        onLeave={onLeave}
      />

      {/* ── Hotspot: Las ─────────────────────────────────────────── */}
      <HotspotButton
        label="Las"
        config={HOTSPOTS.forest}
        onClick={() => { onLeave(); onNavigate('forest') }}
        onEnter={() => onEnter('forest')}
        onLeave={onLeave}
      />

      {/* ── Hotspot: Kopalnia ────────────────────────────────────── */}
      <HotspotButton
        label="Kopalnia"
        config={HOTSPOTS.mine}
        onClick={() => { onLeave(); onNavigate('mine') }}
        onEnter={() => onEnter('mine')}
        onLeave={onLeave}
      />

      {/* ── Baner GoblinHub – lewy górny róg ─────────────────────── */}
      <img
        src="/assets/backgrounds/baner.png"
        alt="GoblinHub"
        draggable={false}
        style={{
          position: 'absolute', top: '6px', left: '50%',
          transform: 'translateX(-50%) rotate(-1.5deg)',
          width: '52%', maxWidth: '210px',
          height: 'auto',
          filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.85)) drop-shadow(0 2px 6px rgba(0,0,0,0.6))',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      {/* ── Gradient dół ─────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px',
        background: 'linear-gradient(0deg, rgba(5,3,2,0.8) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* ── Plecak – prawy górny róg ──────────────────────────────── */}
      <BackpackButton total={total} onClick={() => onNavigate('inventory')} />
    </div>
  )
}

// ─── Hotspot Button ───────────────────────────────────────────────────────────

interface HotspotConfig {
  top?: string
  bottom?: string
  left?: string
  right?: string
  width: string
  height: string
  glowColor: string
  borderColor: string
}

interface HotspotProps {
  label: string
  config: HotspotConfig
  onClick: () => void
  onEnter: () => void
  onLeave: () => void
}

function HotspotButton({ label, config, onClick, onEnter, onLeave }: HotspotProps) {
  const { glowColor: _g, borderColor: _b, label: _l, ...pos } = { ...config, label }

  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="hotspot-btn"
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onPointerDown={onEnter}   /* mobile: tap też triggeruje preview */
      style={{
        position: 'absolute',
        top: pos.top,
        bottom: pos.bottom,
        left: pos.left,
        right: pos.right,
        width: pos.width,
        height: pos.height,
        background: 'transparent',
        border: 'none',
        borderRadius: '16px',
        cursor: 'pointer',
        touchAction: 'manipulation',
        zIndex: 5,
      }}
    >
      {/* Label pojawia się przy tapnięciu / hovering */}
      <span
        className="hotspot-label"
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'Cinzel',
          fontSize: '13px',
          fontWeight: 700,
          color: '#f0d080',
          letterSpacing: '0.06em',
          textShadow: '0 1px 8px rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.8)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.2s ease',
          background: 'rgba(8,5,2,0.65)',
          borderRadius: '8px',
          padding: '3px 10px',
          backdropFilter: 'blur(4px)',
        }}
      >
        {label}
      </span>
    </button>
  )
}

// ─── Backpack Button ──────────────────────────────────────────────────────────

function BackpackButton({ total, onClick }: { total: number; onClick: () => void }) {
  const [hover, setHover] = useState(false)

  return (
    <button
      onClick={onClick}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onPointerDown={() => setHover(true)}
      aria-label="Ekwipunek"
      style={{
        position: 'absolute',
        top: '12px',
        right: '16px',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        touchAction: 'manipulation',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      {/* Glow pod ikoną */}
      <div style={{
        position: 'absolute',
        bottom: '-8px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90px',
        height: '22px',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(200,140,50,0.6) 0%, transparent 70%)',
        filter: 'blur(6px)',
        opacity: hover ? 1 : 0.5,
        transition: 'opacity 0.2s ease',
        pointerEvents: 'none',
        animation: 'backpackGlow 2.5s ease-in-out infinite',
      }} />

      {/* Ikona plecaka */}
      <img
        src="/assets/backgrounds/backpack_icon.png"
        alt="Ekwipunek"
        draggable={false}
        style={{
          width: '100px',
          height: '100px',
          objectFit: 'contain',
          filter: hover
            ? 'drop-shadow(0 0 14px rgba(220,160,60,0.95)) drop-shadow(0 0 28px rgba(200,120,30,0.7)) drop-shadow(0 6px 16px rgba(0,0,0,0.85)) brightness(1.15)'
            : 'drop-shadow(0 0 8px rgba(180,120,40,0.6)) drop-shadow(0 4px 14px rgba(0,0,0,0.85)) drop-shadow(0 8px 24px rgba(0,0,0,0.7))',
          transform: hover ? 'scale(1.12) translateY(-3px)' : 'scale(1)',
          transition: 'filter 0.2s ease, transform 0.2s ease',
          animation: 'backpackFloat 3.5s ease-in-out infinite',
        }}
      />

      {/* Badge z liczbą itemów */}
      {total > 0 && (
        <div style={{
          position: 'absolute',
          top: '-4px',
          right: '-6px',
          background: 'linear-gradient(135deg, #c45a10, #e8720a)',
          border: '2px solid #f09030',
          borderRadius: '50%',
          width: '22px',
          height: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Cinzel',
          fontSize: '11px',
          fontWeight: 700,
          color: '#fff8f0',
          boxShadow: '0 2px 6px rgba(200,80,10,0.5)',
          pointerEvents: 'none',
        }}>
          {total}
        </div>
      )}
    </button>
  )
}
