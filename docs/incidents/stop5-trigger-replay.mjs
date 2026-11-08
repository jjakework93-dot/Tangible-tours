/**
 * Replay of the rider GPS decision verified against:
 * - Lovable project f2f122a8-b6c9-4dcc-9fbb-9a9848e53ae2
 * - commit 9b2642722bd0d5a369543b804a739c4af01ce74d
 *   src/lib/tour-triggers.ts and the onPosition caller in src/routes/gps-tours.$slug.tsx
 * - published https://tangibletours.com assets
 *   /assets/tour-triggers-BGs-ssOX.js and /assets/gps-tours._slug-D7w8Gzr9.js
 *
 * This file is an investigation harness. It is not the running app.
 */

export function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export function shouldTrigger(s, lat, lng, _heading, alreadyPlayed) {
  if (s.latitude == null || s.longitude == null) return false
  if (s.trigger_on === 'exit') return false
  if (haversineMeters(lat, lng, s.latitude, s.longitude) > s.trigger_radius_meters) return false
  if (alreadyPlayed && s.playback_mode !== 'loop') return false
  return true
}

export function lockedByOrder(stops, s, played) {
  return stops.some((o) => o.chapter_number >= s.chapter_number && played.has(o.chapter_number))
}

export function nextExpectedStop(stops, played) {
  let best = null
  for (const s of stops) if (s.chapter_number > 0 && !played.has(s.chapter_number) && (!best || s.chapter_number < best.chapter_number)) best = s
  return best
}

export function strictStops(stops, played, strict) {
  if (!strict) return stops
  const n = nextExpectedStop(stops, played)
  return n ? stops.filter((s) => s.chapter_number === n.chapter_number) : []
}

export function stopAt(stops, lat, lng, heading, played, inOrder = true, strict = false) {
  stops = strictStops(stops, played, strict)
  let best = null
  let bd = Infinity
  for (const s of stops) {
    if (inOrder && lockedByOrder(stops, s, played)) continue
    if (!shouldTrigger(s, lat, lng, heading, played.has(s.chapter_number))) continue
    if (inOrder) {
      if (!best || s.chapter_number < best.chapter_number) best = s
      continue
    }
    if (s.latitude == null || s.longitude == null) continue
    const d = haversineMeters(lat, lng, s.latitude, s.longitude) - (s.trigger_priority ?? 0) * 1e9
    if (d < bd) {
      bd = d
      best = s
    }
  }
  return best
}

export function exitStop(stops, from, to, played, inOrder = true, strict = false) {
  if (!from) return null
  stops = strictStops(stops, played, strict)
  let best = null
  for (const s of stops) {
    if (s.trigger_on !== 'exit' || s.latitude == null || s.longitude == null) continue
    if (played.has(s.chapter_number) && s.playback_mode !== 'loop') continue
    if (inOrder && lockedByOrder(stops, s, played)) continue
    const was = haversineMeters(from.lat, from.lng, s.latitude, s.longitude) <= s.trigger_radius_meters
    const now = haversineMeters(to.lat, to.lng, s.latitude, s.longitude) <= s.trigger_radius_meters
    if (was && !now && (!best || s.chapter_number < best.chapter_number)) best = s
  }
  return best
}

export function stopOnPath(stops, from, to, heading, played, inOrder = true, strict = false) {
  stops = strictStops(stops, played, strict)
  const enter = stopAt(stops, to.lat, to.lng, heading, played, inOrder)
  const leave = exitStop(stops, from, to, played, inOrder)
  const direct = enter && leave ? (leave.chapter_number < enter.chapter_number ? leave : enter) : enter ?? leave
  if (direct || !from) return direct
  const dist = haversineMeters(from.lat, from.lng, to.lat, to.lng)
  if (dist < 20 || dist > 5000) return null
  const steps = Math.ceil(dist / 15)
  for (let i = 1; i < steps; i++) {
    const t = i / steps
    const hit = stopAt(stops, from.lat + (to.lat - from.lat) * t, from.lng + (to.lng - from.lng) * t, heading, played, inOrder)
    if (hit) return hit
  }
  return null
}

/** Mirrors gpsTriggerable() plus the caller's exit filter and hardcoded inOrder=true. */
export function gpsCandidates(stops, played, { playInOrder = false, firstGpsPending = false } = {}) {
  const eligible = playInOrder ? strictStops(stops, played, true) : stops
  const gated = firstGpsPending ? [...eligible].sort((a, b) => a.chapter_number - b.chapter_number).slice(0, 1) : eligible
  return gated.filter((s) => s.trigger_on !== 'exit')
}

