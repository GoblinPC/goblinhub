import { useEffect, useState, useRef } from 'react'
import type { Screen } from '../types'
import { startHubMusic, stopHubMusic, playHoverPreview, stopHoverPreview } from '../sounds'

type HoveredBuilding = 'forge' | 'forest' | 'mine' | 'expeditions' | 'shop' | 'totem' | 'lantern' | null

// ─── Hotspot labels ───────────────────────────────────────────────────────────
const HOTSPOT_LABELS: Record<string, string> = {
  forge: 'Kuźnia', forest: 'Las', mine: 'Kopalnia',
  expeditions: 'Wyprawa', shop: 'Sklepikarz', totem: 'Ekwipunek', lantern: 'Statystyki',
}

// ─── Light system ─────────────────────────────────────────────────────────────

export interface Light {
  id: number
  x: number         // % from left (center)
  y: number         // % from top  (center)
  r: number         // diameter as % of container width
  color: string     // rgba string
  anim: 'none' | 'pulse' | 'flicker' | 'blink'
  onHover?: string  // if set, only visible when this hotspot is hovered
  label?: string    // optional text label shown on the light
}

const LIGHT_ANIM_CSS: Record<Light['anim'], string> = {
  none:    'none',
  pulse:   'ambiForge 2s ease-in-out infinite',
  flicker: 'ambiForge 0.55s ease-in-out infinite',
  blink:   'fireflyBlink 1.2s ease-in-out infinite',
}

const COLOR_PRESETS = [
  { label: 'Pochodnia', value: 'rgba(255,140,20,0.85)'  },
  { label: 'Ogień',     value: 'rgba(255,80,10,0.8)'    },
  { label: 'Niebieski', value: 'rgba(40,160,255,0.85)'  },
  { label: 'Turkus',    value: 'rgba(20,220,200,0.85)'  },
  { label: 'Fiolet',    value: 'rgba(180,60,255,0.8)'   },
  { label: 'Zielony',   value: 'rgba(40,220,80,0.8)'    },
  { label: 'Czerwony',  value: 'rgba(220,30,20,0.8)'    },
  { label: 'Biały',     value: 'rgba(200,220,255,0.65)' },
]

// ─── Coordinate transform (mobile-calibrated → current screen) ───────────────
// All stored positions are calibrated on a portrait mobile screen (CAL_W × CAL_H).
// On landscape/desktop we render the 16:9 image full-screen and remap coordinates
// so hotspots/lights stay over the correct buildings regardless of screen size.

const PORT_W = 941, PORT_H = 1672  // portrait source image
const LAND_W = 2972                 // 16:9 image width (same height PORT_H)
const CAL_W  = 390, CAL_H = 844    // calibration reference (mobile portrait)

interface Tr {
  x:    (v: number) => number   // % left
  y:    (v: number) => number   // % top
  r:    (v: number) => number   // radius % of width
  idx:  number                  // inverse delta scale X (for drag)
  idy:  number                  // inverse delta scale Y (for drag)
}
const ID_TR: Tr = { x: v => v, y: v => v, r: v => v, idx: 1, idy: 1 }

function buildTr(W: number, H: number): Tr {
  if (W / H < 1.0) return ID_TR   // portrait: identity
  // Mobile rendering of portrait image
  const mS = Math.max(CAL_W / PORT_W, CAL_H / PORT_H)   // ~0.505
  const mCx = (PORT_W * mS - CAL_W) / 2                 // ~42.5 px clipped each side
  // Desktop rendering of 16:9 image
  const dS  = Math.max(W / LAND_W, H / PORT_H)
  const dCx = (LAND_W * dS - W) / 2
  const cOff = (LAND_W - PORT_W) / 2                     // portrait content start in 16:9 (px)
  const sx = CAL_W * dS / (mS * W)                       // scale factor X
  const sy = CAL_H / H                                   // scale factor Y
  return {
    x: (p: number) => {
      const imgPx = (p / 100 * CAL_W + mCx) / mS
      return ((cOff + imgPx) * dS - dCx) / W * 100
    },
    y: (p: number) => p * CAL_H / H,
    r: (v: number) => v * sx,
    idx: 1 / sx,
    idy: 1 / sy,
  }
}

