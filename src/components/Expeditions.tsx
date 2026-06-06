import { useState, useRef, useEffect } from 'react'
import type { Professions, EquipSlots, Inventory, ItemId } from '../types'
import { addProfessionXp } from '../store'

// ─── Monster definitions ──────────────────────────────────────────────────────

interface ResourceDrop { item: keyof Inventory; chance: number; amount?: number }

interface MonsterDef {
  id: string
  name: string
  emoji: string
  maxHp: number
  attack: number
  defense: number
  xpReward: number
  goldReward: [number, number]
  loot: ResourceDrop[]
  rarity: string   // display label
  rarityColor: string
}

const MONSTERS: MonsterDef[] = [
  {
    id: 'wolf',
    name: 'Wilk',
    emoji: '🐺',
    maxHp: 20,
    attack: 7,
    defense: 1,
    xpReward: 25,
    goldReward: [4, 10],
    rarity: 'Pospolity',
    rarityColor: '#90a870',
    loot: [
      { item: 'wolfMeat', chance: 1.0, amount: 1 },
      { item: 'wolfHide', chance: 0.40 },
    ],
  },
  {
    id: 'kobold',
    name: 'Kobold',
    emoji: '👺',
    maxHp: 28,
    attack: 9,
    defense: 2,
    xpReward: 35,
    goldReward: [6, 16],
    rarity: 'Pospolity',
    rarityColor: '#90a870',
    loot: [
      { item: 'koboldTooth', chance: 1.0, amount: 1 },
      { item: 'koboldEar',  chance: 0.60 },
    ],
  },
  {
    id: 'bear',
    name: 'Niedźwiedź',
    emoji: '🐻',
    maxHp: 45,
    attack: 13,
    defense: 4,
    xpReward: 65,
    goldReward: [10, 22],
    rarity: 'Rzadki',
    rarityColor: '#b09050',
    loot: [
      { item: 'bearMeat', chance: 1.0, amount: 2 },
      { item: 'bearClaw', chance: 0.50 },
    ],
  },
  {
    id: 'troll',
    name: 'Troll',
    emoji: '👹',
    maxHp: 70,
    attack: 17,
    defense: 6,
    xpReward: 110,
    goldReward: [18, 40],
    rarity: 'Elitarny',
    rarityColor: '#a060c0',
    loot: [
      { item: 'trollBlood', chance: 1.0, amount: 1 },
      { item: 'trollHide',  chance: 0.35 },
      { item: 'trollHeart', chance: 0.08 },
    ],
  },
  {
    id: 'dragon',
    name: 'Smok Leśny',
    emoji: '🐲',
    maxHp: 110,
    attack: 24,
    defense: 10,
    xpReward: 220,
    goldReward: [40, 80],
    rarity: 'Legendarny',
    rarityColor: '#e07030',
    loot: [
      { item: 'dragonMeat',  chance: 1.0, amount: 1 },
      { item: 'dragonScale', chance: 0.12 },
    ],
  },
]

// Spawn weights (sum = 100)
const SPAWN_TABLE: Array<{ monster: MonsterDef; weight: number }> = [
  { monster: MONSTERS[0], weight: 30 },  // wolf
  { monster: MONSTERS[1], weight: 30 },  // kobold
  { monster: MONSTERS[2], weight: 20 },  // bear
  { monster: MONSTERS[3], weight: 15 },  // troll
  { monster: MONSTERS[4], weight: 5  },  // dragon
]

function rollMonster(): MonsterDef {
  const total = SPAWN_TABLE.reduce((s, e) => s + e.weight, 0)
  let r = Math.random() * total
  for (const entry of SPAWN_TABLE) {
    r -= entry.weight
    if (r <= 0) return entry.monster
  }
  return MONSTERS[0]
}

function rollLoot(monster: MonsterDef): Partial<Record<keyof Inventory, number>> {
  const result: Partial<Record<keyof Inventory, number>> = {}
  for (const drop of monster.loot) {
    if (Math.random() < drop.chance) {
      result[drop.item] = (result[drop.item] ?? 0) + (drop.amount ?? 1)
    }
  }
  return result
}

// ─── Props ────────────────────────────────────────────────────────────────────

const EXPEDITION_COST = 20

