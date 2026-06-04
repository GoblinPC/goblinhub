import type { Inventory } from './types'

const KEY = 'goblinhub_inventory'

const DEFAULT: Inventory = {
  wood: 0,
  copperOre: 0,
  copperBar: 0,
  forgeEmber: 0,
}

export function loadInventory(): Inventory {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT }
    return { ...DEFAULT, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT }
  }
}

export function saveInventory(inv: Inventory): void {
  localStorage.setItem(KEY, JSON.stringify(inv))
}

export function resetInventory(): Inventory {
  localStorage.removeItem(KEY)
  return { ...DEFAULT }
}
