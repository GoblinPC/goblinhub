// ─── Pliki MP3 ────────────────────────────────────────────────────────────────

function playEffect(src: string, volume = 0.8) {
  const audio = new Audio(src)
  audio.volume = volume
  audio.play().catch(() => {})
}

export function playChopping()  { playEffect('/assets/sound/Choping.mp3',  0.8) }
export function playMining()    { playEffect('/assets/sound/Mining.mp3',    0.8) }
export function playSmithing()  { playEffect('/assets/sound/Smithing.mp3',  0.8) }

// ─── Hover preview sounds ─────────────────────────────────────────────────────
// Singleton — zatrzymuje poprzedni preview przed odegraniem nowego

let hoverAudio: HTMLAudioElement | null = null

export function playHoverPreview(type: 'forge' | 'mine' | 'forest') {
  hoverAudio?.pause()
  hoverAudio = null
  const src = {
    forge:  '/assets/sound/campfire_ambient.mp3',
    mine:   '/assets/sound/Mining.mp3',
    forest: '/assets/sound/Choping.mp3',
  }[type]
  hoverAudio = new Audio(src)
  hoverAudio.volume = 0.35
  hoverAudio.play().catch(() => {})
}

export function stopHoverPreview() {
  if (!hoverAudio) return
  const a = hoverAudio
  hoverAudio = null
  // krótki fade-out zamiast twardego stop
  const fade = setInterval(() => {
    a.volume = Math.max(0, a.volume - 0.05)
    if (a.volume <= 0) { a.pause(); clearInterval(fade) }
  }, 30)
}

// ─── Muzyka i ambience w pętli ────────────────────────────────────────────────

interface LoopTrack {
  el: HTMLAudioElement
  fadeTimer: ReturnType<typeof setInterval> | null
}

function createTrack(src: string, loop = true): LoopTrack {
  const el = new Audio(src)
  el.loop = loop
  el.volume = 0
  el.preload = 'auto'
  return { el, fadeTimer: null }
}

function fadeIn(track: LoopTrack, targetVol: number, durationMs = 1500) {
  if (track.fadeTimer) clearInterval(track.fadeTimer)
  const step = targetVol / (durationMs / 50)
  track.el.play().catch(() => {})
  track.fadeTimer = setInterval(() => {
    const next = Math.min(track.el.volume + step, targetVol)
    track.el.volume = next
    if (next >= targetVol) {
      clearInterval(track.fadeTimer!)
      track.fadeTimer = null
    }
  }, 50)
}

function fadeOut(track: LoopTrack, durationMs = 800, onDone?: () => void) {
  if (track.fadeTimer) clearInterval(track.fadeTimer)
  const startVol = track.el.volume
  const step = startVol / (durationMs / 50)
  track.fadeTimer = setInterval(() => {
    const next = Math.max(track.el.volume - step, 0)
    track.el.volume = next
    if (next <= 0) {
      clearInterval(track.fadeTimer!)
      track.fadeTimer = null
      track.el.pause()
      track.el.currentTime = 0
      onDone?.()
    }
  }, 50)
}

// Singletony ścieżek
let hubTrack: LoopTrack | null = null
let forestTrack: LoopTrack | null = null
let mineTrack: LoopTrack | null = null
let forgeTrack: LoopTrack | null = null

export function startHubMusic() {
  if (!hubTrack) hubTrack = createTrack('/assets/sound/hub_music.mp3')
  fadeIn(hubTrack, 0.45)
}
export function stopHubMusic(fast = false) {
  if (hubTrack) fadeOut(hubTrack, fast ? 300 : 800)
}

export function startForestAmbience() {
  if (!forestTrack) forestTrack = createTrack('/assets/sound/Forest_ambience.mp3')
  fadeIn(forestTrack, 0.5)
}
export function stopForestAmbience(fast = false) {
  if (forestTrack) fadeOut(forestTrack, fast ? 300 : 800)
}

export function startMineAmbience() {
  if (!mineTrack) mineTrack = createTrack('/assets/sound/Mine_ambient.mp3')
  fadeIn(mineTrack, 0.45)
}
export function stopMineAmbience(fast = false) {
  if (mineTrack) fadeOut(mineTrack, fast ? 300 : 800)
}

export function startForgeAmbience() {
  if (!forgeTrack) forgeTrack = createTrack('/assets/sound/campfire_ambient.mp3')
  fadeIn(forgeTrack, 0.4)
}
export function stopForgeAmbience(fast = false) {
  if (forgeTrack) fadeOut(forgeTrack, fast ? 300 : 800)
}
