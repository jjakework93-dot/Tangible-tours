/**
 * Isolated copy of the rider queue decision.
 * `published` matches gps-tours.$slug.tsx at Lovable commit 9b264272.
 * `proposed` is the unapplied patch. Neither copy is the live player.
 */

export function session() {
  return { current: null, audio: 'idle', pendingStops: [], pendingInfo: [], played: new Set(), opening: false, exitWaiting: false, log: [] }
}

function infoBlocks(state, mode) {
  if (state.current?.kind !== 'info') return false
  if (mode === 'proposed' && state.audio === 'ended') return false
  return true
}

function busy(state, mode) {
  return state.opening || state.audio === 'playing' || infoBlocks(state, mode)
}

function startInfo(state, mode, priority) {
  const endedInfo = state.current?.kind === 'info' && state.audio === 'ended'
  if (priority && state.current?.kind === 'info' && (mode === 'published' || !endedInfo)) return false
  const point = state.pendingInfo.shift()
  if (!point) return false
  state.current = { kind: 'info', id: point.id, title: point.title }
  state.audio = 'playing'
  state.log.push(`info:${point.title}`)
  return true
}

export function finish(state, mode) {
  if (!state.current) return 'idle'
  const done = state.current
  state.log.push(`completed:${done.title}`)
  state.audio = 'ended'
  if (startInfo(state, mode, false)) return 'next-info'
  const stop = state.pendingStops.shift()
  if (stop) {
    state.current = { kind: 'story', id: stop.id, title: stop.title, n: stop.n }
    state.audio = 'playing'
    state.exitWaiting = false
    state.log.push(`release:${stop.n}`)
    return 'released-story'
  }
  if (state.exitWaiting && state.audio !== 'playing') {
    state.exitWaiting = false
    state.current = { kind: 'story', id: 'farewell', title: 'Farewell', n: 13 }
    state.audio = 'playing'
    state.log.push('farewell')
    return 'farewell'
  }
  if (mode === 'proposed' && state.current === done) state.current = null
  return 'empty'
}

export function arrive(state, mode, stop, { accuracy = 8, ownerManual = false } = {}) {
  if (ownerManual) return 'owner-off'
  if (accuracy > 150) return 'accuracy'
  if (busy(state, mode) && state.current?.id !== stop.id) {
    state.pendingStops.push(stop)
    state.played.add(stop.n)
    state.log.push(`wait:${stop.n}:${state.current?.title ?? 'opening'}`)
    return 'queued'
  }
  state.current = { kind: 'story', id: stop.id, title: stop.title, n: stop.n }
  state.audio = 'playing'
  state.played.add(stop.n)
  state.log.push(`start:${stop.n}`)
  return 'started'
}

export function beginInfo(state, mode, info) {
  state.pendingInfo.push(info)
  return startInfo(state, mode, true) ? 'started' : 'blocked'
}

export function pause(state) {
  if (state.audio === 'playing') state.audio = 'paused'
}

export function resume(state) {
  if (state.audio === 'paused') state.audio = 'playing'
}

export function failPlay(state) {
  state.audio = 'paused'
  state.log.push('play-rejected')
}

export function leaveZone(state) {
  if (state.audio === 'playing') {
    state.exitWaiting = true
    return 'queued-exit'
  }
  state.current = { kind: 'story', id: 'farewell', title: 'Farewell', n: 13 }
  state.audio = 'playing'
  state.log.push('farewell')
  return 'farewell'
}

export const stop12 = { id: 'stop-12', n: 12, title: 'Avebury Henge' }
export const aveburyInfo = { id: 'info-avebury', title: 'Rider Alert: Avebury Village' }
export const nextInfo = { id: 'info-next', title: 'Next alert' }

/** The 13:48:28 completion, then the 13:49:26 arrival, with nothing queued in between. */
export function phoneStop12(mode) {
  const state = session()
  state.current = { kind: 'info', id: aveburyInfo.id, title: aveburyInfo.title }
  state.audio = 'playing'
  const afterInfo = finish(state, mode)
  const arrival = arrive(state, mode, stop12)
  return { afterInfo, arrival, heldBehind: state.log.some((line) => line.startsWith('wait:12:')) }
}
