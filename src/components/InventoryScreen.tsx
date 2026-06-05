import type { Inventory } from '../types'

// Bounds ciemnego wnętrza plecaka (% obrazu)
// Dostosuj jeśli itemy wypadają poza ramkę
const INTERIOR = { top: '28%', bottom: '84%', left: '13%', right: '13%' }

interface Props {
  inventory: Inventory
  onBack: () => void
}

interface ItemDef {
  key: keyof Inventory
  icon: string
  label: string
  sublabel: string
  color: string
  glowColor: string
}

const ITEMS: ItemDef[] = [
  { key: 'wood',      icon: '🪵', label: 'Drewno',         sublabel: 'Surowiec · Las',     color: '#c09050', glowColor: 'rgba(180,120,40,0.3)'  },
  { key: 'copperOre', icon: '🪨', label: 'Ruda miedzi',    sublabel: 'Surowiec · Kopalnia', color: '#c08060', glowColor: 'rgba(180,100,50,0.3)'  },
  { key: 'forgeEmber',icon: '🔥', label: 'Żar Kuźni',      sublabel: 'Paliwo · Kuźnia',    color: '#f07030', glowColor: 'rgba(240,100,20,0.35)' },
  { key: 'copperBar', icon: '🔶', label: 'Sztabka miedzi', sublabel: 'Produkt · Kuźnia',   color: '#e0a040', glowColor: 'rgba(220,150,30,0.3)'  },
]

export default function InventoryScreen({ inventory, onBack }: Props) {
  const total = Object.values(inventory).reduce((a, b) => a + b, 0)

  return (
    <div className="screen-enter" style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden', background: '#0a0604' }}>

      {/* Tło – plecak */}
      <img src="/assets/backgrounds/backpack.webp" alt="" draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', pointerEvents: 'none', userSelect: 'none' }} />

      {/* Subtelna poświata wewnątrz */}
      <div style={{
        position: 'absolute',
        top: INTERIOR.top, left: INTERIOR.left,
        right: INTERIOR.right,
        bottom: `calc(100% - ${INTERIOR.bottom})`,
        background: 'radial-gradient(ellipse at 50% 30%, rgba(80,50,20,0.25) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Przycisk wstecz */}
      <button onClick={onBack} style={{
        position: 'absolute', top: '12%', left: '16%',
        background: 'rgba(10,6,2,0.7)', border: '1px solid rgba(180,130,60,0.35)',
        borderRadius: '10px', color: '#9a7040', fontFamily: 'Cinzel', fontSize: '15px',
        width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', touchAction: 'manipulation', backdropFilter: 'blur(4px)',
        zIndex: 10,
      }}>←</button>

      {/* Tytuł nad wnętrzem */}
      <div style={{
        position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <div style={{ fontFamily: 'Cinzel', fontSize: '14px', fontWeight: 700, color: '#c8a060', letterSpacing: '0.1em', textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
          EKWIPUNEK
        </div>
        {total > 0 && (
          <div style={{ fontFamily: 'Crimson Text', fontSize: '12px', color: '#7a5830', fontStyle: 'italic' }}>
            {total} przedmiotów
          </div>
        )}
      </div>

      {/* Itemy w środku plecaka */}
      <div style={{
        position: 'absolute',
        top: INTERIOR.top,
        left: INTERIOR.left,
        right: INTERIOR.right,
        bottom: `calc(100% - ${INTERIOR.bottom})`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '10px',
        padding: '12px 10px',
      }}>
        {ITEMS.map(item => (
          <ItemCard key={item.key} def={item} amount={inventory[item.key]} />
        ))}
      </div>
    </div>
  )
}

function ItemCard({ def, amount }: { def: ItemDef; amount: number }) {
  const hasItem = amount > 0
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      background: hasItem
        ? `linear-gradient(135deg, rgba(30,18,8,0.88), rgba(20,12,4,0.92))`
        : 'rgba(12,8,4,0.7)',
      border: `1px solid ${hasItem ? def.color + '44' : 'rgba(60,35,15,0.4)'}`,
      borderRadius: '12px',
      padding: '11px 14px',
      boxShadow: hasItem ? `0 2px 12px ${def.glowColor}, inset 0 1px 0 rgba(255,255,255,0.04)` : 'none',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(6px)',
    }}>
      {/* Ikona */}
      <div style={{
        width: 44, height: 44, borderRadius: '10px',
        background: hasItem ? def.glowColor : 'rgba(20,12,4,0.6)',
        border: `1px solid ${hasItem ? def.color + '33' : 'rgba(40,25,10,0.5)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '24px', lineHeight: 1, flexShrink: 0,
        filter: hasItem ? 'none' : 'grayscale(0.8) opacity(0.4)',
      }}>
        {def.icon}
      </div>

      {/* Nazwa + sublabel */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Cinzel', fontSize: '14px', fontWeight: 700,
          color: hasItem ? def.color : '#4a3020',
          letterSpacing: '0.03em', lineHeight: 1.2,
        }}>
          {def.label}
        </div>
        <div style={{ fontFamily: 'Crimson Text', fontSize: '12px', color: '#5a3a18', fontStyle: 'italic', lineHeight: 1.3, marginTop: '2px' }}>
          {def.sublabel}
        </div>
      </div>

      {/* Ilość */}
      <div style={{
        fontFamily: 'Cinzel', fontSize: '28px', fontWeight: 700,
        color: hasItem ? def.color : '#2a1808',
        textShadow: hasItem ? `0 0 12px ${def.glowColor}` : 'none',
        minWidth: '2ch', textAlign: 'right', lineHeight: 1,
        flexShrink: 0,
      }}>
        {amount}
      </div>
    </div>
  )
}