interface Props {
  characterLevel: number
  professions: Professions
  equip: EquipSlots
  inventory: Inventory
  ownedItems: ItemId[]
  energy: number
  onUpdate: (profs: Professions, inv: Inventory, items: ItemId[], energyCost?: number) => void
  onBack: () => void
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Expeditions({ characterLevel, professions, equip, inventory, ownedItems, energy, onUpdate, onBack }: Props) {
  const [monster, setMonster] = useState<MonsterDef | null>(null)

  function start() {
    if (energy < EXPEDITION_COST) return
    setMonster(rollMonster())
  }

  function endBattle(newProfs?: Professions, newInv?: Inventory, newItems?: ItemId[], spent?: number) {
    onUpdate(newProfs ?? professions, newInv ?? inventory, newItems ?? ownedItems, spent)
    setMonster(null)
  }

  if (monster) {
    return (
      <ExpeditionBattle
        monster={monster}
        characterLevel={characterLevel}
        professions={professions}
        equip={equip}
        inventory={inventory}
        ownedItems={ownedItems}
        onEnd={endBattle}
        onFlee={() => setMonster(null)}
      />
    )
  }

  const canGo = energy >= EXPEDITION_COST

  return (
    <div className="screen-enter" style={{
      position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden',
      background: 'radial-gradient(ellipse at 50% 0%, #1a0808 0%, #060304 80%)',
    }}>
      <img src="/assets/backgrounds/wyprawa.png" alt="" draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', pointerEvents: 'none', userSelect: 'none', opacity: 0.35 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.5) 100%)', pointerEvents: 'none' }} />

