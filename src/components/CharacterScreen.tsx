import { useState } from 'react'
import type { EquipSlots, ToolSlots, ItemId } from '../types'

interface Props {
  equip: EquipSlots
  tools: ToolSlots
  ownedItems: ItemId[]
  onUpdate: (equip: EquipSlots, tools: ToolSlots) => void
  onBack: () => void
}

export const ITEM_META: Record<ItemId, {
  label: string
  image: string
  slots: (keyof EquipSlots)[]
  atk?: number
  def?: number
}> = {
  sword_copper: {
    label: 'Miecz miedziany',
    image: '/assets/backgrounds/sword.png',
    slots: ['weapon'],
    atk: 8,
  },
  club_wooden: {
    label: 'Maczuga drewniana',
    image: '/assets/backgrounds/sword.png',
    slots: ['weapon'],
    atk: 3,
  },
}

const EQUIP_SLOTS: { key: keyof EquipSlots; label: string; icon: string }[] = [
  { key: 'helmet',      label: 'Hełm',     icon: '⛑' },
  { key: 'shoulders',   label: 'Naram.',   icon: '🫱' },
  { key: 'armor',       label: 'Zbroja',   icon: '🦺' },
  { key: 'weapon',      label: 'Broń',     icon: '⚔️' },
  { key: 'shield',      label: 'Tarcza',   icon: '🛡' },
  { key: 'cloak',       label: 'Płaszcz',  icon: '🧥' },
  { key: 'accessories', label: 'Akces.',   icon: '💍' },
  { key: 'amulet',      label: 'Amulet',   icon: '📿' },
  { key: 'boots',       label: 'Buty',     icon: '🥾' },
]


