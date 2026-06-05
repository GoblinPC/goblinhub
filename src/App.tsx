import { useState, useEffect } from 'react'
import type { Screen, GameState } from './types'
import { loadState, saveState, resetState } from './store'
import Settlement from './components/Settlement'
import Forest from './components/Forest'
import Mine from './components/Mine'
import Forge from './components/Forge'
import InventoryScreen from './components/InventoryScreen'
import CharacterScreen from './components/CharacterScreen'
import StatsScreen from './components/StatsScreen'
import DevPanel from './components/DevPanel'

export default function App() {
  const [screen, setScreen] = useState<Screen>('settlement')
  const [state, setState] = useState<GameState>(loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  function handleReset() {
    setState(resetState())
    setScreen('settlement')
  }

  return (
    <div style={{
      minHeight: '100dvh', width: '100%', maxWidth: '480px',
      margin: '0 auto',
      background: 'radial-gradient(ellipse at 50% 0%, #2a1a08 0%, #0e0b08 60%)',
      overflowX: 'hidden', overflowY: 'auto', position: 'relative',
    }}>
      {screen === 'settlement' && (
        <Settlement inventory={state.inventory} onNavigate={setScreen} />
      )}
      {screen === 'forest' && (
        <Forest
          inventory={state.inventory}
          professions={state.professions}
          onUpdate={(inv, profs) => setState(s => ({ ...s, inventory: inv, professions: profs }))}
          onBack={() => setScreen('settlement')}
        />
      )}
      {screen === 'mine' && (
        <Mine
          inventory={state.inventory}
          professions={state.professions}
          onUpdate={(inv, profs) => setState(s => ({ ...s, inventory: inv, professions: profs }))}
          onBack={() => setScreen('settlement')}
        />
      )}
      {screen === 'forge' && (
        <Forge
          inventory={state.inventory}
          professions={state.professions}
          ownedItems={state.ownedItems}
          onUpdate={(inv, profs, items) => setState(s => ({ ...s, inventory: inv, professions: profs, ownedItems: items ?? s.ownedItems }))}
          onBack={() => setScreen('settlement')}
        />
      )}
      {screen === 'inventory' && (
        <InventoryScreen inventory={state.inventory} onBack={() => setScreen('settlement')} />
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

      <DevPanel onReset={handleReset} />
    </div>
  )
}
