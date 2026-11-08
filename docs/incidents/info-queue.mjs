/**
 * Info-speech queue as published in gps-tours.$slug onPosition / playQueuedAnnouncement.
 * Ordinary info pins are omitted on the rider map. Audio for info and stories
 * shares the accuracy return that happens after the dot is stored.
 */

export function riderDrawsInfoMarker(info) {
  return !!(info.parking || info.walkStart)
}

export function initialRide() {
  return {
    played: new Set(),
    insideChapter: null,
    pendingInfo: [],
    pendingStops: [],
    heardInfo: new Set(),
    current: null,
    audio: 'idle',
    log: [],
  }
}

function pushLog(state, line) {
  state.log.push(line)
}

/**
 * One published GPS fix.
 * `infoPlay` is `start` when the alert recording is allowed to begin,
 * `blocked` when play() rejects, and is ignored when no alert is ready.
 */
export function applyFix(state, fix, { alerts = [], stops = [], infoPlay = 'start' } = {}) {
  state.map = { lat: fix.lat, lng: fix.lng, accuracy: fix.accuracy }
  if (fix.accuracy > 150) {
    pushLog(state, 'GPS fix too inaccurate — skipped')
    return { event: 'accuracy-rejected' }
  }
  for (const alert of alerts) {
    if (!alert.audio || state.heardInfo.has(alert.id)) continue
    const inside = distance(fix, alert) <= alert.r
    if (!inside) continue
    state.heardInfo.add(alert.id)
    state.pendingInfo.push(alert)
    pushLog(state, `Info speech queued: ${alert.title}`)
  }
  const startedInfo = startInfo(state, infoPlay)
  const stop = stops.find((s) => s.trigger_on !== 'exit' && !state.played.has(s.n) && distance(fix, s) <= s.r)
  if (!stop) return { event: startedInfo ? 'info-started' : 'none' }
  if (state.insideChapter === stop.n) return { event: 'latched', stop: stop.n }
  state.insideChapter = stop.n
  state.played.add(stop.n)
  pushLog(state, `Reached stop ${stop.n}`)
  const busy = state.current?.kind === 'info' || state.audio === 'playing'
  if (busy && state.current?.id !== stop.id) {
    state.pendingStops.push(stop)
    pushLog(state, `WAITING IN QUEUE: stop ${stop.n}`)
    return { event: 'story-queued', stop: stop.n }
  }
  state.current = { kind: 'story', id: stop.id, n: stop.n, title: stop.title }
  state.audio = 'playing'
  pushLog(state, `Stop ${stop.n} — starting audio`)
  return { event: 'story-started', stop: stop.n }
}

function startInfo(state, infoPlay) {
  if (state.current?.kind === 'info') return false
  const point = state.pendingInfo.shift()
  if (!point) return false
  state.current = { kind: 'info', id: `info-${point.id}`, title: point.title }
  if (infoPlay === 'blocked') {
    state.audio = 'paused'
    pushLog(state, `Info recording blocked: ${point.title}`)
    return true
  }
  state.audio = 'playing'
  pushLog(state, `Audio started: info point: ${point.title}`)
  return true
}

/** Published skip clears the current clip, then plays a queued alert or a queued story. */
export function skip(state) {
  state.current = null
  state.audio = 'idle'
  if (startInfo(state, 'start')) return { event: 'skip-to-info' }
  const stop = state.pendingStops.shift()
  if (!stop) return { event: 'skip-idle' }
  state.current = { kind: 'story', id: stop.id, n: stop.n, title: stop.title }
  state.audio = 'playing'
  pushLog(state, `Leaving queue: stop ${stop.n}`)
  return { event: 'skip-to-story', stop: stop.n }
}

/** ended / error completion. A rejected play() does not call this. */
export function complete(state) {
  const done = state.current
  state.current = null
  state.audio = 'idle'
  if (startInfo(state, 'start')) return { event: 'next-info', done }
  const stop = state.pendingStops.shift()
  if (!stop) return { event: 'idle', done }
  state.current = { kind: 'story', id: stop.id, n: stop.n, title: stop.title }
  state.audio = 'playing'
  pushLog(state, `Leaving queue: stop ${stop.n}`)
  return { event: 'story-after-info', stop: stop.n }
}

function distance(fix, zone) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(zone.lat - fix.lat)
  const dLng = toRad(zone.lng - fix.lng)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(fix.lat)) * Math.cos(toRad(zone.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}
