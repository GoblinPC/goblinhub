import { useState, useRef, useEffect } from 'react'
import type { Professions, EquipSlots, Inventory, ItemId } from '../types'
import { addProfessionXp } from '../store'

// ─── Data ─────────────────────────────────────────────────────────────────────

interface MonsterDef {
  name: string
  maxHp: number
  attack: number
  defense: number
  xpReward: number
  emoji: string
}

interface LootDrop {
  itemId: ItemId
  chance: number
}

interface ExpeditionDef {
  id: string
  name: string
  difficulty: number
  minLevel: number
  description: string
  rewards: string
  monster: MonsterDef
  goldReward: [number, number]
  itemDrops: LootDrop[]
}

interface RolledLoot {
  gold: number
  items: ItemId[]
}

function rollLoot(exp: ExpeditionDef, ownedItems: ItemId[]): RolledLoot {
  const gold = exp.goldReward[0] + Math.floor(Math.random() * (exp.goldReward[1] - exp.goldReward[0] + 1))
  const items: ItemId[] = []
  for (const drop of exp.itemDrops) {
    if (!ownedItems.includes(drop.itemId) && Math.random() < drop.chance) {
      items.push(drop.itemId)
    }
  }
  return { gold, items }
}

const EXPEDITIONS: ExpeditionDef[] = [
  {
    id: 'cave_mokk',
    name: 'Jaskinia Mokków',
    difficulty: 2,
    minLevel: 1,
    description: 'Wilgotna jaskinia pełna prymitywnych stworzeń zwanych Mokkami. Potrzeba prawdziwej broni.',
    rewards: '40 XP + złoto + loot',
    monster: {
      name: 'Mokk',
      maxHp: 25,
      attack: 6,
      defense: 3,
      xpReward: 40,
      emoji: '🧌',
    },
    goldReward: [8, 18],
    itemDrops: [
      { itemId: 'club_wooden', chance: 0.4 },
    ],
  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  characterLevel: number
  professions: Professions
  equip: EquipSlots
  inventory: Inventory
  ownedItems: ItemId[]
  onUpdate: (profs: Professions, inv: Inventory, items: ItemId[]) => void
  onBack: () => void
}

// ─── Root ─────────────────────────────────────────────────────────────────────

type View = 'list' | 'battle'

export default function Expeditions({ characterLevel, professions, equip, inventory, ownedItems, onUpdate, onBack }: Props) {
  const [view, setView] = useState<View>('list')
  const [selected, setSelected] = useState<ExpeditionDef | null>(null)

  function startBattle(exp: ExpeditionDef) {
    setSelected(exp)
    setView('battle')
  }

  function endBattle(newProfs?: Professions, newInv?: Inventory, newItems?: ItemId[]) {
    onUpdate(newProfs ?? professions, newInv ?? inventory, newItems ?? ownedItems)
    setView('list')
    setSelected(null)
  }

  if (view === 'battle' && selected) {
    return (
      <ExpeditionBattle
        expedition={selected}
        characterLevel={characterLevel}
        professions={professions}
        equip={equip}
        inventory={inventory}
        ownedItems={ownedItems}
        onEnd={endBattle}
        onBack={() => { setView('list'); setSelected(null) }}
      />
    )
  }

  return (
    <ExpeditionsList
      expeditions={EXPEDITIONS}
      characterLevel={characterLevel}
      onSelect={startBattle}
      onBack={onBack}
    />
  )
}

// ─── Lista wypraw ─────────────────────────────────────────────────────────────

function ExpeditionsList({ expeditions, characterLevel, onSelect, onBack }: {
  expeditions: ExpeditionDef[]
  characterLevel: number
  onSelect: (exp: ExpeditionDef) => void
  onBack: () => void
}) {
  return (
    <div className="screen-enter" style={{
      position: 'relative', width: '100%', height: '100dvh',
      background: 'radial-gradient(ellipse at 50% 0%, #1a0808 0%, #060304 80%)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 16px 12px', flexShrink: 0 }}>
        <button onClick={onBack} style={{
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 10, color: '#c06050', fontFamily: 'Cinzel', fontSize: 16,
          width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0,
        }}>←</button>
        <div>
          <h2 style={{ fontFamily: 'Cinzel', fontSize: 20, fontWeight: 700, color: '#e06040', margin: 0, textShadow: '0 0 14px rgba(220,60,30,0.5)' }}>⚔️ Wyprawy</h2>
          <p style={{ fontFamily: 'Crimson Text', fontSize: 12, color: '#7a4030', margin: '1px 0 0', fontStyle: 'italic' }}>Wybierz wyzwanie dla goblina</p>
        </div>
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px' }}>
        {expeditions.map(exp => {
          const canEnter = characterLevel >= exp.minLevel
          return (
            <div key={exp.id} style={{
              background: 'rgba(20,8,5,0.85)', border: `1px solid ${canEnter ? 'rgba(200,70,40,0.4)' : 'rgba(80,40,30,0.25)'}`,
              borderRadius: 16, padding: '16px', marginBottom: 14,
              backdropFilter: 'blur(6px)',
            }}>
              {/* Nagłówek karty */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h3 style={{ fontFamily: 'Cinzel', fontSize: 16, fontWeight: 700, color: '#d07050', margin: 0 }}>{exp.name}</h3>
                <div style={{ display: 'flex', gap: 2, flexShrink: 0, marginLeft: 8 }}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} style={{ fontSize: 13, color: i < exp.difficulty ? '#e09030' : '#2a1508' }}>★</span>
                  ))}
                </div>
              </div>

              <p style={{ fontFamily: 'Crimson Text', fontSize: 14, color: '#8a5040', margin: '0 0 12px', fontStyle: 'italic', lineHeight: 1.4 }}>
                {exp.description}
              </p>

              {/* Przeciwnik + nagroda */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1, background: 'rgba(30,10,5,0.6)', borderRadius: 10, padding: '8px 12px', border: '1px solid rgba(120,50,30,0.3)' }}>
                  <div style={{ fontFamily: 'Cinzel', fontSize: 9, color: '#5a2a18', letterSpacing: '0.1em', marginBottom: 4 }}>PRZECIWNIK</div>
                  <div style={{ fontFamily: 'Cinzel', fontSize: 13, color: '#c06040' }}>{exp.monster.emoji} {exp.monster.name}</div>
                  <div style={{ fontFamily: 'Crimson Text', fontSize: 11, color: '#5a3020', marginTop: 2 }}>HP: {exp.monster.maxHp} · ATK: {exp.monster.attack} · DEF: {exp.monster.defense}</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(10,20,5,0.6)', borderRadius: 10, padding: '8px 12px', border: '1px solid rgba(60,120,30,0.3)' }}>
                  <div style={{ fontFamily: 'Cinzel', fontSize: 9, color: '#2a4a18', letterSpacing: '0.1em', marginBottom: 4 }}>NAGRODA</div>
                  <div style={{ fontFamily: 'Cinzel', fontSize: 13, color: '#60a040' }}>🏆 {exp.rewards}</div>
                </div>
              </div>

              <button
                onClick={() => onSelect(exp)}
                disabled={!canEnter}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12,
                  fontFamily: 'Cinzel', fontSize: 14, fontWeight: 700, letterSpacing: '0.05em',
                  cursor: canEnter ? 'pointer' : 'not-allowed', touchAction: 'manipulation',
                  background: canEnter ? 'linear-gradient(135deg, #6a1808, #c03020)' : 'rgba(30,15,10,0.5)',
                  border: `1px solid ${canEnter ? 'rgba(220,80,50,0.6)' : 'rgba(60,30,20,0.4)'}`,
                  color: canEnter ? '#f0a080' : '#3a2015',
                  boxShadow: canEnter ? '0 0 16px rgba(200,50,20,0.3)' : 'none',
                }}
              >
                {canEnter ? `⚔️ Wyrusz na wyprawę` : `Wymaga poziomu ${exp.minLevel}`}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Walka ────────────────────────────────────────────────────────────────────

type Phase = 'choosing' | 'victory' | 'defeat' | 'fled'

interface BattleState {
  goblinHp: number
  monsterHp: number
  log: string[]
  phase: Phase
}

function ExpeditionBattle({ expedition, characterLevel, professions, equip, inventory, ownedItems, onEnd, onBack }: {
  expedition: ExpeditionDef
  characterLevel: number
  professions: Professions
  equip: EquipSlots
  inventory: Inventory
  ownedItems: ItemId[]
  onEnd: (newProfs?: Professions, newInv?: Inventory, newItems?: ItemId[]) => void
  onBack: () => void
}) {
  const monster = expedition.monster
  const goblinMaxHp = 20 + characterLevel * 5
  const weaponAtk = equip.weapon ? { sword_copper: 8, club_wooden: 3 }[equip.weapon] ?? 0 : 0
  const goblinAttack = 5 + professions.warrior.level * 2 + weaponAtk
  const goblinDefense = 2
  const [loot, setLoot] = useState<RolledLoot | null>(null)

  const [battle, setBattle] = useState<BattleState>({
    goblinHp: goblinMaxHp,
    monsterHp: monster.maxHp,
    log: [
      `⚔️ Goblin wkracza do ${expedition.name}!`,
      `🧌 Naprzeciwko staje ${monster.name}!`,
      `🎲 Twoja kolej — wybierz akcję.`,
    ],
    phase: 'choosing',
  })

  const logRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [battle.log])

  function monsterTurn(state: BattleState, wasDefending: boolean): BattleState {
    const baseDmg = Math.max(1, monster.attack - goblinDefense)
    const dmg = wasDefending ? Math.max(1, Math.ceil(baseDmg * 0.5)) : baseDmg
    const newHp = Math.max(0, state.goblinHp - dmg)
    const suffix = wasDefending ? ' (blok!)' : ''
    const log = [...state.log, `🗡️ ${monster.name} atakuje za ${dmg}${suffix}!`]
    if (newHp <= 0) {
      return { ...state, goblinHp: 0, log: [...log, '💀 Goblin pada...', '💔 Porażka!'], phase: 'defeat' }
    }
    return { ...state, goblinHp: newHp, log, phase: 'choosing' }
  }

  function doAttack() {
    setBattle(prev => {
      if (prev.phase !== 'choosing') return prev
      const dmg = Math.max(1, goblinAttack - monster.defense)
      const newMonsterHp = Math.max(0, prev.monsterHp - dmg)
      const log = [...prev.log, `⚔️ Goblin uderza za ${dmg} obrażeń!`]
      if (newMonsterHp <= 0) {
        const rolled = rollLoot(expedition, ownedItems)
        setLoot(rolled)
        const lootLines = [`💀 ${monster.name} pokonany!`, `🏆 Zwycięstwo! +${monster.xpReward} XP`, `💰 Złoto: +${rolled.gold}`, ...rolled.items.map(id => `📦 Znaleziono: ${id === 'club_wooden' ? 'Maczuga drewniana' : id}`)]
        return { ...prev, monsterHp: 0, log: [...log, ...lootLines], phase: 'victory' }
      }
      return monsterTurn({ ...prev, monsterHp: newMonsterHp, log }, false)
    })
  }

  function doFlee() {
    setBattle(prev => {
      if (prev.phase !== 'choosing') return prev
      if (Math.random() < 0.75) {
        return { ...prev, log: [...prev.log, '🏃 Goblin ucieka z walki!'], phase: 'fled' }
      }
      const log = [...prev.log, '❌ Ucieczka się nie powiodła!']
      return monsterTurn({ ...prev, log }, false)
    })
  }

  function handleVictoryExit() {
    const newProfs = addProfessionXp(professions, 'warrior', monster.xpReward, true)
    const newInv = { ...inventory, gold: inventory.gold + (loot?.gold ?? 0) }
    const newItems = [...ownedItems, ...(loot?.items ?? [])]
    onEnd(newProfs, newInv, newItems)
  }

  const { goblinHp, monsterHp, phase, log } = battle
  const goblinHpPct = Math.max(0, (goblinHp / goblinMaxHp) * 100)
  const monsterHpPct = Math.max(0, (monsterHp / monster.maxHp) * 100)
  const isOver = phase !== 'choosing'

  return (
    <div className="screen-enter" style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>

      {/* Tło */}
      <img src="/assets/backgrounds/wyprawa.png" alt="" draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', userSelect: 'none', pointerEvents: 'none' }} />

      {/* Overlay czytelności */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.18)', pointerEvents: 'none' }} />

      {/* ── Strefa 1: Nagłówek ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        background: 'linear-gradient(180deg, rgba(4,2,0,0.92) 0%, transparent 100%)',
        padding: '16px 16px 28px',
        display: 'flex', alignItems: 'flex-start', gap: 12,
      }}>
        <button onClick={onBack} style={{
          background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, color: '#c06050', fontFamily: 'Cinzel', fontSize: 16,
          width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0,
        }}>←</button>
        <div>
          <h2 style={{ fontFamily: 'Cinzel', fontSize: 17, fontWeight: 700, color: '#f0a060', margin: 0, textShadow: '0 0 12px rgba(220,80,20,0.6)' }}>{expedition.name}</h2>
          <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} style={{ fontSize: 11, color: i < expedition.difficulty ? '#e09030' : '#2a1508' }}>★</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Strefa 2: Pole walki ── */}

      {/* Potwór — prawy górny */}
      <div style={{ position: 'absolute', top: '17%', right: '22%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <div>
          <div style={{ fontFamily: 'Cinzel', fontSize: 12, color: '#e08060', textShadow: '0 1px 6px rgba(0,0,0,0.95)', textAlign: 'right', marginBottom: 4 }}>{monster.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
            <div style={{ width: 88, height: 9, background: 'rgba(0,0,0,0.7)', borderRadius: 5, overflow: 'hidden', border: '1px solid rgba(200,60,40,0.35)' }}>
              <div style={{ height: '100%', width: `${monsterHpPct}%`, background: 'linear-gradient(90deg,#7a0000,#cc2020)', borderRadius: 5, transition: 'width 0.4s' }} />
            </div>
            <span style={{ fontFamily: 'Cinzel', fontSize: 10, color: '#c06050', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{monsterHp}/{monster.maxHp}</span>
          </div>
        </div>
        <div style={{
          width: 76, height: 76,
          background: 'rgba(25,8,4,0.72)', border: `2px solid ${monsterHp > 0 ? 'rgba(200,60,40,0.55)' : 'rgba(60,20,10,0.4)'}`,
          borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)', fontSize: 42,
          boxShadow: monsterHp > 0 ? '0 0 16px rgba(200,40,20,0.35)' : 'none',
          opacity: monsterHp <= 0 ? 0.25 : 1,
          transition: 'opacity 0.5s',
        }}>{monster.emoji}</div>
      </div>

      {/* Goblin — lewy środek-dół */}
      <div style={{ position: 'absolute', top: '44%', left: '18%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
        <div>
          <div style={{ fontFamily: 'Cinzel', fontSize: 12, color: '#80c060', textShadow: '0 1px 6px rgba(0,0,0,0.95)', marginBottom: 4 }}>Goblin</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 88, height: 9, background: 'rgba(0,0,0,0.7)', borderRadius: 5, overflow: 'hidden', border: '1px solid rgba(60,160,40,0.35)' }}>
              <div style={{ height: '100%', width: `${goblinHpPct}%`, background: 'linear-gradient(90deg,#1a5000,#40a020)', borderRadius: 5, transition: 'width 0.4s' }} />
            </div>
            <span style={{ fontFamily: 'Cinzel', fontSize: 10, color: '#70a050', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{goblinHp}/{goblinMaxHp}</span>
          </div>
        </div>
        <div style={{
          width: 76, height: 76,
          background: 'rgba(5,15,3,0.72)', border: `2px solid ${goblinHp > 0 ? 'rgba(60,160,40,0.55)' : 'rgba(20,40,10,0.4)'}`,
          borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)', fontSize: 42,
          boxShadow: goblinHp > 0 ? '0 0 16px rgba(40,160,20,0.3)' : 'none',
          opacity: goblinHp <= 0 ? 0.25 : 1,
          transition: 'opacity 0.5s',
        }}>🧝</div>
      </div>

      {/* ── Strefa 3+4: Pergamin — log + przyciski ── */}
      {/* Log na pergaminie */}
      <div ref={logRef} style={{
        position: 'absolute', top: '76%', left: '10%', right: '10%',
        maxHeight: '12%', overflowY: 'auto',
      }}>
        {log.map((line, i) => (
          <div key={i} style={{
            fontFamily: 'Crimson Text', fontSize: 14, lineHeight: 1.5,
            color: i === log.length - 1 ? '#1a0a02' : '#3a2010',
            textShadow: '0 1px 3px rgba(0,0,0,0.9)',
            marginBottom: 2,
          }}>{line}</div>
        ))}
      </div>

      {/* Przyciski — sam dół pergaminu */}
      <div style={{
        position: 'absolute', bottom: '2%', left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: 14,
      }}>
        {!isOver ? (
          <>
            <SmallBtn label="⚔ Atak" onClick={doAttack} />
            <SmallBtn label="🏃 Ucieczka" onClick={doFlee} />
          </>
        ) : (
          <SmallBtn
            label={phase === 'victory' ? '🏆 Powrót do osady' : '💔 Powrót do osady'}
            onClick={phase === 'victory' ? handleVictoryExit : () => onEnd()}
          />
        )}
      </div>
    </div>
  )
}

function SmallBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 18px', borderRadius: 8,
      background: 'rgba(30,18,8,0.7)',
      border: '1px solid rgba(100,65,25,0.7)',
      cursor: 'pointer', touchAction: 'manipulation',
      fontFamily: 'Cinzel', fontSize: 12, fontWeight: 600,
      color: '#7a4a20', letterSpacing: '0.04em',
      boxShadow: 'inset 0 1px 0 rgba(200,150,80,0.08)',
    }}>
      {label}
    </button>
  )
}
