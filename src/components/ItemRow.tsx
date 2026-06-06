import type { Inventory } from '../types'

export const ITEM_LABELS: Record<keyof Inventory, string> = {
  gold: 'Złoto',
  wood: 'Drewno',
  stone: 'Kamień',
  copperOre: 'Ruda miedzi',
  ironOre: 'Ruda żelaza',
  diamond: 'Diament',
  copperBar: 'Sztabka miedzi',
  ironBar: 'Sztabka żelaza',
  forgeEmber: 'Żar Kuźni',
  herbs: 'Zioła',
  fish: 'Ryby',
  wolfMeat: 'Mięso wilka',
  wolfHide: 'Skóra wilka',
  koboldTooth: 'Ząb kobolda',
  koboldEar: 'Ucho kobolda',
  bearMeat: 'Mięso niedźwiedzia',
  bearClaw: 'Pazur niedźwiedzia',
  trollBlood: 'Krew trolla',
  trollHide: 'Skóra trolla',
  trollHeart: 'Serce trolla',
  dragonMeat: 'Mięso smoka',
  dragonScale: 'Łuska smoka',
}

export const ITEM_COLORS: Record<keyof Inventory, string> = {
  gold: '#e0b030',
  wood: '#a07840',
  stone: '#a09080',
  copperOre: '#c07850',
  ironOre: '#8090a0',
  diamond: '#80e0f8',
  copperBar: '#e09050',
  ironBar: '#9090b0',
  forgeEmber: '#f06020',
  herbs: '#60a840',
  fish: '#4090c0',
  wolfMeat: '#c06840',
  wolfHide: '#a07850',
  koboldTooth: '#b0a860',
  koboldEar: '#988060',
  bearMeat: '#b05030',
  bearClaw: '#c09060',
  trollBlood: '#805080',
  trollHide: '#607050',
  trollHeart: '#a03050',
  dragonMeat: '#c04830',
  dragonScale: '#50c080',
}

export const ITEM_ICONS: Record<keyof Inventory, string> = {
  gold: '💰',
  wood: '🪵',
  stone: '🪨',
  copperOre: '🔶',
  ironOre: '⚙️',
  diamond: '💎',
  copperBar: '🟠',
  ironBar: '⚙️',
  forgeEmber: '🔥',
  herbs: '🌿',
  fish: '🐟',
  wolfMeat: '🥩',
  wolfHide: '🐺',
  koboldTooth: '🦷',
  koboldEar: '👂',
  bearMeat: '🥩',
  bearClaw: '🐾',
  trollBlood: '🫙',
  trollHide: '🛡️',
  trollHeart: '💜',
  dragonMeat: '🥩',
  dragonScale: '🐉',
}

// Sell value per unit (0 = not sellable)
export const ITEM_VALUES: Record<keyof Inventory, number> = {
  gold: 0,
  wood: 2,
  stone: 1,
  copperOre: 8,
  ironOre: 15,
  diamond: 100,
  copperBar: 20,
  ironBar: 40,
  forgeEmber: 5,
  herbs: 12,
  fish: 5,
  wolfMeat: 6,
  wolfHide: 18,
  koboldTooth: 5,
  koboldEar: 8,
  bearMeat: 10,
  bearClaw: 28,
  trollBlood: 12,
  trollHide: 45,
  trollHeart: 80,
  dragonMeat: 25,
  dragonScale: 200,
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
