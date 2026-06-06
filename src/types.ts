export interface Inventory {
  gold: number
  wood: number
  stone: number
  copperOre: number
  ironOre: number
  diamond: number
  copperBar: number
  ironBar: number
  forgeEmber: number
  herbs: number
  fish: number
  // Monster loot
  wolfMeat: number
  wolfHide: number
  koboldTooth: number
  koboldEar: number
  bearMeat: number
  bearClaw: number
  trollBlood: number
  trollHide: number
  trollHeart: number
  dragonMeat: number
  dragonScale: number
}

export type ProfessionKey = 'woodcutter' | 'miner' | 'blacksmith' | 'herbalist' | 'fisher' | 'warrior'

export interface ProfessionStats {
  xp: number
  level: number
  expeditions: number
}

export type Professions = Record<ProfessionKey, ProfessionStats>

export interface GameState {
  inventory: Inventory
  professions: Professions
  characterXp: number
  characterLevel: number
  equip: EquipSlots
  tools: ToolSlots
  ownedItems: ItemId[]
  energy: number
}

export type Screen = 'settlement' | 'forest' | 'mine' | 'forge' | 'inventory' | 'character' | 'stats' | 'expeditions' | 'shop'

// ─── Items ────────────────────────────────────────────────────────────────────

export type ItemId =
  | 'sword_copper'  | 'sword_iron'  | 'sword_diamond'
  | 'axe_copper'    | 'axe_iron'    | 'axe_diamond'
  | 'shield_copper' | 'shield_iron' | 'shield_diamond'
  | 'armor_copper'  | 'armor_iron'  | 'armor_diamond'
  | 'club_wooden'

export interface EquipSlots {
  helmet:      ItemId | null
  shoulders:   ItemId | null
  armor:       ItemId | null
  weapon:      ItemId | null
  shield:      ItemId | null
  cloak:       ItemId | null
  accessories: ItemId | null
  amulet:      ItemId | null
  boots:       ItemId | null
}

export interface ToolSlots {
  axe:        ItemId | null
  pickaxe:    ItemId | null
  fishingRod: ItemId | null
  shovel:     ItemId | null
  hammer:     ItemId | null
  misc:       ItemId | null
}
