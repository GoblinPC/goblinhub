import type { Inventory, ItemId, EquipSlots } from '../types'
import { ITEM_META } from './CharacterScreen'

const INTERIOR = { top: '28%', bottom: '84%', left: '13%', right: '13%' }

interface Props {
  inventory: Inventory
  ownedItems: ItemId[]
  equip: EquipSlots
  onEquipUpdate: (equip: EquipSlots) => void
  onBack: () => void
}

const RESOURCES: { key: keyof Inventory; icon: string; label: string; color: string }[] = [
  { key: 'gold',       icon: '💰', label: 'Złoto',   color: '#e0b030' },
  { key: 'wood',       icon: '🪵', label: 'Drewno',  color: '#c09050' },
  { key: 'copperOre',  icon: '🪨', label: 'Ruda',    color: '#c08060' },
  { key: 'copperBar',  icon: '🔶', label: 'Sztabka', color: '#e0a040' },
  { key: 'forgeEmber', icon: '🔥', label: 'Żar',     color: '#f07030' },
  { key: 'herbs',      icon: '🌿', label: 'Zioła',   color: '#60a840' },
  { key: 'fish',       icon: '🐟', label: 'Ryby',    color: '#5090c0' },
]

export default function InventoryScreen({ inventory, ownedItems, equip, onEquipUpdate, onBack }: Props) {
  const hasAnything = ownedItems.length > 0 || RESOURCES.some(r => inventory[r.key] > 0)

  function handleToggleEquip(id: ItemId) {
    const meta = ITEM_META[id]
    const slot = meta.slots[0]
    const isEquipped = equip[slot] === id
    onEquipUpdate({ ...equip, [slot]: isEquipped ? null : id })
  }

  return (
    <div className="screen-enter" style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden', background: '#0a0604' }}>

      {/* Tło */}
      <img src="/assets/backgrounds/backpack.webp" alt="" draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', pointerEvents: 'none', userSelect: 'none' }} />

      {/* Przycisk wstecz */}
      <button onClick={onBack} style={{
        position: 'absolute', top: '12%', left: '16%',
        background: 'rgba(10,6,2,0.7)', border: '1px solid rgba(180,130,60,0.35)',
        borderRadius: 10, color: '#9a7040', fontFamily: 'Cinzel', fontSize: 15,
        width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', touchAction: 'manipulation', backdropFilter: 'blur(4px)', zIndex: 10,
      }}>←</button>

      {/* Tytuł */}
      <div style={{
        position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center', pointerEvents: 'none', zIndex: 10,
      }}>
        <div style={{ fontFamily: 'Cinzel', fontSize: 14, fontWeight: 700, color: '#c8a060', letterSpacing: '0.1em', textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>PLECAK</div>
      </div>

      {/* Wnętrze plecaka — scrollowalne */}
      <div style={{
        position: 'absolute',
        top: INTERIOR.top, left: INTERIOR.left, right: INTERIOR.right,
        bottom: `calc(100% - ${INTERIOR.bottom})`,
        overflowY: 'auto', padding: '10px 8px',
      }}>
        {!hasAnything && (
          <div style={{ textAlign: 'center', marginTop: 40, fontFamily: 'Crimson Text', fontSize: 15, color: '#4a3020', fontStyle: 'italic' }}>
            Plecak jest pusty...
          </div>
        )}

        {/* Zasoby */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: 'Cinzel', fontSize: 9, color: '#6a4820', letterSpacing: '0.12em', marginBottom: 8 }}>ZASOBY</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {RESOURCES.filter(r => r.key === 'gold' || inventory[r.key] > 0).map(r => (
                <div key={r.key} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'rgba(14,9,3,0.75)', border: `1px solid ${r.color}44`,
                  borderRadius: 8, padding: '5px 10px',
                }}>
                  <span style={{ fontSize: 16 }}>{r.icon}</span>
                  <span style={{ fontFamily: 'Cinzel', fontSize: 13, fontWeight: 700, color: r.color }}>{inventory[r.key] ?? 0}</span>
                  <span style={{ fontFamily: 'Crimson Text', fontSize: 10, color: '#6a4820' }}>{r.label}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Przedmioty */}
        {ownedItems.length > 0 && (
          <div>
            <div style={{ fontFamily: 'Cinzel', fontSize: 9, color: '#6a4820', letterSpacing: '0.12em', marginBottom: 8 }}>PRZEDMIOTY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ownedItems.map(id => {
                const meta = ITEM_META[id]
                const slot = meta.slots[0]
                const isEquipped = equip[slot] === id
                return (
                  <div key={id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: isEquipped ? 'rgba(40,28,8,0.85)' : 'rgba(14,9,3,0.75)',
                    border: `1px solid ${isEquipped ? 'rgba(200,150,40,0.55)' : 'rgba(80,55,20,0.4)'}`,
                    borderRadius: 12, padding: '10px 12px',
                  }}>
                    <img src={meta.image} alt="" draggable={false}
                      style={{ width: 46, height: 46, objectFit: 'contain', borderRadius: 8, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Cinzel', fontSize: 13, fontWeight: 700, color: '#c8a060', marginBottom: 2 }}>{meta.label}</div>
                      <div style={{ fontFamily: 'Crimson Text', fontSize: 11, color: '#6a4820', fontStyle: 'italic' }}>
                        {meta.atk ? `⚔ +${meta.atk} ATK` : ''}{meta.def ? ` 🛡 +${meta.def} DEF` : ''}
                        {isEquipped ? ' · Wyposażony' : ''}
                      </div>
                    </div>
                    <button onClick={() => handleToggleEquip(id)} style={{
                      padding: '6px 12px', borderRadius: 8, flexShrink: 0,
                      background: isEquipped ? 'rgba(100,30,20,0.4)' : 'rgba(30,50,10,0.5)',
                      border: `1px solid ${isEquipped ? 'rgba(160,60,40,0.5)' : 'rgba(80,140,30,0.5)'}`,
                      fontFamily: 'Cinzel', fontSize: 11, fontWeight: 600,
                      color: isEquipped ? '#c06050' : '#80b040',
                      cursor: 'pointer', touchAction: 'manipulation',
                    }}>
                      {isEquipped ? 'Zdejmij' : 'Ekwipuj'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
