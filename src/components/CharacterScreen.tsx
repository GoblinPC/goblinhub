import type { EquipSlots, ToolSlots, ItemId } from '../types'

interface Props {
  equip: EquipSlots
  tools: ToolSlots
  ownedItems: ItemId[]
  onUpdate: (equip: EquipSlots, tools: ToolSlots) => void
  onBack: () => void
}

const EQUIP_SLOTS: { key: keyof EquipSlots; label: string; x: number; y: number }[] = [
  { key: 'helmet',  label: 'Hełm',      x: 50,   y: 13.5 },
  { key: 'weapon',  label: 'Broń',      x: 12,   y: 31   },
  { key: 'armor',   label: 'Zbroja',    x: 88,   y: 31   },
  { key: 'shield',  label: 'Tarcza',    x: 12,   y: 47.5 },
  { key: 'gloves',  label: 'Rękawice',  x: 88,   y: 47.5 },
  { key: 'ring',    label: 'Pierścień', x: 12,   y: 64   },
  { key: 'boots',   label: 'Buty',      x: 88,   y: 64   },
  { key: 'cloak',   label: 'Peleryna',  x: 37,   y: 78   },
  { key: 'amulet',  label: 'Amulet',    x: 63,   y: 78   },
]

const TOOL_SLOTS: { key: keyof ToolSlots; label: string; x: number }[] = [
  { key: 'axe',        label: 'Topór',  x: 11  },
  { key: 'pickaxe',    label: 'Kilof',  x: 30  },
  { key: 'fishingRod', label: 'Wędka',  x: 50  },
  { key: 'shovel',     label: 'Łopata', x: 70  },
  { key: 'hammer',     label: 'Młot',   x: 89  },
]

export const ITEM_META: Record<ItemId, { label: string; image: string; slot: keyof EquipSlots | keyof ToolSlots }> = {
  sword_copper: { label: 'Miecz miedziany', image: '/assets/backgrounds/sword.png', slot: 'weapon' },
}

const SLOT_SIZE = 52

export default function CharacterScreen({ equip, tools, ownedItems, onUpdate, onBack }: Props) {
  function handleSlotClick(slotKey: keyof EquipSlots) {
    const current = equip[slotKey]
    if (current) {
      // Zdejmij
      onUpdate({ ...equip, [slotKey]: null }, tools)
    }
  }

  function handleEquip(itemId: ItemId) {
    const meta = ITEM_META[itemId]
    const slot = meta.slot as keyof EquipSlots
    if (slot in equip) {
      onUpdate({ ...equip, [slot]: itemId }, tools)
    }
  }

  // Przedmioty które są w ekwipunku (zajęte sloty)
  const equippedIds = Object.values(equip).filter(Boolean) as ItemId[]
  const unequipped = ownedItems.filter(id => !equippedIds.includes(id))

  return (
    <div className="screen-enter" style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>

      <img src="/assets/backgrounds/eq.png" alt="" draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', pointerEvents: 'none', userSelect: 'none' }} />

      <button onClick={onBack} style={{
        position: 'absolute', top: 14, left: 14, zIndex: 20,
        background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '10px', color: '#c0a070', fontFamily: 'Cinzel', fontSize: '16px',
        width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', touchAction: 'manipulation', backdropFilter: 'blur(4px)',
      }}>←</button>

      {/* Sloty ekwipunku */}
      {EQUIP_SLOTS.map(slot => {
        const item = equip[slot.key]
        return (
          <div
            key={slot.key}
            onClick={() => item && handleSlotClick(slot.key)}
            style={{
              position: 'absolute', left: `${slot.x}%`, top: `${slot.y}%`,
              width: SLOT_SIZE, height: SLOT_SIZE,
              transform: 'translate(-50%, -50%)',
              zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: item ? 'pointer' : 'default', borderRadius: 8,
              boxShadow: item ? '0 0 14px rgba(220,160,60,0.6)' : undefined,
            }}
          >
            {item && ITEM_META[item] && (
              <img src={ITEM_META[item].image} alt={item} draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6 }} />
            )}
          </div>
        )
      })}

      {/* Sloty narzędzi */}
      {TOOL_SLOTS.map(slot => {
        const item = tools[slot.key]
        return (
          <div key={slot.key} style={{
            position: 'absolute', left: `${slot.x}%`, top: '89.5%',
            width: SLOT_SIZE, height: SLOT_SIZE,
            transform: 'translate(-50%, -50%)',
            zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: item ? 'pointer' : 'default', borderRadius: 8,
            boxShadow: item ? '0 0 14px rgba(220,160,60,0.6)' : undefined,
          }}>
            {item && ITEM_META[item as ItemId] && (
              <img src={ITEM_META[item as ItemId].image} alt={item} draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6 }} />
            )}
          </div>
        )
      })}

      {/* Niewyekwipowane przedmioty — panel nad dolną krawędzią */}
      {unequipped.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 12, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 10, paddingInline: 16, zIndex: 20,
        }}>
          {unequipped.map(id => (
            <button key={id} onClick={() => handleEquip(id)} style={{
              background: 'rgba(10,8,4,0.88)', border: '1px solid rgba(200,140,50,0.5)',
              borderRadius: 12, padding: '6px 12px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4, cursor: 'pointer', touchAction: 'manipulation',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 0 16px rgba(180,120,30,0.3)',
            }}>
              <img src={ITEM_META[id].image} alt={id} draggable={false} style={{ width: 44, height: 44, objectFit: 'contain' }} />
              <span style={{ fontFamily: 'Cinzel', fontSize: '9px', color: '#c0a060' }}>{ITEM_META[id].label}</span>
              <span style={{ fontFamily: 'Cinzel', fontSize: '8px', color: '#6a5030' }}>dotknij aby założyć</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
