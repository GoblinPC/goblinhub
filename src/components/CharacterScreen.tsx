import type { EquipSlots, ToolSlots } from '../types'

interface Props {
  equip: EquipSlots
  tools: ToolSlots
  onUpdate: (equip: EquipSlots, tools: ToolSlots) => void
  onBack: () => void
}

// Pozycje slotów dopasowane do grafiki eq.png (% szerokości i wysokości kontenera)
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

const ITEM_IMAGES: Record<string, string> = {
  sword_copper: '/assets/backgrounds/sword.png',
}

const SLOT_SIZE = 52  // px, dopasuj do rozmiaru slotów na grafice

export default function CharacterScreen({ equip, tools, onBack }: Props) {
  return (
    <div className="screen-enter" style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>

      {/* Tło — grafika ekwipunku */}
      <img
        src="/assets/backgrounds/eq.png"
        alt=""
        draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', pointerEvents: 'none', userSelect: 'none' }}
      />

      {/* Przycisk powrotu — lewy górny róg (nad grafiką ←) */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute', top: 14, left: 14, zIndex: 20,
          background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '10px', color: '#c0a070', fontFamily: 'Cinzel', fontSize: '16px',
          width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', touchAction: 'manipulation', backdropFilter: 'blur(4px)',
        }}
      >←</button>

      {/* Sloty ekwipunku */}
      {EQUIP_SLOTS.map(slot => (
        <EquipSlot
          key={slot.key}
          item={equip[slot.key]}
          label={slot.label}
          x={slot.x}
          y={slot.y}
        />
      ))}

      {/* Sloty narzędzi */}
      {TOOL_SLOTS.map(slot => (
        <ToolSlot
          key={slot.key}
          item={tools[slot.key]}
          label={slot.label}
          x={slot.x}
        />
      ))}
    </div>
  )
}

function EquipSlot({ item, x, y }: { item: string | null; label: string; x: number; y: number }) {
  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      width: SLOT_SIZE,
      height: SLOT_SIZE,
      transform: 'translate(-50%, -50%)',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: item ? 'pointer' : 'default',
      borderRadius: 8,
      // Subtelny glow gdy slot zajęty
      boxShadow: item ? '0 0 12px rgba(220,160,60,0.5)' : undefined,
    }}>
      {item && ITEM_IMAGES[item] && (
        <img
          src={ITEM_IMAGES[item]}
          alt={item}
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6 }}
        />
      )}
    </div>
  )
}

function ToolSlot({ item, x }: { item: string | null; label: string; x: number }) {
  // Narzędzia są w rzędzie na dole grafiki, y ≈ 89.5%
  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`,
      top: '89.5%',
      width: SLOT_SIZE,
      height: SLOT_SIZE,
      transform: 'translate(-50%, -50%)',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: item ? 'pointer' : 'default',
      borderRadius: 8,
      boxShadow: item ? '0 0 12px rgba(220,160,60,0.5)' : undefined,
    }}>
      {item && ITEM_IMAGES[item] && (
        <img
          src={ITEM_IMAGES[item]}
          alt={item}
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6 }}
        />
      )}
    </div>
  )
}
