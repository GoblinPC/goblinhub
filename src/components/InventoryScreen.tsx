import type { Inventory } from '../types'
import ItemRow from './ItemRow'
import ScreenHeader from './ScreenHeader'

interface Props {
  inventory: Inventory
  onBack: () => void
}

const ITEM_ORDER: (keyof Inventory)[] = ['wood', 'copperOre', 'forgeEmber', 'copperBar']

export default function InventoryScreen({ inventory, onBack }: Props) {
  const total = Object.values(inventory).reduce((a, b) => a + b, 0)

  return (
    <div className="screen-enter flex flex-col" style={{ minHeight: '100%' }}>
      <ScreenHeader icon="🎒" title="Ekwipunek" subtitle="Wszystkie twoje zasoby" onBack={onBack} />

      <div style={{ padding: '0 16px', flex: 1 }}>
        <div style={{ textAlign: 'center', padding: '16px 0 24px', fontSize: '56px', lineHeight: 1, opacity: 0.7 }}>
          🎒
        </div>

        <div className="gh-card" style={{ padding: '16px 16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {ITEM_ORDER.map(item => (
            <ItemRow key={item} item={item} amount={inventory[item]} />
          ))}
        </div>

        {total === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: 'Crimson Text', fontSize: '17px', color: '#4a3828', fontStyle: 'italic' }}>
            Ekwipunek jest pusty.<br />Idź do lasu lub kopalni!
          </div>
        )}

        {total > 0 && (
          <div style={{ textAlign: 'center', padding: '8px 0', fontFamily: 'Cinzel', fontSize: '12px', color: '#5a4030', letterSpacing: '0.05em' }}>
            ŁĄCZNIE: {total}
          </div>
        )}
      </div>
    </div>
  )
}
