import { useState } from 'react'
import type { Inventory, DiceResult } from '../types'
import DiceRoll from './DiceRoll'
import ScreenHeader from './ScreenHeader'

function rollMine(): DiceResult {
  const roll = Math.floor(Math.random() * 20) + 1
  let loot: DiceResult['loot'] = null
  if (roll >= 16 && roll <= 19) loot = { item: 'copperOre', amount: 2 }
  else if (roll === 20) loot = { item: 'copperOre', amount: 3 }
  else if (roll >= 6) loot = { item: 'copperOre', amount: 1 }
  return { roll, loot }
}

interface Props {
  inventory: Inventory
  onUpdate: (inv: Inventory) => void
  onBack: () => void
}

export default function Mine({ inventory, onUpdate, onBack }: Props) {
  const [result, setResult] = useState<DiceResult | null>(null)
  const [rolling, setRolling] = useState(false)

  function handleMine() {
    if (rolling) return
    setRolling(true)
    const r = rollMine()
    setResult(r)
  }

  function handleDone() {
    if (result?.loot) {
      onUpdate({ ...inventory, copperOre: inventory.copperOre + result.loot.amount })
    }
    setRolling(false)
  }

  return (
    <div className="screen-enter flex flex-col" style={{ minHeight: '100%' }}>
      <ScreenHeader icon="⛏️" title="Kopalnia" subtitle="Głębiny pełne rud i kryształów" onBack={onBack} />

      <div style={{ padding: '0 16px', flex: 1 }}>
        {/* Ambient */}
        <div style={{ textAlign: 'center', padding: '16px 0 24px', fontSize: '64px', lineHeight: 1, opacity: 0.8 }}>
          ⛏️🪨💎
        </div>

        {/* Dice area */}
        <div className="gh-card" style={{ padding: '24px 20px', marginBottom: '16px', minHeight: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {result ? (
            <DiceRoll result={result} onDone={handleDone} />
          ) : (
            <div style={{ textAlign: 'center', color: '#5a4430', fontFamily: 'Crimson Text', fontSize: '17px', fontStyle: 'italic' }}>
              Kliknij przycisk, by uderzyć kilofem
            </div>
          )}
        </div>

        {/* Inventory quick view */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px 20px' }}>
          <span style={{ fontFamily: 'Crimson Text', color: '#6a5040', fontSize: '15px' }}>🪨 Ruda w ekwipunku:</span>
          <span style={{ fontFamily: 'Cinzel', color: '#c07850', fontWeight: 700, fontSize: '18px' }}>{inventory.copperOre}</span>
        </div>

        {/* Action button */}
        <button
          className="btn-primary"
          onClick={handleMine}
          disabled={rolling}
        >
          {rolling ? 'Kopiesz...' : 'Kop rudę miedzi'}
        </button>

        <div style={{ padding: '12px 4px', fontFamily: 'Crimson Text', fontSize: '13px', color: '#4a3828', fontStyle: 'italic', textAlign: 'center' }}>
          Rzut k20 · 1–5 nic · 6–15 Ruda ×1 · 16–19 ×2 · 20 ×3
        </div>
      </div>
    </div>
  )
}
