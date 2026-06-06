import { useState, useEffect } from 'react'
import type { Inventory, ItemId, EquipSlots } from '../types'
import { startForgeAmbience, stopForgeAmbience } from '../sounds'

// ─── Shop data ────────────────────────────────────────────────────────────────

interface Tier {
  id: ItemId
  label: string
  buy?: Partial<Record<keyof Inventory, number>>   // cost to buy (tier 1 only)
  upg?: Partial<Record<keyof Inventory, number>>   // cost to upgrade from previous tier
  atk?: number
  def?: number
}

interface ShopEntry {
  base: string
  name: string
  slot: keyof EquipSlots
  emoji: string
  tiers: [Tier, Tier, Tier]
}

const SHOP: ShopEntry[] = [
  {
    base: 'sword', name: 'Miecz', slot: 'weapon', emoji: '⚔️',
    tiers: [
      { id: 'sword_copper',  label: 'Miedziany', buy: { gold: 30 },     atk: 5  },
      { id: 'sword_iron',    label: 'Żelazny',   upg: { ironBar: 3 },   atk: 10 },
      { id: 'sword_diamond', label: 'Diamentowy',upg: { diamond: 2 },   atk: 18 },
    ],
  },
  {
    base: 'axe', name: 'Topór', slot: 'weapon', emoji: '🪓',
    tiers: [
      { id: 'axe_copper',  label: 'Miedziany', buy: { gold: 25 },     atk: 4  },
      { id: 'axe_iron',    label: 'Żelazny',   upg: { ironBar: 2 },   atk: 8  },
      { id: 'axe_diamond', label: 'Diamentowy',upg: { diamond: 1 },   atk: 14 },
    ],
  },
  {
    base: 'shield', name: 'Tarcza', slot: 'shield', emoji: '🛡️',
    tiers: [
      { id: 'shield_copper',  label: 'Miedziana', buy: { gold: 20 },     def: 4  },
      { id: 'shield_iron',    label: 'Żelazna',   upg: { ironBar: 2 },   def: 8  },
      { id: 'shield_diamond', label: 'Diamentowa',upg: { diamond: 1 },   def: 14 },
    ],
  },
  {
    base: 'armor', name: 'Kolczuga', slot: 'armor', emoji: '🔗',
    tiers: [
      { id: 'armor_copper',  label: 'Miedziana', buy: { gold: 40 },     def: 6  },
      { id: 'armor_iron',    label: 'Żelazna',   upg: { ironBar: 4 },   def: 12 },
      { id: 'armor_diamond', label: 'Diamentowa',upg: { diamond: 3 },   def: 20 },
    ],
  },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  inventory: Inventory
  ownedItems: ItemId[]
  onUpdate: (inv: Inventory, items: ItemId[]) => void
  onBack: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function canAfford(inv: Inventory, cost: Partial<Record<keyof Inventory, number>>): boolean {
  return Object.entries(cost).every(([k, v]) => (inv[k as keyof Inventory] as number) >= (v ?? 0))
}

function deduct(inv: Inventory, cost: Partial<Record<keyof Inventory, number>>): Inventory {
  const next = { ...inv }
  for (const [k, v] of Object.entries(cost)) {
    ;(next[k as keyof Inventory] as number) -= v ?? 0
  }
  return next
}

function ownedTier(entry: ShopEntry, ownedItems: ItemId[]): 0 | 1 | 2 | 3 {
  if (ownedItems.includes(entry.tiers[2].id)) return 3
  if (ownedItems.includes(entry.tiers[1].id)) return 2
  if (ownedItems.includes(entry.tiers[0].id)) return 1
  return 0
}

function ownedId(entry: ShopEntry, ownedItems: ItemId[]): ItemId | null {
  const t = ownedTier(entry, ownedItems)
  return t > 0 ? entry.tiers[t - 1].id : null
}

function costLabel(cost: Partial<Record<keyof Inventory, number>>): string {
  const MAP: Partial<Record<keyof Inventory, string>> = {
    gold: '💰', copperBar: '🔶', ironBar: '⚙️', diamond: '💎',
  }
  return Object.entries(cost).map(([k, v]) => `${MAP[k as keyof Inventory] ?? k} ${v}`).join(' ')
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Forge({ inventory, ownedItems, onUpdate, onBack }: Props) {
  const [tab, setTab] = useState<'weapons' | 'armor'>('weapons')

  useEffect(() => { startForgeAmbience(); return () => stopForgeAmbience() }, [])

  function handleBuy(entry: ShopEntry) {
    const cost = entry.tiers[0].buy!
    if (!canAfford(inventory, cost)) return
    const newInv = deduct(inventory, cost)
    onUpdate(newInv, [...ownedItems, entry.tiers[0].id])
  }

  function handleUpgrade(entry: ShopEntry) {
    const tier = ownedTier(entry, ownedItems)
    if (tier === 0 || tier === 3) return
    const nextTier = entry.tiers[tier] // tier is 1 or 2, so index = tier (0-based next)
    const cost = nextTier.upg!
    if (!canAfford(inventory, cost)) return
    const newInv = deduct(inventory, cost)
    const prevId = ownedId(entry, ownedItems)!
    const newItems = ownedItems.filter(x => x !== prevId).concat(nextTier.id)
    onUpdate(newInv, newItems)
  }

  const weapons = SHOP.filter(e => e.base === 'sword' || e.base === 'axe')
  const armors  = SHOP.filter(e => e.base === 'shield' || e.base === 'armor')
  const shown   = tab === 'weapons' ? weapons : armors

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: '#0c0806' }}>

      <img src="/assets/backgrounds/forge.webp" alt="" draggable={false}
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', pointerEvents: 'none', userSelect: 'none', zIndex: 0 }} />

      <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,4,2,0.72)', zIndex: 1, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 2, padding: '20px 16px 40px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,200,80,0.15)', borderRadius: 10, color: '#8a6040', fontFamily: 'Cinzel', fontSize: 16, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation' }}>←</button>
          <div>
            <h2 style={{ fontFamily: 'Cinzel', fontSize: 20, fontWeight: 700, color: '#f0c060', margin: 0, textShadow: '0 0 16px rgba(240,140,20,0.6)' }}>⚒️ Kuźnia</h2>
            <p style={{ fontFamily: 'Crimson Text', fontSize: 13, color: '#a07050', margin: '2px 0 0', fontStyle: 'italic' }}>Kup ekwipunek i ulepszaj go</p>
          </div>
          <div style={{ marginLeft: 'auto', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(200,160,40,0.25)', borderRadius: 8, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontFamily: 'Cinzel', fontSize: 13, color: '#d4a030' }}>💰 {inventory.gold} złota</span>
          </div>
        </div>

        {/* Zasoby */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
          {[
            { icon: '🔶', label: 'Miedź', val: inventory.copperBar },
            { icon: '⚙️',  label: 'Żelazo', val: inventory.ironBar },
            { icon: '💎', label: 'Diament', val: inventory.diamond },
          ].map(r => (
            <div key={r.label} style={{ background: 'rgba(0,0,0,0.55)', border: `1px solid ${r.val > 0 ? 'rgba(200,150,40,0.3)' : 'rgba(40,30,10,0.4)'}`, borderRadius: 8, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>{r.icon}</span>
              <span style={{ fontFamily: 'Cinzel', fontSize: 12, color: r.val > 0 ? '#c0a040' : '#4a3010' }}>{r.val}</span>
              <span style={{ fontFamily: 'Crimson Text', fontSize: 10, color: '#604020' }}>{r.label}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['weapons', 'armor'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontFamily: 'Cinzel', fontSize: 12, fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation', background: tab === t ? 'rgba(160,100,20,0.7)' : 'rgba(0,0,0,0.5)', border: `1px solid ${tab === t ? 'rgba(200,140,40,0.5)' : 'rgba(60,40,10,0.4)'}`, color: tab === t ? '#f0c060' : '#605030' }}>
              {t === 'weapons' ? '⚔️ Broń' : '🛡️ Zbroja'}
            </button>
          ))}
        </div>

        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shown.map(entry => {
            const tier = ownedTier(entry, ownedItems)
            const curTier = tier > 0 ? entry.tiers[tier - 1] : null
            const nextTier = tier < 3 ? entry.tiers[tier as 0 | 1 | 2] : null
            const buyable = tier === 0 && canAfford(inventory, entry.tiers[0].buy!)
            const upgradeable = tier > 0 && tier < 3 && canAfford(inventory, nextTier!.upg!)

            return (
              <div key={entry.base} style={{ background: 'rgba(0,0,0,0.6)', border: `1px solid ${tier > 0 ? 'rgba(200,150,40,0.35)' : 'rgba(50,35,10,0.4)'}`, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>

                {/* Icon + tier dots */}
                <div style={{ textAlign: 'center', flexShrink: 0, width: 44 }}>
                  <div style={{ fontSize: 26 }}>{entry.emoji}</div>
                  <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 4 }}>
                    {[1,2,3].map(t => (
                      <div key={t} style={{ width: 7, height: 7, borderRadius: '50%', background: t <= tier ? (t === 3 ? '#60e8ff' : t === 2 ? '#a0a0d0' : '#e09030') : 'rgba(255,255,255,0.12)' }} />
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Cinzel', fontSize: 14, fontWeight: 700, color: tier > 0 ? '#e0c070' : '#706040' }}>
                    {entry.name}
                    {curTier && <span style={{ fontFamily: 'Crimson Text', fontSize: 11, color: '#806030', marginLeft: 6 }}>{curTier.label}</span>}
                  </div>
                  <div style={{ fontFamily: 'Crimson Text', fontSize: 11, color: '#908060', marginTop: 2 }}>
                    {(curTier ?? entry.tiers[0]).atk ? `⚔ ATK +${(curTier ?? entry.tiers[0]).atk}` : ''}
                    {(curTier ?? entry.tiers[0]).def ? `🛡 DEF +${(curTier ?? entry.tiers[0]).def}` : ''}
                  </div>
                  {tier === 0 && (
                    <div style={{ fontFamily: 'Crimson Text', fontSize: 11, color: '#605030', marginTop: 2 }}>
                      Koszt: {costLabel(entry.tiers[0].buy!)}
                    </div>
                  )}
                  {tier > 0 && tier < 3 && (
                    <div style={{ fontFamily: 'Crimson Text', fontSize: 11, color: '#605040', marginTop: 2 }}>
                      Ulepsz → {nextTier!.label}: {costLabel(nextTier!.upg!)}
                    </div>
                  )}
                  {tier === 3 && (
                    <div style={{ fontFamily: 'Crimson Text', fontSize: 11, color: '#40a0b0', marginTop: 2, fontStyle: 'italic' }}>Maksymalny poziom</div>
                  )}
                </div>

                {/* Action */}
                {tier === 0 && (
                  <button onClick={() => handleBuy(entry)} disabled={!buyable}
                    style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 8, fontFamily: 'Cinzel', fontSize: 11, fontWeight: 700, cursor: buyable ? 'pointer' : 'not-allowed', touchAction: 'manipulation', background: buyable ? 'rgba(60,40,5,0.9)' : 'rgba(20,15,5,0.5)', border: `1px solid ${buyable ? 'rgba(180,120,20,0.6)' : 'rgba(40,30,10,0.3)'}`, color: buyable ? '#d09030' : '#403020', whiteSpace: 'nowrap' }}>
                    Kup
                  </button>
                )}
                {tier > 0 && tier < 3 && (
                  <button onClick={() => handleUpgrade(entry)} disabled={!upgradeable}
                    style={{ flexShrink: 0, padding: '7px 10px', borderRadius: 8, fontFamily: 'Cinzel', fontSize: 11, fontWeight: 700, cursor: upgradeable ? 'pointer' : 'not-allowed', touchAction: 'manipulation', background: upgradeable ? 'rgba(10,40,60,0.9)' : 'rgba(10,20,30,0.5)', border: `1px solid ${upgradeable ? 'rgba(60,140,200,0.6)' : 'rgba(20,50,80,0.3)'}`, color: upgradeable ? '#60c0e0' : '#304050', whiteSpace: 'nowrap' }}>
                    Ulepsz
                  </button>
                )}
                {tier === 3 && (
                  <span style={{ fontFamily: 'Cinzel', fontSize: 11, color: '#40b0c0', flexShrink: 0 }}>✦ MAX</span>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
