import { useState, useEffect } from 'react'
import type { Screen, GameState } from './types'
import { loadState, saveState, resetState, MAX_ENERGY, ENERGY_REGEN_MS } from './store'
import Settlement from './components/Settlement'
import Forest from './components/Forest'
import Mine from './components/Mine'
import Forge from './components/Forge'
import InventoryScreen from './components/InventoryScreen'
import CharacterScreen from './components/CharacterScreen'
import StatsScreen from './components/StatsScreen'
import Expeditions from './components/Expeditions'
import Shop from './components/Shop'
import DevPanel from './components/DevPanel'

export default function App() {
  const [screen, setScreen] = useState<Screen>('settlement')
  const [state, setState] = useState<GameState>(loadState)

  useEffect(() => { saveState(state) }, [state])

  useEffect(() => {
    const t = setInterval(() => {
      setState(s => s.energy < MAX_ENERGY ? { ...s, energy: Math.min(MAX_ENERGY, s.energy + 1) } : s)
    }, ENERGY_REGEN_MS)
    return () => clearInterval(t)
  }, [])

  function handleReset() {
    setState(resetState())
    setScreen('settlement')
  }

  if (screen === 'settlement') {
    return <Settlement onNavigate={setScreen} />
  }

  return (
    <div style={{
      minHeight: '100dvh', width: '100%', maxWidth: '480px',
      margin: '0 auto',
      background: 'radial-gradient(ellipse at 50% 0%, #2a1a08 0%, #0e0b08 60%)',
      overflowX: 'hidden', overflowY: 'auto', position: 'relative',
    }}>
      {screen === 'forest' && (
        <Forest
          inventory={state.inventory}
          professions={state.professions}
          energy={state.energy}
          onUpdate={(inv, profs, energyCost = 0) => setState(s => ({ ...s, inventory: inv, professions: profs, energy: Math.max(0, s.energy - energyCost) }))}
          onBack={() => setScreen('settlement')}
        />
      )}
      {screen === 'mine' && (
        <Mine
          inventory={state.inventory}
          professions={state.professions}
          energy={state.energy}
          onUpdate={(inv, profs, energyCost = 0) => setState(s => ({ ...s, inventory: inv, professions: profs, energy: Math.max(0, s.energy - energyCost) }))}
          onBack={() => setScreen('settlement')}
        />
      )}
      {screen === 'forge' && (
        <Forge
          inventory={state.inventory}
          ownedItems={state.ownedItems}
          onUpdate={(inv, items) => setState(s => ({ ...s, inventory: inv, ownedItems: items }))}
          onBack={() => setScreen('settlement')}
        />
      )}
      {screen === 'inventory' && (
        <InventoryScreen
          inventory={state.inventory}
          ownedItems={state.ownedItems}
          equip={state.equip}
          onEquipUpdate={equip => setState(s => ({ ...s, equip }))}
          onBack={() => setScreen('settlement')}
        />
      )}
      {screen === 'stats' && (
        <StatsScreen
          professions={state.professions}
          characterXp={state.characterXp}
          characterLevel={state.characterLevel}
          onBack={() => setScreen('settlement')}
        />
      )}
      {screen === 'character' && (
        <CharacterScreen
          equip={state.equip}
          tools={state.tools}
          ownedItems={state.ownedItems}
          onUpdate={(equip, tools) => setState(s => ({ ...s, equip, tools }))}
          onBack={() => setScreen('settlement')}
        />
      )}
      {screen === 'expeditions' && (
        <Expeditions
          characterLevel={state.characterLevel}
          professions={state.professions}
          equip={state.equip}
          inventory={state.inventory}
          ownedItems={state.ownedItems}
          energy={state.energy}
          onUpdate={(profs, inv, items, energyCost = 0) => setState(s => ({ ...s, professions: profs, inventory: inv, ownedItems: items, energy: Math.max(0, s.energy - energyCost) }))}
          onBack={() => setScreen('settlement')}
        />
      )}

      {screen === 'shop' && (
        <Shop
          inventory={state.inventory}
          onUpdate={inv => setState(s => ({ ...s, inventory: inv }))}
          onBack={() => setScreen('settlement')}
        />
      )}

      <DevPanel onReset={handleReset} />
    </div>
  )
}
