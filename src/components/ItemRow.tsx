import type { Inventory } from '../types'

export const ITEM_LABELS: Record<keyof Inventory, string> = {
  wood: 'Drewno',
  copperOre: 'Ruda miedzi',
  copperBar: 'Sztabka miedzi',
  forgeEmber: 'Żar Kuźni',
  herbs: 'Zioła',
  fish: 'Ryby',
}

export const ITEM_COLORS: Record<keyof Inventory, string> = {
  wood: '#a07840',
  copperOre: '#c07850',
  copperBar: '#e09050',
  forgeEmber: '#f06020',
  herbs: '#60a840',
  fish: '#4090c0',
}

export const ITEM_ICONS: Record<keyof Inventory, string> = {
  wood: '🪵',
  copperOre: '🪨',
  copperBar: '🔶',
  forgeEmber: '🔥',
  herbs: '🌿',
  fish: '🐟',
}

interface Props {
  item: keyof Inventory
  amount: number
}

export default function ItemRow({ item, amount }: Props) {
  const color = ITEM_COLORS[item]
  return (
    <div className="item-badge flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span style={{ fontSize: '22px', lineHeight: 1 }}>{ITEM_ICONS[item]}</span>
        <span style={{ color: '#d4a870', fontSize: '17px', fontFamily: 'Crimson Text', fontWeight: 600 }}>
          {ITEM_LABELS[item]}
        </span>
      </div>
      <span style={{ color, fontFamily: 'Cinzel', fontWeight: 700, fontSize: '20px', minWidth: '2ch', textAlign: 'right' }}>
        {amount}
      </span>
    </div>
  )
}
