import { useState, useEffect } from 'react'
import type { Screen, Inventory } from './types'
import { loadInventory, saveInventory, resetInventory } from './store'
import Settlement from './components/Settlement'
import Forest from './components/Forest'
import Mine from './components/Mine'
import Forge from './components/Forge'
import InventoryScreen from './components/InventoryScreen'
import DevPanel from './components/DevPanel'

export default function App() {
  const [screen, setScreen] = useState<Screen>('settlement')
  const [inventory, setInventory] = useState<Inventory>(loadInventory)

  useEffect(() => {
    saveInventory(inventory)
  }, [inventory])

  function handleUpdate(inv: Inventory) {
    setInventory(inv)
  }

  function handleReset() {
    setInventory(resetInventory())
    setScreen('settlement')
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        background: 'radial-gradient(ellipse at 50% 0%, #2a1a08 0%, #0e0b08 60%)',
        overflowX: 'hidden',
        overflowY: 'auto',
        position: 'relative',
      }}
    >
      {screen === 'settlement' && (
        <Settlement inventory={inventory} onNavigate={setScreen} />
      )}
      {screen === 'forest' && (
        <Forest inventory={inventory} onUpdate={handleUpdate} onBack={() => setScreen('settlement')} />
      )}
      {screen === 'mine' && (
        <Mine inventory={inventory} onUpdate={handleUpdate} onBack={() => setScreen('settlement')} />
      )}
      {screen === 'forge' && (
        <Forge inventory={inventory} onUpdate={handleUpdate} onBack={() => setScreen('settlement')} />
      )}
      {screen === 'inventory' && (
        <InventoryScreen inventory={inventory} onBack={() => setScreen('settlement')} />
      )}

      <DevPanel onReset={handleReset} />
    </div>
  )
}
