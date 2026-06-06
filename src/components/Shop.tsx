import { useState } from 'react'
import type { Inventory } from '../types'
import { ITEM_LABELS, ITEM_ICONS, ITEM_VALUES } from './ItemRow'

interface Props {
  inventory: Inventory
  onUpdate: (inv: Inventory) => void
  onBack: () => void
}

// Items that can be sold (value > 0, skip gold)
const SELLABLE = (Object.keys(ITEM_VALUES) as (keyof Inventory)[]).filter(
  k => k !== 'gold' && ITEM_VALUES[k] > 0
)

export default function Shop({ inventory, onUpdate, onBack }: Props) {
  const [flash, setFlash] = useState<string | null>(null)

  function sellOne(item: keyof Inventory) {
    const qty = inventory[item] as number
    if (qty <= 0) return
    const value = ITEM_VALUES[item]
    const newInv = { ...inventory, [item]: qty - 1, gold: inventory.gold + value }
    onUpdate(newInv)
    setFlash(item)
    setTimeout(() => setFlash(null), 600)
  }

  function sellAll(item: keyof Inventory) {
    const qty = inventory[item] as number
    if (qty <= 0) return
    const value = ITEM_VALUES[item]
    const newInv = { ...inventory, [item]: 0, gold: inventory.gold + value * qty }
    onUpdate(newInv)
    setFlash(item)
    setTimeout(() => setFlash(null), 600)
  }

  const hasAnything = SELLABLE.some(k => (inventory[k] as number) > 0)

  function sellEverything() {
    if (!hasAnything) return
    let gained = 0
    const newInv = { ...inventory }
    for (const item of SELLABLE) {
      const qty = inventory[item] as number
      if (qty > 0) {
        gained += qty * ITEM_VALUES[item]
        newInv[item] = 0 as never
      }
    }
    newInv.gold += gained
    onUpdate(newInv)
    setFlash('__all__')
    setTimeout(() => setFlash(null), 800)
  }

  return (
    <div className="screen-enter" style={{
      width: '100%', minHeight: '100dvh',
      background: 'radial-gradient(ellipse at 50% 0%, #1a120a 0%, #080604 80%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 16px 12px', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#c09040', fontFamily: 'Cinzel', fontSize: 16, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0 }}>←</button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: 'Cinzel', fontSize: 19, fontWeight: 700, color: '#e0a040', margin: 0, textShadow: '0 0 12px rgba(200,140,20,0.45)' }}>🛒 Sklepikarz</h2>
          <p style={{ fontFamily: 'Crimson Text', fontSize: 13, color: '#7a6030', margin: '2px 0 0', fontStyle: 'italic' }}>Kupię wszystko za uczciwe złoto</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(200,160,30,0.3)', borderRadius: 10, padding: '6px 12px' }}>
          <span style={{ fontSize: 18 }}>💰</span>
          <span style={{ fontFamily: 'Cinzel', fontSize: 16, fontWeight: 700, color: '#e0b030' }}>{inventory.gold}</span>
        </div>
      </div>

      {/* Sell all button */}
      <div style={{ padding: '0 16px 12px' }}>
        <button
          onClick={sellEverything}
          disabled={!hasAnything}
          style={{
            width: '100%', padding: '10px', borderRadius: 10,
            fontFamily: 'Cinzel', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
            background: hasAnything ? 'linear-gradient(135deg,#4a3000,#c08020)' : 'rgba(20,15,5,0.5)',
            border: `1px solid ${hasAnything ? 'rgba(200,150,30,0.5)' : 'rgba(60,50,20,0.3)'}`,
            color: hasAnything ? '#f0d070' : '#504030',
            cursor: hasAnything ? 'pointer' : 'not-allowed',
            touchAction: 'manipulation',
            boxShadow: hasAnything ? '0 0 16px rgba(160,100,10,0.3)' : 'none',
            opacity: flash === '__all__' ? 0.5 : 1,
            transition: 'opacity 0.3s',
          }}
        >
          💰 Sprzedaj wszystko
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(120,80,20,0.2)', margin: '0 16px 12px' }} />

      {/* Item list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px' }}>
        {SELLABLE.map(item => {
          const qty = inventory[item] as number
          const value = ITEM_VALUES[item]
          const isFlashing = flash === item
          return (
            <div key={item} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', marginBottom: 8,
              background: qty > 0 ? 'rgba(20,14,5,0.7)' : 'rgba(12,10,5,0.4)',
              border: `1px solid ${qty > 0 ? 'rgba(120,80,20,0.35)' : 'rgba(50,40,15,0.2)'}`,
              borderRadius: 12,
              opacity: isFlashing ? 0.5 : 1,
              transition: 'opacity 0.3s',
              backdropFilter: 'blur(4px)',
            }}>
              <span style={{ fontSize: 22, width: 28, textAlign: 'center', flexShrink: 0 }}>{ITEM_ICONS[item]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Crimson Text', fontSize: 15, color: qty > 0 ? '#d4a870' : '#504030', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ITEM_LABELS[item]}
                </div>
                <div style={{ fontFamily: 'Cinzel', fontSize: 10, color: '#806030', marginTop: 1 }}>
                  {value} 💰 / szt · masz: <span style={{ color: qty > 0 ? '#c0a040' : '#504030' }}>{qty}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <SellBtn label="-1" disabled={qty <= 0} onClick={() => sellOne(item)} />
                <SellBtn label="Wszystko" disabled={qty <= 0} onClick={() => sellAll(item)} gold />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SellBtn({ label, disabled, onClick, gold }: { label: string; disabled: boolean; onClick: () => void; gold?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: gold ? '5px 10px' : '5px 8px',
        borderRadius: 8,
        fontFamily: 'Cinzel', fontSize: 10, fontWeight: 600,
        background: disabled ? 'rgba(20,15,5,0.4)' : gold ? 'rgba(80,50,5,0.8)' : 'rgba(30,22,8,0.8)',
        border: `1px solid ${disabled ? 'rgba(40,30,10,0.3)' : gold ? 'rgba(160,110,20,0.6)' : 'rgba(90,65,15,0.5)'}`,
        color: disabled ? '#403020' : gold ? '#d0a030' : '#907030',
        cursor: disabled ? 'not-allowed' : 'pointer',
        touchAction: 'manipulation',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}
