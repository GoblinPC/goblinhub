import { useState } from 'react'
import type { EquipSlots, ToolSlots, ItemId } from '../types'

interface Props {
  equip: EquipSlots
  tools: ToolSlots
  ownedItems: ItemId[]
  onUpdate: (equip: EquipSlots, tools: ToolSlots) => void
  onBack: () => void
}

// Obraz: 1024×1536 (2:3). Pozycje slotów jako % szerokości i wysokości obrazu.
const EQUIP_SLOTS: { key: keyof EquipSlots; label: string; x: number; y: number }[] = [
  { key: 'helmet',      label: 'Hełm',         x: 50,  y: 14.3 },
  { key: 'shoulders',   label: 'Naramienniki',  x: 14,  y: 27.5 },
  { key: 'armor',       label: 'Zbroja',        x: 86,  y: 27.5 },
  { key: 'weapon',      label: 'Broń',          x: 14,  y: 42.5 },
  { key: 'shield',      label: 'Tarcza',        x: 86,  y: 42.5 },
  { key: 'cloak',       label: 'Płaszcz',       x: 14,  y: 57.2 },
  { key: 'accessories', label: 'Akcesoria',     x: 86,  y: 57.2 },
  { key: 'amulet',      label: 'Amulet',        x: 33,  y: 69.8 },
  { key: 'boots',       label: 'Buty',          x: 67,  y: 69.8 },
]

const TOOL_SLOTS: { key: keyof ToolSlots; label: string; x: number }[] = [
  { key: 'axe',        label: 'Topór',  x: 9  },
  { key: 'pickaxe',    label: 'Kilof',  x: 25 },
  { key: 'fishingRod', label: 'Wędka',  x: 41 },
  { key: 'shovel',     label: 'Łopata', x: 57 },
  { key: 'hammer',     label: 'Młot',   x: 74 },
  { key: 'misc',       label: 'Inne',   x: 90 },
]

// Metadane przedmiotów
export const ITEM_META: Record<ItemId, {
  label: string
  image: string
  slots: (keyof EquipSlots)[]
}> = {
  sword_copper: {
    label: 'Miecz miedziany',
    image: '/assets/backgrounds/sword.png',
    slots: ['weapon'],
  },
}

// Rozmiar klikalnego slotu (% szerokości obrazu)
const SLOT_W = 15
const TOOL_Y = 84

