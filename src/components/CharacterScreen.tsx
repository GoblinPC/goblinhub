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
}> = {
  sword_copper: {
    label: 'Miecz miedziany',
    image: '/assets/backgrounds/sword.png',
    slots: ['weapon'],
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

const TOOL_SLOTS: { key: keyof ToolSlots; label: string }[] = [
  { key: 'axe',        label: 'Topór'  },
  { key: 'pickaxe',    label: 'Kilof'  },
  { key: 'fishingRod', label: 'Wędka'  },
  { key: 'shovel',     label: 'Łopata' },
  { key: 'hammer',     label: 'Młot'   },
  { key: 'misc',       label: 'Inne'   },
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
      position: 'relative', width: '100%', height: '100dvh',
      background: 'radial-gradient(ellipse at 50% 30%, #1a1208 0%, #080604 70%)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 8px', flexShrink: 0 }}>
        <button onClick={onBack} style={{
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '10px', color: '#c0a070', fontFamily: 'Cinzel', fontSize: '16px',
          width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0,
        }}>←</button>
        <div>
          <h2 style={{ fontFamily: 'Cinzel', fontSize: '18px', fontWeight: 700, color: '#e0c070', margin: 0, textShadow: '0 0 12px rgba(200,140,30,0.5)' }}>Ekwipunek</h2>
          <p style={{ fontFamily: 'Crimson Text', fontSize: '12px', color: '#7a5830', margin: '1px 0 0', fontStyle: 'italic' }}>Zarządzaj ekwipunkiem goblina</p>
        </div>
      </div>

      {/* Hełm — nad postacią */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 6, flexShrink: 0 }}>
        <Slot slotKey="helmet" equip={equip} active={activeSlot} onPress={setActiveSlot} slots={EQUIP_SLOTS} />
      </div>

      {/* Główny obszar: lewa kolumna | goblin | prawa kolumna */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', minHeight: 0 }}>

        {/* Lewa kolumna */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'space-evenly', height: '100%' }}>
          <Slot slotKey="shoulders"  equip={equip} active={activeSlot} onPress={setActiveSlot} slots={EQUIP_SLOTS} />
          <Slot slotKey="weapon"     equip={equip} active={activeSlot} onPress={setActiveSlot} slots={EQUIP_SLOTS} />
          <Slot slotKey="cloak"      equip={equip} active={activeSlot} onPress={setActiveSlot} slots={EQUIP_SLOTS} />
        </div>

        {/* Goblin */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: 0 }}>
          <img src="/assets/backgrounds/eq.png" alt="" draggable={false}
            style={{ maxHeight: '46dvh', width: 'auto', maxWidth: '100%', objectFit: 'contain', userSelect: 'none' }} />
        </div>

        {/* Prawa kolumna */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'space-evenly', height: '100%' }}>
          <Slot slotKey="armor"        equip={equip} active={activeSlot} onPress={setActiveSlot} slots={EQUIP_SLOTS} />
          <Slot slotKey="shield"       equip={equip} active={activeSlot} onPress={setActiveSlot} slots={EQUIP_SLOTS} />
          <Slot slotKey="accessories"  equip={equip} active={activeSlot} onPress={setActiveSlot} slots={EQUIP_SLOTS} />
        </div>
      </div>

      {/* Amulet + Buty */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, padding: '6px 0 10px', flexShrink: 0 }}>
        <Slot slotKey="amulet" equip={equip} active={activeSlot} onPress={setActiveSlot} slots={EQUIP_SLOTS} />
        <Slot slotKey="boots"  equip={equip} active={activeSlot} onPress={setActiveSlot} slots={EQUIP_SLOTS} />
      </div>

      {/* Narzędzia */}
      <div style={{ flexShrink: 0, borderTop: '1px solid rgba(180,130,50,0.2)', padding: '8px 8px 20px' }}>
        <div style={{ fontFamily: 'Cinzel', fontSize: '9px', color: '#6a5030', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 6 }}>NARZĘDZIA</div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {TOOL_SLOTS.map(s => (
            <ToolSlot key={s.key} label={s.label} item={tools[s.key]} />
          ))}
        </div>
      </div>

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

// ─── Slot button ──────────────────────────────────────────────────────────────

function Slot({ slotKey, equip, active, onPress, slots }: {
  slotKey: keyof EquipSlots
  equip: EquipSlots
  active: keyof EquipSlots | null
  onPress: (k: keyof EquipSlots) => void
  slots: typeof EQUIP_SLOTS
}) {
  const item = equip[slotKey]
  const isActive = active === slotKey
  const meta = slots.find(s => s.key === slotKey)!
  return (
    <button
      onClick={() => onPress(slotKey)}
      style={{
        width: SLOT, height: SLOT, flexShrink: 0,
        background: isActive ? 'rgba(40,28,8,0.95)' : 'rgba(14,10,5,0.88)',
        border: `2px solid ${isActive ? 'rgba(255,200,80,0.9)' : item ? 'rgba(180,130,50,0.7)' : 'rgba(120,90,45,0.55)'}`,
        borderRadius: 10,
        cursor: 'pointer', touchAction: 'manipulation',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
        boxShadow: isActive ? '0 0 14px rgba(255,200,60,0.5)' : item ? '0 0 8px rgba(180,120,30,0.3)' : 'inset 0 0 8px rgba(0,0,0,0.4)',
        transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
      }}
    >
      {item && ITEM_META[item] ? (
        <img src={ITEM_META[item].image} alt="" draggable={false} style={{ width: SLOT - 10, height: SLOT - 10, objectFit: 'contain' }} />
      ) : (
        <>
          <span style={{ fontSize: 18, lineHeight: 1, opacity: 0.45 }}>{meta.icon}</span>
          <span style={{ fontFamily: 'Cinzel', fontSize: 8, color: '#6a5030', letterSpacing: '0.03em' }}>{meta.label}</span>
        </>
      )}
    </button>
  )
}

// ─── Tool slot (read-only for now) ───────────────────────────────────────────

function ToolSlot({ label, item }: { label: string; item: ItemId | null }) {
  return (
    <div style={{
      width: SLOT - 6, height: SLOT - 6,
      background: 'rgba(10,8,5,0.7)',
      border: `1px solid ${item ? 'rgba(180,130,50,0.5)' : 'rgba(60,45,25,0.4)'}`,
      borderRadius: 8,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
    }}>
      {item && ITEM_META[item as ItemId]
        ? <img src={ITEM_META[item as ItemId].image} alt="" draggable={false} style={{ width: 36, height: 36, objectFit: 'contain' }} />
        : <div style={{ fontSize: 10, color: '#3a2e18', fontFamily: 'Cinzel' }}>{label[0]}</div>
      }
    </div>
  )
}
