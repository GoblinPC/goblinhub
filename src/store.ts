import type { Inventory, Professions, ProfessionKey, ProfessionStats, GameState, EquipSlots, ToolSlots } from './types'

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_INVENTORY: Inventory = {
  gold: 0,
  wood: 0,
  copperOre: 0,
  copperBar: 0,
  forgeEmber: 0,
  herbs: 0,
  fish: 0,
}

const DEFAULT_EQUIP: EquipSlots = {
  helmet: null, shoulders: null, armor: null, weapon: null,
  shield: null, cloak: null, accessories: null, amulet: null, boots: null,
}

const DEFAULT_TOOLS: ToolSlots = {
  axe: null, pickaxe: null, fishingRod: null, shovel: null, hammer: null, misc: null,
}

const PROFESSION_KEYS: ProfessionKey[] = ['woodcutter', 'miner', 'blacksmith', 'herbalist', 'fisher', 'warrior']

const defaultProf = (): ProfessionStats => ({ xp: 0, level: 1, expeditions: 0 })

const DEFAULT_PROFESSIONS = (): Professions =>
  Object.fromEntries(PROFESSION_KEYS.map(k => [k, defaultProf()])) as Professions

// ─── XP / Level helpers ───────────────────────────────────────────────────────

// XP potrzebne do wejścia na dany poziom od zera: level * 100
// lvl1→0xp, lvl2→100xp, lvl3→300xp, lvl4→600xp...
export function xpForLevel(level: number): number {
  return ((level - 1) * level) / 2 * 100
}

export function xpToNextLevel(level: number): number {
  return level * 100
}

export function xpProgress(xp: number, level: number): number {
  const base = xpForLevel(level)
  const needed = xpToNextLevel(level)
  return Math.min((xp - base) / needed, 1)
}

// Oblicza poziom na podstawie łącznego XP
function calcLevel(xp: number): number {
  let level = 1
  while (xp >= xpForLevel(level + 1)) level++
  return level
}

// ─── Expedition duration ──────────────────────────────────────────────────────

// base 5s + 0.5s co 10 wypraw danej profesji - 0.4s za każdy poziom, min 3s
export function expeditionMs(prof: ProfessionStats): number {
  const base = 5000
  const penalty = Math.floor(prof.expeditions / 10) * 500
  const bonus = (prof.level - 1) * 400
  return Math.max(base + penalty - bonus, 3000)
}

// ─── Add XP ───────────────────────────────────────────────────────────────────

export function addProfessionXp(
  professions: Professions,
  key: ProfessionKey,
  xp: number,
  incrementExpedition = false,
): Professions {
  const prev = professions[key]
  const newXp = prev.xp + xp
  const newLevel = calcLevel(newXp)
  return {
    ...professions,
    [key]: {
      xp: newXp,
      level: newLevel,
      expeditions: incrementExpedition ? prev.expeditions + 1 : prev.expeditions,
    },
  }
}

export function calcCharacterLevel(professions: Professions): { xp: number; level: number } {
  const totalXp = Object.values(professions).reduce((sum, p) => sum + p.xp, 0)
  return { xp: totalXp, level: calcLevel(totalXp) }
}

// ─── Persist ──────────────────────────────────────────────────────────────────

const KEY = 'goblinhub_v2'

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return makeDefault()
    const parsed = JSON.parse(raw)
    // Merge defaults so new fields always exist
    const professions = { ...DEFAULT_PROFESSIONS() }
    for (const k of PROFESSION_KEYS) {
      if (parsed.professions?.[k]) professions[k] = { ...defaultProf(), ...parsed.professions[k] }
    }
    const rawInv = { ...DEFAULT_INVENTORY, ...(parsed.inventory ?? {}) }
    const inventory = Object.fromEntries(
      Object.keys(DEFAULT_INVENTORY).map(k => [k, Number(rawInv[k as keyof Inventory]) || 0])
    ) as unknown as Inventory
    const equip = { ...DEFAULT_EQUIP, ...(parsed.equip ?? {}) }
    const tools = { ...DEFAULT_TOOLS, ...(parsed.tools ?? {}) }
    const ownedItems = parsed.ownedItems ?? []
    const { xp, level } = calcCharacterLevel(professions)
    return { inventory, professions, characterXp: xp, characterLevel: level, equip, tools, ownedItems }
  } catch {
    return makeDefault()
  }
}

export function saveState(state: GameState): void {
  localStorage.setItem(KEY, JSON.stringify({
    inventory: state.inventory,
    professions: state.professions,
    equip: state.equip,
    tools: state.tools,
    ownedItems: state.ownedItems,
  }))
}

export function makeDefault(): GameState {
  const professions = DEFAULT_PROFESSIONS()
  return {
    inventory: { ...DEFAULT_INVENTORY },
    professions,
    characterXp: 0,
    characterLevel: 1,
    equip: { ...DEFAULT_EQUIP },
    tools: { ...DEFAULT_TOOLS },
    ownedItems: [],
  }
}

export function resetState(): GameState {
  localStorage.removeItem(KEY)
  return makeDefault()
}

