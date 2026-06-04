import type { Screen, Inventory } from '../types'

interface Building {
  id: Screen
  label: string
  icon: string
  description: string
  color: string
}

const BUILDINGS: Building[] = [
  { id: 'forge',     label: 'Kuźnia',    icon: '⚒️',  description: 'Przetapiaj rudy',   color: '#f06020' },
  { id: 'forest',    label: 'Las',       icon: '🌲',  description: 'Zbieraj drewno',    color: '#60a040' },
  { id: 'mine',      label: 'Kopalnia',  icon: '⛏️',  description: 'Kop rudy',          color: '#a07850' },
  { id: 'inventory', label: 'Ekwipunek', icon: '🎒',  description: 'Twoje zasoby',      color: '#8060c0' },
]

interface Props {
  inventory: Inventory
  onNavigate: (screen: Screen) => void
}

export default function Settlement({ inventory, onNavigate }: Props) {
  const total = Object.values(inventory).reduce((a, b) => a + b, 0)

  return (
    <div className="screen-enter flex flex-col" style={{ minHeight: '100%', padding: '0' }}>
      {/* Header */}
      <div style={{ padding: '28px 20px 16px', textAlign: 'center', background: 'linear-gradient(180deg, #0e0b08 0%, transparent 100%)' }}>
        <h1 style={{ fontFamily: 'Cinzel', fontSize: '28px', fontWeight: 700, color: '#f0c060', margin: 0, letterSpacing: '0.06em', textShadow: '0 0 24px rgba(240,192,96,0.4)' }}>
          GoblinHub
        </h1>
        <p style={{ fontFamily: 'Crimson Text', fontSize: '15px', color: '#6a5040', margin: '4px 0 0', fontStyle: 'italic' }}>
          Twoja goblinia osada
        </p>
        {total > 0 && (
          <div style={{ marginTop: '10px', fontFamily: 'Cinzel', fontSize: '12px', color: '#805030', letterSpacing: '0.04em' }}>
            Zasoby: {total}
          </div>
        )}
      </div>

      {/* Ambient art */}
      <div style={{ textAlign: 'center', padding: '8px 0', fontSize: '56px', lineHeight: 1, opacity: 0.7 }}>
        🏘️
      </div>

      {/* Grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', padding: '8px 16px 100px' }}>
        {BUILDINGS.map((b) => (
          <button
            key={b.id}
            className="building-card"
            onClick={() => onNavigate(b.id)}
            style={{ padding: '24px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', border: 'none', background: 'none', cursor: 'pointer', touchAction: 'manipulation' }}
          >
            <span style={{ fontSize: '40px', lineHeight: 1, filter: `drop-shadow(0 0 8px ${b.color}88)` }}>
              {b.icon}
            </span>
            <span style={{ fontFamily: 'Cinzel', fontSize: '15px', fontWeight: 700, color: '#d4a870', letterSpacing: '0.04em' }}>
              {b.label}
            </span>
            <span style={{ fontFamily: 'Crimson Text', fontSize: '13px', color: '#6a5040', fontStyle: 'italic' }}>
              {b.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