function useWindowSize() {
  const [s, setS] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const fn = () => setS({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return s
}

// ─── Live positions (all persisted in localStorage) ───────────────────────────

export interface HPos { top: number; left: number; width: number; height: number }
export interface Dot  { x: number; y: number }
export interface LivePos {
  hpos: Record<string, HPos>
  forge: Dot
  mine: Dot
  crystals: Dot[]
  lights: Light[]
}

const LS_KEY = 'settlement_debug_v1'

function defaultLivePos(): LivePos {
  return {
    hpos: {
      forge:       { top: 10, left:  1, width: 34, height: 42 },
      forest:      { top:  2, left: 62, width: 37, height: 34 },
      mine:        { top: 52, left:  1, width: 23, height: 20 },
      expeditions: { top:  0, left: 32, width: 32, height: 10 },
      shop:        { top: 62, left: 54, width: 45, height: 30 },
      totem:       { top: 37, left: 68, width: 14, height: 15 },
      lantern:     { top: 60, left: 37, width: 18, height:  9 },
    },
    forge:    { x: 22, y: 30 },
    mine:     { x: 12, y: 61 },
    crystals: [
      { x: 63, y: 14 }, { x: 67, y: 16 }, { x: 65, y: 21 },
      { x: 71, y: 22 }, { x: 74, y: 25 }, { x: 78, y: 19 }, { x: 69, y: 28 },
    ],
    lights: [],
  }
}

let _nextId = Date.now()
function newId() { return ++_nextId }

function loadLivePos(): LivePos {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return addDefaultHoverLights(defaultLivePos())
    const s = JSON.parse(raw)
    const def = defaultLivePos()
    const minePos = s.mine ?? s.mineDot ?? def.mine
    const loaded: LivePos = {
      hpos:     { ...def.hpos, ...(s.hpos ?? {}) },
      forge:    s.forge    ?? s.forgeDot    ?? def.forge,
      mine:     minePos,
      crystals: s.crystals ?? s.crystalDots ?? def.crystals,
      lights:   s.lights   ?? def.lights,
    }
    return addDefaultHoverLights(loaded)
  } catch { return addDefaultHoverLights(defaultLivePos()) }
}

function addDefaultHoverLights(p: LivePos): LivePos {
  const lights = [...p.lights]
  if (!lights.some(l => l.onHover === 'mine')) {
    lights.push({ id: newId(), x: p.mine.x, y: p.mine.y, r: 5, color: 'rgba(60,160,255,0.9)', anim: 'blink', onHover: 'mine', label: 'WEJŚCIE' })
  }
  if (!lights.some(l => l.onHover === 'expeditions')) {
    lights.push({ id: newId(), x: 48, y: 4, r: 8, color: 'rgba(255,180,40,0.8)', anim: 'pulse', onHover: 'expeditions' })
  }
  return { ...p, lights }
}

function saveLivePos(p: LivePos) {
  localStorage.setItem(LS_KEY, JSON.stringify(p))
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onNavigate: (screen: Screen) => void
}

// Detect touch/no-hover device once at module level (safe in browser SPA)
const IS_TOUCH = typeof window !== 'undefined' && !window.matchMedia('(hover: hover) and (pointer: fine)').matches

function navigate(id: string, cb: (s: Screen) => void) {
  if      (id === 'forge')       cb('forge')
  else if (id === 'forest')      cb('forest')
  else if (id === 'mine')        cb('mine')
  else if (id === 'expeditions') cb('expeditions')
  else if (id === 'shop')        cb('shop')
  else if (id === 'lantern')     cb('stats')
  else if (id === 'totem')       cb('character')
}

export default function Settlement({ onNavigate }: Props) {
  const [hovered, setHovered] = useState<HoveredBuilding>(null)
  const hoverRef = useRef<HoveredBuilding>(null)
  const [selected, setSelected] = useState<HoveredBuilding>(null)
  const [debug, setDebug] = useState(false)
  const [pos, setPos] = useState<LivePos>(loadLivePos)
  const { w: W, h: H } = useWindowSize()
  const tr = buildTr(W, H)
  const isLandscape = W / H >= 1.0

  const active: HoveredBuilding = IS_TOUCH ? selected : hovered

  useEffect(() => { startHubMusic(); return () => stopHubMusic() }, [])

  function updatePos(next: LivePos) { setPos(next); saveLivePos(next) }

  function onEnter(id: Exclude<HoveredBuilding, null>) {
    if (IS_TOUCH) return
    if (hoverRef.current === id) return
    hoverRef.current = id; setHovered(id)
    if (id === 'forge' || id === 'forest') playHoverPreview(id)
  }
  function onLeave() {
    if (IS_TOUCH) return
    hoverRef.current = null; setHovered(null); stopHoverPreview()
  }

  function handleClick(id: Exclude<HoveredBuilding, null>) {
    if (IS_TOUCH) {
      if (selected === id) { setSelected(null); navigate(id, onNavigate) }
      else setSelected(id)
      return
    }
    onLeave(); navigate(id, onNavigate)
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden', background: '#0a0806' }}
      onClick={IS_TOUCH ? e => { if (e.target === e.currentTarget) setSelected(null) } : undefined}>

      {/* Background: portrait on mobile, 16:9 on landscape */}
      <picture style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <source media="(min-aspect-ratio: 1/1)" srcSet="/assets/backgrounds/hub_16-9.png" />
        <img src="/assets/backgrounds/settlement.webp" alt="" draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', userSelect: 'none', pointerEvents: 'none' }} />
      </picture>

      {/* ── Manualne światła ─────────────────────────────────────── */}
      {pos.lights
        .filter(l => !l.onHover || l.onHover === active)
        .map(light => {
          const lx = tr.x(light.x), ly = tr.y(light.y), lr = tr.r(light.r)
          return (
            <div key={light.id} style={{
              position: 'absolute',
              left: `${lx}%`, top: `${ly}%`,
              width: `${lr * 2}%`, aspectRatio: '1',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: light.onHover ? 6 : 4,
            }}>
              {/* inner div animates scale without touching outer translate */}
              <div style={{
                width: '100%', height: '100%',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${light.color} 0%, transparent 70%)`,
                filter: 'blur(8px)',
                mixBlendMode: 'screen',
                animation: LIGHT_ANIM_CSS[light.anim],
              }} />
              {light.label && (
                <span style={{
                  position: 'absolute', top: '110%', left: '50%', transform: 'translateX(-50%)',
                  fontFamily: 'Cinzel', fontSize: 11, fontWeight: 700, color: '#e8f4ff',
                  textShadow: '0 0 8px rgba(40,140,255,0.9), 0 1px 4px rgba(0,0,0,0.95)',
                  whiteSpace: 'nowrap', letterSpacing: '0.1em',
                  background: 'rgba(0,10,30,0.65)', borderRadius: 5, padding: '1px 6px',
                }}>{light.label}</span>
              )}
            </div>
          )
        })
      }

      {/* ── Hotspoty ─────────────────────────────────────────────── */}
      {Object.keys(HOTSPOT_LABELS).map(id => {
        const raw = pos.hpos[id]
        if (!raw) return null
        // Apply coordinate transform for current screen
        const p = isLandscape
          ? { left: tr.x(raw.left), top: tr.y(raw.top), width: raw.width * tr.r(1), height: raw.height * (CAL_H / H) }
          : raw
        const isSel = IS_TOUCH && selected === id
        return (
          <button key={id} aria-label={HOTSPOT_LABELS[id]} className="hotspot-btn"
            data-selected={isSel ? 'true' : undefined}
            onPointerEnter={() => onEnter(id as Exclude<HoveredBuilding,null>)}
            onPointerLeave={onLeave}
            onClick={() => handleClick(id as Exclude<HoveredBuilding,null>)}
            style={{ position: 'absolute', left: `${p.left}%`, top: `${p.top}%`, width: `${p.width}%`, height: `${p.height}%`, background: isSel ? 'rgba(255,220,80,0.08)' : 'transparent', border: isSel ? '1px solid rgba(255,220,80,0.3)' : 'none', borderRadius: 12, cursor: 'pointer', touchAction: 'manipulation', zIndex: 5, transition: 'background 0.2s' }}
          >
            <span className="hotspot-label" style={{
              position: 'absolute', bottom: '8%', left: '50%', transform: 'translateX(-50%)',
              fontFamily: 'Cinzel', fontSize: 12, fontWeight: 700, color: '#f0d080',
              letterSpacing: '0.06em', textShadow: '0 1px 8px rgba(0,0,0,0.95)',
              whiteSpace: 'nowrap', pointerEvents: 'none',
              opacity: IS_TOUCH ? (isSel ? 1 : 0.45) : 0,
              transition: 'opacity 0.2s',
              background: 'rgba(8,5,2,0.7)', borderRadius: 7, padding: '2px 8px', backdropFilter: 'blur(4px)',
            }}>{HOTSPOT_LABELS[id]}</span>
          </button>
        )
      })}

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', background: 'linear-gradient(0deg,rgba(5,3,2,0.6) 0%,transparent 100%)', pointerEvents: 'none' }} />

      {/* ── Debug button ─────────────────────────────────────────── */}
      <button onClick={() => setDebug(d => !d)}
        style={{ position: 'absolute', bottom: 6, right: 8, zIndex: 100, width: 22, height: 22, borderRadius: '50%', background: debug ? 'rgba(255,80,80,0.85)' : 'rgba(60,60,60,0.4)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', touchAction: 'manipulation', fontSize: 10, color: '#fff' }}
      >D</button>

      {debug && <DebugEditor pos={pos} onChange={updatePos} onClose={() => setDebug(false)} />}
    </div>
  )
}

// ─── Debug Editor ─────────────────────────────────────────────────────────────

type DragTarget =
  | { kind: 'hotspot'; id: string; mode: 'move' | 'resize' }
  | { kind: 'dot';     name: string; idx?: number }
  | { kind: 'light';   id: number }

const DEBUG_COLORS = ['#ff5050','#50ff50','#5080ff','#ffc800','#ff50ff','#50ffff','#ffa000']
const HOVER_OPTIONS = ['', 'mine', 'expeditions', 'forge', 'forest', 'shop', 'totem', 'lantern']

function DebugEditor({ pos, onChange, onClose }: { pos: LivePos; onChange: (p: LivePos) => void; onClose: () => void }) {
  const selfRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ target: DragTarget; startClient: [number,number]; startVal: number[]; moved: boolean } | null>(null)
  const posRef  = useRef(pos); posRef.current = pos

  const [tab, setTab] = useState<'hotspots' | 'lights'>('lights')
  const [selectedLight, setSelectedLight] = useState<number | null>(null)

  function bsize() { return selfRef.current?.getBoundingClientRect() ?? { width: 1, height: 1 } }

  function startDrag(e: React.PointerEvent, target: DragTarget, startVal: number[]) {
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { target, startClient: [e.clientX, e.clientY], startVal, moved: false }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return
    const { target, startClient, startVal } = dragRef.current
    const b = bsize()
    const dx = ((e.clientX - startClient[0]) / b.width)  * 100
    const dy = ((e.clientY - startClient[1]) / b.height) * 100
    if (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3) dragRef.current.moved = true
    const cur = posRef.current

    if (target.kind === 'hotspot') {
      const h = cur.hpos[target.id]
      const next = target.mode === 'move'
        ? { ...h, left: Math.max(0, startVal[0]+dx), top: Math.max(0, startVal[1]+dy) }
        : { ...h, width: Math.max(3, startVal[0]+dx), height: Math.max(3, startVal[1]+dy) }
      onChange({ ...cur, hpos: { ...cur.hpos, [target.id]: next } })
    } else if (target.kind === 'dot') {
      const nx = Math.max(0, Math.min(100, startVal[0]+dx))
      const ny = Math.max(0, Math.min(100, startVal[1]+dy))
      if      (target.name === 'forge')   onChange({ ...cur, forge: { x: nx, y: ny } })
      else if (target.name === 'mine')    onChange({ ...cur, mine:  { x: nx, y: ny } })
      else if (target.name === 'crystal' && target.idx !== undefined)
        onChange({ ...cur, crystals: cur.crystals.map((d,i) => i===target.idx ? {x:nx,y:ny} : d) })
    } else if (target.kind === 'light') {
      const nx = Math.max(0, Math.min(100, startVal[0]+dx))
      const ny = Math.max(0, Math.min(100, startVal[1]+dy))
      onChange({ ...cur, lights: cur.lights.map(l => l.id===target.id ? {...l,x:nx,y:ny} : l) })
    }
  }

  function onPointerUp(_e: React.PointerEvent) {
    if (!dragRef.current) return
    const { target, moved } = dragRef.current
    dragRef.current = null
    // tap on light = select it
    if (!moved && target.kind === 'light') setSelectedLight(target.id)
    // tap elsewhere = deselect
    if (!moved && target.kind !== 'light') setSelectedLight(null)
  }

  function addLight() {
    const id = newId()
    onChange({ ...pos, lights: [...pos.lights, { id, x: 50, y: 50, r: 6, color: 'rgba(255,140,20,0.85)', anim: 'flicker' }] })
    setSelectedLight(id)
  }

  function updateLight(id: number, patch: Partial<Light>) {
    onChange({ ...pos, lights: pos.lights.map(l => l.id === id ? { ...l, ...patch } : l) })
  }

  function deleteLight(id: number) {
    onChange({ ...pos, lights: pos.lights.filter(l => l.id !== id) })
    if (selectedLight === id) setSelectedLight(null)
  }

  const sel = pos.lights.find(l => l.id === selectedLight) ?? null

  return (
    <div ref={selfRef} style={{ position:'absolute', inset:0, zIndex:90, touchAction:'none' }}
      onPointerMove={onPointerMove} onPointerUp={onPointerUp}>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div style={{ position:'absolute', top:6, left:8, zIndex:200, display:'flex', gap:6 }}>
        {(['lights','hotspots'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ background: tab===t ? 'rgba(255,200,0,0.85)' : 'rgba(0,0,0,0.7)', border:'none', color: tab===t ? '#000' : '#fff', fontFamily:'monospace', fontSize:10, padding:'3px 8px', borderRadius:4, cursor:'pointer' }}>{t}</button>
        ))}
        <button onClick={onClose} style={{ background:'rgba(200,50,50,0.85)', border:'none', color:'#fff', fontFamily:'monospace', fontSize:10, padding:'3px 8px', borderRadius:4, cursor:'pointer' }}>✕</button>
      </div>

      {/* ── Hotspot rects ────────────────────────────────────────── */}
      {tab === 'hotspots' && Object.entries(pos.hpos).map(([id, p], i) => (
        <div key={id} style={{ position:'absolute', left:`${p.left}%`, top:`${p.top}%`, width:`${p.width}%`, height:`${p.height}%`, border:`2px solid ${DEBUG_COLORS[i%DEBUG_COLORS.length]}`, background:`${DEBUG_COLORS[i%DEBUG_COLORS.length]}20`, boxSizing:'border-box', cursor:'move' }}
          onPointerDown={e => startDrag(e, {kind:'hotspot',id,mode:'move'}, [p.left,p.top])}>
          <span style={{ position:'absolute', top:2, left:3, fontFamily:'monospace', fontSize:11, color:'#fff', background:'rgba(0,0,0,0.75)', padding:'1px 5px', userSelect:'none', pointerEvents:'none' }}>{id}</span>
          <div style={{ position:'absolute', bottom:0, right:0, width:18, height:18, background:DEBUG_COLORS[i%DEBUG_COLORS.length], cursor:'nwse-resize' }}
            onPointerDown={e => startDrag(e, {kind:'hotspot',id,mode:'resize'}, [p.width,p.height])} />
        </div>
      ))}

      {/* ── Light dots ───────────────────────────────────────────── */}
      {tab === 'lights' && pos.lights.map(light => {
        const isSel = light.id === selectedLight
        return (
          <div key={light.id}
            onPointerDown={e => startDrag(e, {kind:'light',id:light.id}, [light.x, light.y])}
            style={{ position:'absolute', left:`${light.x}%`, top:`${light.y}%`, width:18, height:18, borderRadius:'50%', background: isSel ? '#fff' : light.color, border: isSel ? '3px solid #ffc800' : '2px solid rgba(255,255,255,0.6)', transform:'translate(-50%,-50%)', cursor:'grab', zIndex:95 }}>
            <span style={{ position:'absolute', top:18, left:0, fontFamily:'monospace', fontSize:9, color:'#fff', background:'rgba(0,0,0,0.85)', whiteSpace:'nowrap', padding:'1px 3px', pointerEvents:'none' }}>💡{light.id}</span>
          </div>
        )
      })}

      {/* ── Light editor panel ───────────────────────────────────── */}
      {tab === 'lights' && (
        <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:200, background:'rgba(0,0,0,0.92)', borderTop:'1px solid rgba(255,255,180,0.25)', padding:'10px 12px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <button onClick={addLight} style={{ background:'rgba(60,200,60,0.8)', border:'none', color:'#fff', fontFamily:'monospace', fontSize:11, padding:'4px 12px', borderRadius:5, cursor:'pointer' }}>+ Dodaj światło</button>
            <span style={{ fontFamily:'monospace', fontSize:10, color:'#888' }}>kliknij kropkę żeby edytować</span>
          </div>

          {sel && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontFamily:'monospace', fontSize:10, color:'#ffd060', minWidth:60 }}>Rozmiar</span>
                <input type="range" min={1} max={30} value={sel.r} onChange={e => updateLight(sel.id, { r: +e.target.value })}
                  style={{ flex:1 }} />
                <span style={{ fontFamily:'monospace', fontSize:10, color:'#aaa', minWidth:24 }}>{sel.r}%</span>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                <span style={{ fontFamily:'monospace', fontSize:10, color:'#ffd060', minWidth:60 }}>Kolor</span>
                {COLOR_PRESETS.map(p => (
                  <div key={p.label}
                    onClick={() => updateLight(sel.id, { color: p.value })}
                    title={p.label}
                    style={{ width:22, height:22, borderRadius:'50%', background:p.value, border: sel.color===p.value ? '3px solid #fff' : '2px solid rgba(255,255,255,0.3)', cursor:'pointer', flexShrink:0 }} />
                ))}
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontFamily:'monospace', fontSize:10, color:'#ffd060', minWidth:60 }}>Anim</span>
                {(['none','pulse','flicker','blink'] as Light['anim'][]).map(a => (
                  <button key={a} onClick={() => updateLight(sel.id, { anim: a })}
                    style={{ background: sel.anim===a ? 'rgba(255,200,0,0.8)' : 'rgba(60,60,60,0.7)', border:'none', color: sel.anim===a ? '#000' : '#ccc', fontFamily:'monospace', fontSize:9, padding:'2px 7px', borderRadius:4, cursor:'pointer' }}>{a}</button>
                ))}
                <button onClick={() => deleteLight(sel.id)}
                  style={{ marginLeft:'auto', background:'rgba(200,40,40,0.8)', border:'none', color:'#fff', fontFamily:'monospace', fontSize:9, padding:'2px 8px', borderRadius:4, cursor:'pointer' }}>usuń</button>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                <span style={{ fontFamily:'monospace', fontSize:10, color:'#ffd060', minWidth:60 }}>Hover</span>
                {HOVER_OPTIONS.map(h => (
                  <button key={h||'zawsze'} onClick={() => updateLight(sel.id, { onHover: h || undefined })}
                    style={{ background: (sel.onHover??'')===h ? 'rgba(60,160,255,0.8)' : 'rgba(60,60,60,0.7)', border:'none', color: (sel.onHover??'')===h ? '#fff' : '#aaa', fontFamily:'monospace', fontSize:9, padding:'2px 6px', borderRadius:4, cursor:'pointer' }}>{h||'zawsze'}</button>
                ))}
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontFamily:'monospace', fontSize:10, color:'#ffd060', minWidth:60 }}>Etykieta</span>
                <input value={sel.label ?? ''} onChange={e => updateLight(sel.id, { label: e.target.value || undefined })}
                  placeholder="opcjonalna..."
                  style={{ flex:1, background:'rgba(30,30,30,0.9)', border:'1px solid rgba(255,255,255,0.2)', color:'#eee', fontFamily:'monospace', fontSize:10, padding:'2px 6px', borderRadius:4 }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