      <button onClick={onBack} style={{ position: 'absolute', top: 20, left: 16, zIndex: 10, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#c06050', fontFamily: 'Cinzel', fontSize: 16, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation' }}>←</button>

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, zIndex: 1 }}>
        <button
          onClick={start}
          disabled={!canGo}
          style={{
            padding: '18px 56px', borderRadius: 14,
            fontFamily: 'Cinzel', fontSize: 18, fontWeight: 700, letterSpacing: '0.06em',
            background: canGo ? 'linear-gradient(135deg, #6a1808, #c03020)' : 'rgba(30,10,10,0.7)',
            border: `1px solid ${canGo ? 'rgba(220,80,50,0.6)' : 'rgba(80,30,20,0.4)'}`,
            color: canGo ? '#f0a080' : '#603030',
            cursor: canGo ? 'pointer' : 'not-allowed', touchAction: 'manipulation',
            boxShadow: canGo ? '0 0 32px rgba(200,50,20,0.5)' : 'none',
          }}
        >
          ⚔ Wyrusz!
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'Cinzel', fontSize: 12, color: canGo ? '#806040' : '#803030' }}>
            Koszt: {EXPEDITION_COST} ⚡
          </span>
          <span style={{ fontFamily: 'Cinzel', fontSize: 12, color: canGo ? '#60a030' : '#c03020' }}>
            {energy}/100
          </span>
        </div>

        {!canGo && (
          <span style={{ fontFamily: 'Crimson Text', fontSize: 14, color: '#803020', fontStyle: 'italic' }}>
            Za mało energii. Odpocznij.
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Battle ───────────────────────────────────────────────────────────────────

const ITEM_NAME: Partial<Record<keyof Inventory, string>> = {
  wolfMeat: 'Mięso wilka', wolfHide: 'Skóra wilka',
  koboldTooth: 'Ząb kobolda', koboldEar: 'Ucho kobolda',
  bearMeat: 'Mięso niedźwiedzia', bearClaw: 'Pazur niedźwiedzia',
  trollBlood: 'Krew trolla', trollHide: 'Skóra trolla', trollHeart: 'Serce trolla',
  dragonMeat: 'Mięso smoka', dragonScale: '✨ Łuska smoka',
}
const ITEM_ICON: Partial<Record<keyof Inventory, string>> = {
  wolfMeat: '🥩', wolfHide: '🐺', koboldTooth: '🦷', koboldEar: '👂',
  bearMeat: '🥩', bearClaw: '🐾', trollBlood: '🫙', trollHide: '🛡️',
  trollHeart: '💜', dragonMeat: '🥩', dragonScale: '🐉',
}

type Phase = 'choosing' | 'victory' | 'defeat' | 'fled'
interface BattleState { goblinHp: number; monsterHp: number; log: string[]; phase: Phase }

function ExpeditionBattle({ monster, characterLevel, professions, equip, inventory, ownedItems, onEnd, onFlee }: {
  monster: MonsterDef
  characterLevel: number
  professions: Professions
  equip: EquipSlots
  inventory: Inventory
  ownedItems: ItemId[]
  onEnd: (newProfs?: Professions, newInv?: Inventory, newItems?: ItemId[], energyCost?: number) => void
  onFlee: () => void
}) {
  const goblinMaxHp = 20 + characterLevel * 5
  const weaponAtk   = equip.weapon ? ({ sword_copper: 8, club_wooden: 3 } as Record<ItemId, number>)[equip.weapon] ?? 0 : 0
  const goblinAttack = 5 + professions.warrior.level * 2 + weaponAtk
  const goblinDefense = 2

  const [lootDrops, setLootDrops] = useState<Partial<Record<keyof Inventory, number>> | null>(null)
  const [goldDrop,  setGoldDrop]  = useState(0)

  const [battle, setBattle] = useState<BattleState>({
    goblinHp: goblinMaxHp,
    monsterHp: monster.maxHp,
    log: [`${monster.emoji} Napotykasz ${monster.name}!`, `🎲 Twoja kolej.`],
    phase: 'choosing',
  })

  const logRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [battle.log])

  function monsterTurn(state: BattleState, defending: boolean): BattleState {
    const baseDmg = Math.max(1, monster.attack - goblinDefense)
    const dmg = defending ? Math.max(1, Math.ceil(baseDmg * 0.5)) : baseDmg
    const newHp = Math.max(0, state.goblinHp - dmg)
    const log = [...state.log, `🗡️ ${monster.name} zadaje ${dmg} dmg${defending ? ' (blok!)' : ''}!`]
    if (newHp <= 0) return { ...state, goblinHp: 0, log: [...log, '💀 Goblin pada...'], phase: 'defeat' }
    return { ...state, goblinHp: newHp, log, phase: 'choosing' }
  }

  function doAttack() {
    setBattle(prev => {
      if (prev.phase !== 'choosing') return prev
      const dmg = Math.max(1, goblinAttack - monster.defense)
      const newMonsterHp = Math.max(0, prev.monsterHp - dmg)
      const log = [...prev.log, `⚔️ Goblin zadaje ${dmg} dmg!`]
      if (newMonsterHp <= 0) {
        const drops = rollLoot(monster)
        const gold = monster.goldReward[0] + Math.floor(Math.random() * (monster.goldReward[1] - monster.goldReward[0] + 1))
        setLootDrops(drops)
        setGoldDrop(gold)
        return { ...prev, monsterHp: 0, log: [...log, `💀 ${monster.name} pokonany!`, `🏆 +${monster.xpReward} XP · +${gold} 💰`], phase: 'victory' }
      }
      return monsterTurn({ ...prev, monsterHp: newMonsterHp, log }, false)
    })
  }

  function doFlee() {
    setBattle(prev => {
      if (prev.phase !== 'choosing') return prev
      if (Math.random() < 0.75) {
        return { ...prev, log: [...prev.log, '🏃 Udało się uciec!'], phase: 'fled' }
      }
      return monsterTurn({ ...prev, log: [...prev.log, '❌ Ucieczka nieudana!'] }, false)
    })
  }

  function handleExit() {
    if (battle.phase !== 'victory') { onFlee(); return }
    const newProfs = addProfessionXp(professions, 'warrior', monster.xpReward, true)
    const newInv = { ...inventory, gold: inventory.gold + goldDrop }
    if (lootDrops) {
      for (const [key, amount] of Object.entries(lootDrops) as [keyof Inventory, number][]) {
        (newInv[key] as number) += amount
      }
    }
    onEnd(newProfs, newInv, ownedItems, EXPEDITION_COST)
  }

  const { goblinHp, monsterHp, phase, log } = battle
  const goblinHpPct  = Math.max(0, (goblinHp  / goblinMaxHp)   * 100)
  const monsterHpPct = Math.max(0, (monsterHp / monster.maxHp) * 100)
  const isOver = phase !== 'choosing'

  return (
    <div className="screen-enter" style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
      <img src="/assets/backgrounds/wyprawa.png" alt="" draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', userSelect: 'none', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'linear-gradient(180deg,rgba(4,2,0,0.92) 0%,transparent 100%)', padding: '16px 16px 28px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <button onClick={onFlee} style={{ background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#c06050', fontFamily: 'Cinzel', fontSize: 16, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0 }}>←</button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>{monster.emoji}</span>
            <h2 style={{ fontFamily: 'Cinzel', fontSize: 17, fontWeight: 700, color: '#f0a060', margin: 0, textShadow: '0 0 12px rgba(220,80,20,0.6)' }}>{monster.name}</h2>
            <span style={{ fontFamily: 'Cinzel', fontSize: 10, color: monster.rarityColor, background: `${monster.rarityColor}22`, borderRadius: 6, padding: '2px 6px', border: `1px solid ${monster.rarityColor}44` }}>{monster.rarity}</span>
          </div>
        </div>
      </div>

      {/* Monster */}
      <div style={{ position: 'absolute', top: '17%', right: '14%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
          <div style={{ width: 90, height: 9, background: 'rgba(0,0,0,0.7)', borderRadius: 5, overflow: 'hidden', border: '1px solid rgba(200,60,40,0.35)' }}>
            <div style={{ height: '100%', width: `${monsterHpPct}%`, background: 'linear-gradient(90deg,#7a0000,#cc2020)', borderRadius: 5, transition: 'width 0.4s' }} />
          </div>
          <span style={{ fontFamily: 'Cinzel', fontSize: 10, color: '#c06050' }}>{monsterHp}/{monster.maxHp}</span>
        </div>
        <div style={{ width: 78, height: 78, background: 'rgba(25,8,4,0.72)', border: `2px solid ${monsterHp > 0 ? 'rgba(200,60,40,0.55)' : 'rgba(60,20,10,0.4)'}`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', fontSize: 44, opacity: monsterHp <= 0 ? 0.2 : 1, transition: 'opacity 0.5s' }}>{monster.emoji}</div>
      </div>

      {/* Goblin */}
      <div style={{ position: 'absolute', top: '44%', left: '12%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 90, height: 9, background: 'rgba(0,0,0,0.7)', borderRadius: 5, overflow: 'hidden', border: '1px solid rgba(60,160,40,0.35)' }}>
            <div style={{ height: '100%', width: `${goblinHpPct}%`, background: 'linear-gradient(90deg,#1a5000,#40a020)', borderRadius: 5, transition: 'width 0.4s' }} />
          </div>
          <span style={{ fontFamily: 'Cinzel', fontSize: 10, color: '#70a050' }}>{goblinHp}/{goblinMaxHp}</span>
        </div>
        <div style={{ width: 78, height: 78, background: 'rgba(5,15,3,0.72)', border: `2px solid ${goblinHp > 0 ? 'rgba(60,160,40,0.55)' : 'rgba(20,40,10,0.4)'}`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', fontSize: 44, opacity: goblinHp <= 0 ? 0.2 : 1, transition: 'opacity 0.5s' }}>🧝</div>
      </div>

      {/* Loot drops (victory) */}
      {phase === 'victory' && lootDrops && Object.keys(lootDrops).length > 0 && (
        <div style={{ position: 'absolute', top: '68%', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 300 }}>
          {(Object.entries(lootDrops) as [keyof Inventory, number][]).map(([item, qty]) => (
            <div key={item} className="loot-pop" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(10,20,5,0.8)', border: '1px solid rgba(80,160,40,0.4)', borderRadius: 10, padding: '6px 12px', backdropFilter: 'blur(4px)' }}>
              <span style={{ fontSize: 16 }}>{ITEM_ICON[item] ?? '📦'}</span>
              <span style={{ fontFamily: 'Cinzel', fontSize: 12, color: '#90d050' }}>+{qty}</span>
              <span style={{ fontFamily: 'Crimson Text', fontSize: 13, color: '#70a040' }}>{ITEM_NAME[item] ?? item}</span>
            </div>
          ))}
        </div>
      )}

      {/* Battle log */}
      <div ref={logRef} style={{ position: 'absolute', top: '76%', left: '8%', right: '8%', maxHeight: '13%', overflowY: 'auto', background: 'rgba(0,0,0,0.55)', borderRadius: 10, padding: '8px 12px', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {log.map((line, i) => (
          <div key={i} style={{ fontFamily: 'Crimson Text', fontSize: 15, lineHeight: 1.6, color: i === log.length - 1 ? '#f0e0b0' : '#a08860', textShadow: '0 1px 6px rgba(0,0,0,1)', marginBottom: 1, fontWeight: i === log.length - 1 ? 600 : 400 }}>{line}</div>
        ))}
      </div>

      {/* Buttons */}
      <div style={{ position: 'absolute', bottom: '2%', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 14 }}>
        {!isOver ? (
          <>
            <SmallBtn label="⚔ Atak"     onClick={doAttack} />
            <SmallBtn label="🏃 Ucieczka" onClick={doFlee}   />
          </>
        ) : (
          <SmallBtn
            label={phase === 'victory' ? '🏆 Wróć do osady' : '💔 Wróć do osady'}
            onClick={handleExit}
          />
        )}
      </div>
    </div>
  )
}

function SmallBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: '8px 20px', borderRadius: 8, background: 'rgba(30,18,8,0.75)', border: '1px solid rgba(100,65,25,0.7)', cursor: 'pointer', touchAction: 'manipulation', fontFamily: 'Cinzel', fontSize: 12, fontWeight: 600, color: '#c08040', letterSpacing: '0.04em' }}>
      {label}
    </button>
  )
}