const SLOT = 58  // px

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
  const activeLabel = EQUIP_SLOTS.find(s => s.key === activeSlot)?.label ?? ''

  const availableForSlot = activeSlot
    ? ownedItems.filter(id => {
        const meta = ITEM_META[id]
        return meta.slots.includes(activeSlot) && (equip[activeSlot] === id || !equippedIds.includes(id))
      })
    : []

  return (
    <div className="screen-enter" style={{
      position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden',
    }}>

      {/* Grafika na cały ekran */}
      <img src="/assets/backgrounds/eq.png" alt="" draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', userSelect: 'none', pointerEvents: 'none' }} />

      {/* Gradient góra (header) */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 100,
        background: 'linear-gradient(180deg, rgba(5,3,1,0.85) 0%, transparent 100%)', pointerEvents: 'none' }} />

      {/* Gradient dół (narzędzia) */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 110,
        background: 'linear-gradient(0deg, rgba(5,3,1,0.9) 0%, transparent 100%)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 0' }}>
        <button onClick={onBack} style={{
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '10px', color: '#c0a070', fontFamily: 'Cinzel', fontSize: '16px',
          width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0,
        }}>←</button>
        <div>
          <h2 style={{ fontFamily: 'Cinzel', fontSize: '18px', fontWeight: 700, color: '#e0c070', margin: 0, textShadow: '0 0 12px rgba(200,140,30,0.5)' }}>Ekwipunek</h2>
          <p style={{ fontFamily: 'Crimson Text', fontSize: '12px', color: '#9a7840', margin: '1px 0 0', fontStyle: 'italic' }}>Zarządzaj ekwipunkiem goblina</p>
        </div>
      </div>

      {/* Sloty — overlay na grafice */}
      {/* Hełm */}
      <AbsSlot slotKey="helmet"      top="11%" left="50%" transform="translateX(-50%)" equip={equip} active={activeSlot} onPress={setActiveSlot} slots={EQUIP_SLOTS} />
      {/* Lewo */}
      <AbsSlot slotKey="shoulders"   top="24%" left="4%"  equip={equip} active={activeSlot} onPress={setActiveSlot} slots={EQUIP_SLOTS} />
      <AbsSlot slotKey="weapon"      top="40%" left="4%"  equip={equip} active={activeSlot} onPress={setActiveSlot} slots={EQUIP_SLOTS} />
      <AbsSlot slotKey="cloak"       top="56%" left="4%"  equip={equip} active={activeSlot} onPress={setActiveSlot} slots={EQUIP_SLOTS} />
      <AbsSlot slotKey="boots"       top="72%" left="4%"  equip={equip} active={activeSlot} onPress={setActiveSlot} slots={EQUIP_SLOTS} />
      {/* Prawo */}
      <AbsSlot slotKey="armor"       top="24%" right="4%" equip={equip} active={activeSlot} onPress={setActiveSlot} slots={EQUIP_SLOTS} />
      <AbsSlot slotKey="shield"      top="40%" right="4%" equip={equip} active={activeSlot} onPress={setActiveSlot} slots={EQUIP_SLOTS} />
      <AbsSlot slotKey="accessories" top="56%" right="4%" equip={equip} active={activeSlot} onPress={setActiveSlot} slots={EQUIP_SLOTS} />
      <AbsSlot slotKey="amulet"      top="72%" right="4%" equip={equip} active={activeSlot} onPress={setActiveSlot} slots={EQUIP_SLOTS} />

      {/* Bottom sheet picker */}
      {activeSlot && (
        <>
          <div onClick={() => setActiveSlot(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 30 }} />
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: '480px',
            background: '#0e0a05', border: '1px solid rgba(180,130,50,0.3)', borderBottom: 'none',
            borderRadius: '20px 20px 0 0', padding: '16px 16px 36px', zIndex: 40,
          }}>
            <div style={{ width: 36, height: 4, background: 'rgba(200,150,60,0.3)', borderRadius: 2, margin: '0 auto 14px' }} />
            <div style={{ fontFamily: 'Cinzel', fontSize: '14px', color: '#c0a060', textAlign: 'center', marginBottom: 12 }}>{activeLabel}</div>

            {availableForSlot.length === 0 && !activeItem && (
              <p style={{ fontFamily: 'Crimson Text', fontSize: '14px', color: '#4a3820', textAlign: 'center', fontStyle: 'italic' }}>
                Brak przedmiotów do tego slotu
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {availableForSlot.map(id => {
                const meta = ITEM_META[id]
                const isEquipped = equip[activeSlot!] === id
                return (
                  <button key={id} onClick={() => handleEquip(id)} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: isEquipped ? 'rgba(180,130,40,0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isEquipped ? 'rgba(200,150,50,0.6)' : 'rgba(100,80,40,0.25)'}`,
                    borderRadius: 12, padding: '10px 14px',
                    cursor: 'pointer', touchAction: 'manipulation', width: '100%',
                  }}>
                    <img src={meta.image} alt="" draggable={false} style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 6 }} />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontFamily: 'Cinzel', fontSize: '13px', color: '#d0a060', fontWeight: 700 }}>{meta.label}</div>
                      {isEquipped && <div style={{ fontFamily: 'Crimson Text', fontSize: '11px', color: '#907040', fontStyle: 'italic' }}>Założony</div>}
                    </div>
                    {!isEquipped && <span style={{ fontFamily: 'Cinzel', fontSize: '11px', color: '#806030' }}>Załóż →</span>}
                  </button>
                )
              })}

              {activeItem && (
                <button onClick={handleUnequip} style={{
                  marginTop: 4, background: 'rgba(100,30,20,0.3)', border: '1px solid rgba(160,60,40,0.4)',
                  borderRadius: 12, padding: '10px', cursor: 'pointer', touchAction: 'manipulation', width: '100%',
                  fontFamily: 'Cinzel', fontSize: '12px', color: '#c06050',
                }}>
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

// ─── Slot button (absolute overlay) ──────────────────────────────────────────

function AbsSlot({ slotKey, equip, active, onPress, slots, top, left, right, bottom, transform }: {
  slotKey: keyof EquipSlots
  equip: EquipSlots
  active: keyof EquipSlots | null
  onPress: (k: keyof EquipSlots) => void
  slots: typeof EQUIP_SLOTS
  top?: string; left?: string; right?: string; bottom?: string; transform?: string
}) {
  const item = equip[slotKey]
  const isActive = active === slotKey
  const meta = slots.find(s => s.key === slotKey)!
  return (
    <button
      onClick={() => onPress(slotKey)}
      style={{
        position: 'absolute', top, left, right, bottom,
        transform,
        width: SLOT, height: SLOT,
        background: isActive ? 'rgba(40,28,8,0.85)' : 'rgba(10,7,3,0.65)',
        border: `2px solid ${isActive ? 'rgba(255,200,80,0.9)' : item ? 'rgba(180,130,50,0.75)' : 'rgba(120,90,45,0.5)'}`,
        borderRadius: 10,
        cursor: 'pointer', touchAction: 'manipulation',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
        boxShadow: isActive ? '0 0 14px rgba(255,200,60,0.5)' : item ? '0 0 10px rgba(180,120,30,0.4)' : 'none',
        backdropFilter: 'blur(2px)',
        transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
        zIndex: 10,
      }}
    >
      {item && ITEM_META[item] ? (
        <img src={ITEM_META[item].image} alt="" draggable={false} style={{ width: SLOT - 10, height: SLOT - 10, objectFit: 'contain' }} />
      ) : (
        <>
          <span style={{ fontSize: 18, lineHeight: 1, opacity: 0.5 }}>{meta.icon}</span>
          <span style={{ fontFamily: 'Cinzel', fontSize: 8, color: '#8a6840', letterSpacing: '0.03em' }}>{meta.label}</span>
        </>
      )}
    </button>
  )
}

