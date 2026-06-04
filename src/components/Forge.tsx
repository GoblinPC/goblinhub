import type { Inventory } from '../types'
import ScreenHeader from './ScreenHeader'

interface Props {
  inventory: Inventory
  onUpdate: (inv: Inventory) => void
  onBack: () => void
}

export default function Forge({ inventory, onUpdate, onBack }: Props) {
  const canLight = inventory.wood >= 1
  const canSmelt = inventory.forgeEmber >= 1 && inventory.copperOre >= 2

  function handleLight() {
    if (!canLight) return
    onUpdate({ ...inventory, wood: inventory.wood - 1, forgeEmber: inventory.forgeEmber + 1 })
  }

  function handleSmelt() {
    if (!canSmelt) return
    onUpdate({
      ...inventory,
      forgeEmber: inventory.forgeEmber - 1,
      copperOre: inventory.copperOre - 2,
      copperBar: inventory.copperBar + 1,
    })
  }

  return (
    <div className="screen-enter flex flex-col" style={{ minHeight: '100%' }}>
      <ScreenHeader icon="⚒️" title="Kuźnia" subtitle="Gorące palenisko goblinich kowali" onBack={onBack} />

      <div style={{ padding: '0 16px', flex: 1 }}>
        {/* Ambient */}
        <div style={{ textAlign: 'center', padding: '16px 0 8px', fontSize: '56px', lineHeight: 1, opacity: 0.85 }}>
          🔥⚒️🔥
        </div>

        {/* Resources quick view */}
        <div className="gh-card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontFamily: 'Cinzel', fontSize: '11px', color: '#6a5040', letterSpacing: '0.08em', marginBottom: '4px' }}>
            SUROWCE
          </div>
          <ResourceLine icon="🪵" label="Drewno" amount={inventory.wood} />
          <ResourceLine icon="🪨" label="Ruda miedzi" amount={inventory.copperOre} />
          <ResourceLine icon="🔥" label="Żar Kuźni" amount={inventory.forgeEmber} />
          <ResourceLine icon="🔶" label="Sztabka miedzi" amount={inventory.copperBar} />
        </div>

        {/* Action 1: Light fire */}
        <div className="gh-card" style={{ padding: '20px', marginBottom: '14px' }}>
          <div style={{ fontFamily: 'Cinzel', fontSize: '13px', color: '#d4a870', letterSpacing: '0.05em', marginBottom: '8px' }}>
            ⚗️ Rozpal piec
          </div>
          <div style={{ fontFamily: 'Crimson Text', fontSize: '15px', color: '#6a5040', marginBottom: '16px', fontStyle: 'italic' }}>
            Zużywa: 🪵 Drewno ×1 · Daje: 🔥 Żar Kuźni ×1
          </div>
          <button
            className={canLight ? 'btn-primary' : 'btn-primary'}
            style={canLight ? {} : {}}
            onClick={handleLight}
            disabled={!canLight}
          >
            {canLight ? 'Rozpal piec' : 'Potrzebujesz drewna'}
          </button>
          {!canLight && (
            <div style={{ fontFamily: 'Crimson Text', fontSize: '13px', color: '#7a4a30', marginTop: '8px', textAlign: 'center', fontStyle: 'italic' }}>
              Idź do lasu po drewno
            </div>
          )}
        </div>

        {/* Action 2: Smelt */}
        <div className={`gh-card ${canSmelt ? 'glow-amber' : ''}`} style={{ padding: '20px', marginBottom: '24px', transition: 'box-shadow 0.3s' }}>
          <div style={{ fontFamily: 'Cinzel', fontSize: '13px', color: '#d4a870', letterSpacing: '0.05em', marginBottom: '8px' }}>
            🔥 Przetop rudę
          </div>
          <div style={{ fontFamily: 'Crimson Text', fontSize: '15px', color: '#6a5040', marginBottom: '16px', fontStyle: 'italic' }}>
            Zużywa: 🔥 Żar ×1 + 🪨 Ruda ×2 · Daje: 🔶 Sztabka ×1
          </div>
          <button
            className="btn-secondary"
            onClick={handleSmelt}
            disabled={!canSmelt}
          >
            {canSmelt ? 'Przetop rudę miedzi' : 'Niewystarczające zasoby'}
          </button>
          {!canSmelt && (
            <div style={{ fontFamily: 'Crimson Text', fontSize: '13px', color: '#4a5030', marginTop: '8px', textAlign: 'center', fontStyle: 'italic' }}>
              Potrzebujesz Żaru ×1 i Rudy ×2
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ResourceLine({ icon, label, amount }: { icon: string; label: string; amount: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontFamily: 'Crimson Text', fontSize: '16px', color: '#9a7850', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{icon}</span> {label}
      </span>
      <span style={{ fontFamily: 'Cinzel', fontSize: '18px', fontWeight: 700, color: amount > 0 ? '#f0c060' : '#4a3828' }}>
        {amount}
      </span>
    </div>
  )
}
