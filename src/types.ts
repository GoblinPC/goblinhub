export interface Inventory {
  gold: number
  wood: number
  copperOre: number
  copperBar: number
  forgeEmber: number
  herbs: number
  fish: number
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
}

export type Screen = 'settlement' | 'forest' | 'mine' | 'forge' | 'inventory' | 'character' | 'stats' | 'expeditions'

// ─── Items ────────────────────────────────────────────────────────────────────

export type ItemId = 'sword_copper' | 'club_wooden'

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