export default function CharacterScreen({ equip, tools, ownedItems, onUpdate, onBack }: Props) {
  const [activeSlot, setActiveSlot] = useState<keyof EquipSlots | null>(null)

  function handleEquip(itemId: ItemId) {
    if (!activeSlot) return
    onUpdate({ ...equip, [activeSlot]: itemId }, tools)
    setActiveSlot(null)
  }

  function handleUnequip() {
    if (!activeSlot) return
    onUpdate({ ...equip, [activeSlot]: null }, tools)
    setActiveSlot(null)
  }

  const equippedIds = Object.values(equip).filter(Boolean) as ItemId[]
  const activeItem = activeSlot ? equip[activeSlot] : null
  const activeLabel = activeSlot ? EQUIP_SLOTS.find(s => s.key === activeSlot)?.label : ''

  // Przedmioty pasujące do aktywnego slotu i niewyekwipowane w innym miejscu
  const availableForSlot = activeSlot
    ? ownedItems.filter(id => {
        const meta = ITEM_META[id]
        return meta.slots.includes(activeSlot) && (equip[activeSlot] === id || !equippedIds.includes(id))
      })
    : []

  return (
    <div className="screen-enter" style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: '#06050300', overflow: 'hidden' }}>

      {/* Obraz postaci — 2:3, wypełnia szerokość */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '150%' /* 1536/1024 */ }}>
        <img
          src="/assets/backgrounds/eq.png"
          alt=""
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', userSelect: 'none', pointerEvents: 'none' }}
        />

        {/* Przycisk powrotu */}
        <button onClick={onBack} style={{
          position: 'absolute', top: '2.5%', left: '4%', zIndex: 20,
          background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '10px', color: '#c0a070', fontFamily: 'Cinzel', fontSize: '16px',
          width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', touchAction: 'manipulation', backdropFilter: 'blur(4px)',
        }}>←</button>

        {/* Sloty ekwipunku */}
        {EQUIP_SLOTS.map(slot => {
          const item = equip[slot.key]
          const isActive = activeSlot === slot.key
          return (
            <button
              key={slot.key}
              onClick={() => setActiveSlot(isActive ? null : slot.key)}
              style={{
                position: 'absolute',
                left: `${slot.x - SLOT_W / 2}%`,
                top: `${slot.y - SLOT_W / 2 * (1024 / 1536)}%`,
                width: `${SLOT_W}%`,
                paddingBottom: `${SLOT_W * (1024 / 1536)}%`,
                background: 'transparent',
                border: `2px solid ${isActive ? 'rgba(255,200,80,0.9)' : item ? 'rgba(200,150,50,0.5)' : 'transparent'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                touchAction: 'manipulation',
                zIndex: 10,
                boxShadow: isActive ? '0 0 16px rgba(255,200,60,0.6)' : item ? '0 0 10px rgba(200,140,40,0.3)' : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            >
              {item && ITEM_META[item] && (
                <img
                  src={ITEM_META[item].image}
                  alt=""
                  draggable={false}
                  style={{ position: 'absolute', inset: '4px', width: 'calc(100% - 8px)', height: 'calc(100% - 8px)', objectFit: 'contain', borderRadius: 4 }}
                />
              )}
            </button>
          )
        })}

        {/* Sloty narzędzi */}
        {TOOL_SLOTS.map(slot => {
          const item = tools[slot.key]
          return (
            <div
              key={slot.key}
              style={{
                position: 'absolute',
                left: `${slot.x - SLOT_W / 2}%`,
                top: `${TOOL_Y - SLOT_W / 2 * (1024 / 1536)}%`,
                width: `${SLOT_W}%`,
                paddingBottom: `${SLOT_W * (1024 / 1536)}%`,
                background: 'transparent',
                border: item ? '2px solid rgba(200,150,50,0.5)' : 'none',
                borderRadius: '8px',
                zIndex: 10,
              }}
            >
              {item && ITEM_META[item as ItemId] && (
                <img
                  src={ITEM_META[item as ItemId].image}
                  alt=""
                  draggable={false}
                  style={{ position: 'absolute', inset: '4px', width: 'calc(100% - 8px)', height: 'calc(100% - 8px)', objectFit: 'contain', borderRadius: 4 }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom sheet — picker przedmiotów */}
      {activeSlot && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setActiveSlot(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 30 }}
          />

          {/* Panel */}
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: '480px',
            background: 'linear-gradient(180deg, rgba(14,10,5,0.98) 0%, #0e0a05 100%)',
            border: '1px solid rgba(180,130,50,0.3)',
            borderBottom: 'none',
            borderRadius: '20px 20px 0 0',
            padding: '20px 16px 36px',
            zIndex: 40,
          }}>
            {/* Uchwyt */}
            <div style={{ width: 40, height: 4, background: 'rgba(200,150,60,0.3)', borderRadius: 2, margin: '0 auto 16px' }} />

            <div style={{ fontFamily: 'Cinzel', fontSize: '14px', color: '#c0a060', marginBottom: 4, textAlign: 'center', letterSpacing: '0.06em' }}>
              {activeLabel}
            </div>
            <div style={{ fontFamily: 'Crimson Text', fontSize: '12px', color: '#6a5030', textAlign: 'center', marginBottom: 16, fontStyle: 'italic' }}>
              {activeItem ? 'Wybrany przedmiot' : 'Wybierz przedmiot do założenia'}
            </div>

            {/* Lista przedmiotów */}
            {availableForSlot.length === 0 && !activeItem && (
              <p style={{ fontFamily: 'Crimson Text', fontSize: '14px', color: '#4a3820', textAlign: 'center', fontStyle: 'italic' }}>
                Nie posiadasz żadnego przedmiotu do tego slotu
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {availableForSlot.map(id => {
                const meta = ITEM_META[id]
                const isEquipped = equip[activeSlot!] === id
                return (
                  <button
                    key={id}
                    onClick={() => handleEquip(id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      background: isEquipped ? 'rgba(180,130,40,0.2)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isEquipped ? 'rgba(200,150,50,0.6)' : 'rgba(100,80,40,0.3)'}`,
                      borderRadius: 12, padding: '10px 14px',
                      cursor: 'pointer', touchAction: 'manipulation', width: '100%',
                    }}
                  >
                    <img src={meta.image} alt="" draggable={false} style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 6 }} />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontFamily: 'Cinzel', fontSize: '13px', color: '#d0a060', fontWeight: 700 }}>{meta.label}</div>
                      {isEquipped && <div style={{ fontFamily: 'Crimson Text', fontSize: '11px', color: '#907040', fontStyle: 'italic' }}>Założony</div>}
                    </div>
                    {!isEquipped && <span style={{ fontFamily: 'Cinzel', fontSize: '11px', color: '#806030' }}>Załóż →</span>}
                  </button>
                )
              })}

              {/* Zdejmij */}
              {activeItem && (
                <button
                  onClick={handleUnequip}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 8, marginTop: 4,
                    background: 'rgba(100,30,20,0.3)', border: '1px solid rgba(160,60,40,0.4)',
                    borderRadius: 12, padding: '10px 14px',
                    cursor: 'pointer', touchAction: 'manipulation', width: '100%',
                    fontFamily: 'Cinzel', fontSize: '12px', color: '#c06050',
                  }}
                >
                  Zdejmij przedmiot
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