/**
 * One GPS fix through the published onPosition gates.
 * Map position is updated before the accuracy and owner-manual returns,
 * which is why the dot can sit inside the circle with no audio.
 */
export function decideGpsArrival(state, fix) {
  const played = state.played
  if (state.listenAll) return { action: 'ignored', reason: 'listen-all', played, insideChapter: state.insideChapter }
  if (state.ownerManual) return { action: 'ignored', reason: 'owner-manual', played, insideChapter: state.insideChapter }
  if (fix.accuracy > 150) return { action: 'ignored', reason: 'accuracy', played, insideChapter: state.insideChapter }

  const candidates = gpsCandidates(state.stops, played, state)
  const hit = stopOnPath(candidates, state.lastFix, { lat: fix.lat, lng: fix.lng }, fix.heading ?? null, played, true, state.playInOrder)
  if (!hit) return { action: 'none', reason: 'outside', played, insideChapter: null }
  if (state.insideChapter === hit.chapter_number) return { action: 'latched', reason: 'already-inside', chapter: hit.chapter_number, played, insideChapter: state.insideChapter }

  const nextPlayed = new Set(played)
  nextPlayed.add(hit.chapter_number)
  if (state.busy) return { action: 'queued', reason: 'busy', chapter: hit.chapter_number, played: nextPlayed, insideChapter: hit.chapter_number }
  return { action: 'play', reason: 'enter', chapter: hit.chapter_number, played: nextPlayed, insideChapter: hit.chapter_number }
}

export function freshRun() {
  return { played: new Set(), firstGpsPending: true, insideChapter: null, lastFix: null, playInOrder: false, ownerManual: false, listenAll: false, busy: false, stops: [] }
}

/** startEverything(): clears progress, then waits for the lowest chapter's zone. */
export function restartTour(state) {
  return { ...state, played: new Set(), firstGpsPending: true, insideChapter: null, lastFix: null, busy: false, listenAll: false }
}

/** selectGpsSpeech(): the stop-list / previous-track jump. Marks this stop and every earlier chapter played. */
export function jumpToStop(state, chapterNumber) {
  const played = new Set(state.stops.filter((s) => s.chapter_number <= chapterNumber).map((s) => s.chapter_number))
  return { ...state, played, firstGpsPending: false, insideChapter: null, lastFix: null, busy: true }
}

/** skipToNextStop(): visible only when play_in_order is true. Does not clear the fresh-run gate. */
export function skipToNext(state) {
  const next = nextExpectedStop(state.stops, state.played)
  const played = new Set(state.played)
  if (next) played.add(next.chapter_number)
  return { ...state, played, insideChapter: null }
}

export function pointFrom(stop, distanceM, bearingDeg) {
  const rad = (bearingDeg * Math.PI) / 180
  const lat = stop.latitude + (distanceM * Math.cos(rad)) / 111320
  const lng = stop.longitude + (distanceM * Math.sin(rad)) / (111320 * Math.cos((stop.latitude * Math.PI) / 180))
  return { lat, lng }
}

export const FURZE = {
  verified: { chapter_number: 5, title: 'Furze Knoll', latitude: 51.394709, longitude: -1.955052, trigger_radius_meters: 420, playback_mode: 'once', trigger_on: 'enter' },
  afterStudioSave: { chapter_number: 5, title: 'Furze Knoll', latitude: 51.395356, longitude: -1.957546, trigger_radius_meters: 320, playback_mode: 'once', trigger_on: 'enter' },
  stop4: { chapter_number: 4, title: "Horatio's Hello", latitude: 51.389878, longitude: -1.970966, trigger_radius_meters: 503, playback_mode: 'once', trigger_on: 'enter' },
  stop6: { chapter_number: 6, title: 'The Wansdyke', latitude: 51.390921, longitude: -1.91448, trigger_radius_meters: 300, playback_mode: 'once', trigger_on: 'enter' },
}

export function tourStops(furze = FURZE.verified) {
  return [1, 2, 3].map((n) => ({ chapter_number: n, title: `Stop ${n}`, latitude: 51.35 + n * 0.01, longitude: -1.99, trigger_radius_meters: 100, playback_mode: 'once', trigger_on: 'enter' }))
    .concat([FURZE.stop4, furze, FURZE.stop6, { chapter_number: 13, title: 'Farewell', latitude: 51.430148, longitude: -1.853817, trigger_radius_meters: 350, playback_mode: 'once', trigger_on: 'exit' }])
}
