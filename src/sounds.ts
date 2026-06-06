// ─── Efekty dźwiękowe ─────────────────────────────────────────────────────────

function playEffect(src: string, volume = 0.8) {
  const audio = new Audio(src)
  audio.volume = volume
  audio.play().catch(() => {})
}

export function playChopping()  { playEffect('/assets/sound/Choping.mp3',  0.8) }
export function playMining()    { playEffect('/assets/sound/Mining.mp3',    0.8) }
export function playSmithing()  { playEffect('/assets/sound/Smithing.mp3',  0.8) }

// ─── Hover preview ────────────────────────────────────────────────────────────

let hoverAudio: HTMLAudioElement | null = null

export function playHoverPreview(type: 'forge' | 'mine' | 'forest') {
  cutHoverPreview()
  const src = {
    forge:  '/assets/sound/Mining.mp3',
    mine:   '/assets/sound/campfire_ambient.mp3',
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
  const fade = setInterval(() => {
    a.volume = Math.max(0, a.volume - 0.05)
    if (a.volume <= 0) { a.pause(); clearInterval(fade) }
  }, 30)
}

// Natychmiastowe cięcie – używane przy starcie nowej lokacji
function cutHoverPreview() {
  if (!hoverAudio) return
  hoverAudio.pause()
  hoverAudio = null
}

// ─── Loop tracks ──────────────────────────────────────────────────────────────

interface LoopTrack {
  el: HTMLAudioElement
  fadeTimer: ReturnType<typeof setInterval> | null
}

function createTrack(src: string): LoopTrack {
  const el = new Audio(src)
  el.loop = true
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
    if (next >= targetVol) { clearInterval(track.fadeTimer!); track.fadeTimer = null }
  }, 50)
}

function fadeOut(track: LoopTrack, durationMs = 800) {
  if (track.fadeTimer) clearInterval(track.fadeTimer)
  const startVol = track.el.volume
  if (startVol <= 0) { track.el.pause(); return }
  const step = startVol / (durationMs / 50)
  track.fadeTimer = setInterval(() => {
    const next = Math.max(track.el.volume - step, 0)
    track.el.volume = next
    if (next <= 0) {
      clearInterval(track.fadeTimer!); track.fadeTimer = null
      track.el.pause(); track.el.currentTime = 0
    }
  }, 50)
}

// ─── Singletony ───────────────────────────────────────────────────────────────

let hubTrack:    LoopTrack | null = null
let forestTrack: LoopTrack | null = null
let mineTrack:   LoopTrack | null = null
let forgeTrack:  LoopTrack | null = null

// Zatrzymuje wszystkie ścieżki oprócz aktywnej – jedna muzyka na raz.
function stopAllExcept(active: LoopTrack, fast = false) {
  const dur = fast ? 300 : 800
  if (hubTrack    && hubTrack    !== active) fadeOut(hubTrack,    dur)
  if (forestTrack && forestTrack !== active) fadeOut(forestTrack, dur)
  if (mineTrack   && mineTrack   !== active) fadeOut(mineTrack,   dur)
  if (forgeTrack  && forgeTrack  !== active) fadeOut(forgeTrack,  dur)
}

export function startHubMusic() {
  if (!hubTrack) hubTrack = createTrack('/assets/sound/hub_music.mp3')
  stopAllExcept(hubTrack)
  cutHoverPreview()
  fadeIn(hubTrack, 0.45)
}
export function stopHubMusic(fast = false) {
  if (hubTrack) fadeOut(hubTrack, fast ? 300 : 800)
}

export function startForestAmbience() {
  if (!forestTrack) forestTrack = createTrack('/assets/sound/Forest_ambience.mp3')
  stopAllExcept(forestTrack)
  cutHoverPreview()
  fadeIn(forestTrack, 0.5)
}
export function stopForestAmbience(fast = false) {
  if (forestTrack) fadeOut(forestTrack, fast ? 300 : 800)
}

export function startMineAmbience() {
  if (!mineTrack) mineTrack = createTrack('/assets/sound/Mine_ambient.mp3')
  stopAllExcept(mineTrack)
  cutHoverPreview()
  fadeIn(mineTrack, 0.45)
}
export function stopMineAmbience(fast = false) {
  if (mineTrack) fadeOut(mineTrack, fast ? 300 : 800)
}

export function startForgeAmbience() {
  if (!forgeTrack) forgeTrack = createTrack('/assets/sound/campfire_ambient.mp3')
  stopAllExcept(forgeTrack)
  cutHoverPreview()
  fadeIn(forgeTrack, 0.4)
}
export function stopForgeAmbience(fast = false) {
  if (forgeTrack) fadeOut(forgeTrack, fast ? 300 : 800)
}
