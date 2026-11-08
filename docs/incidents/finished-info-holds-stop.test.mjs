import assert from 'node:assert/strict'
import test from 'node:test'

/**
 * Published busy check treats any current info title as busy, and completion
 * does not clear that title when nothing is queued yet. This is the harness
 * for the 8 Nov 13:48–13:54 log. It is not a change to the rider app.
 */
function session() {
  return { current: null, audio: 'idle', pendingStops: [], played: new Set(), log: [] }
}

function publishedBusy(state) {
  return state.current?.kind === 'info' || state.audio === 'playing'
}

function completeWithNothingWaiting(state) {
  state.log.push(`Audio completed: ${state.current.title}`)
  state.audio = 'ended'
}

function reachStop(state, stop) {
  const busy = publishedBusy(state) && state.current?.title !== stop.title
  if (!busy) {
    state.current = { kind: 'story', title: stop.title, n: stop.n }
    state.audio = 'playing'
    state.played.add(stop.n)
    state.log.push(`Stop ${stop.n} — starting audio`)
    return 'started'
  }
  state.pendingStops.push(stop)
  state.played.add(stop.n)
  state.log.push(`WAITING IN QUEUE: stop ${stop.n} plays after "${state.current.title}" finishes`)
  return 'queued'
}

function exitCanStart(state) {
  return state.audio !== 'playing'
}

function startFarewell(state) {
  if (!exitCanStart(state)) return 'blocked'
  state.current = { kind: 'story', title: 'Farewell', n: 13 }
  state.audio = 'playing'
  state.log.push('Departure message 13 (Farewell) — starting audio')
  return 'started'
}

function completeFarewell(state) {
  state.log.push('Audio completed: Farewell')
  state.audio = 'ended'
  const stop = state.pendingStops.shift()
  if (!stop) return 'idle'
  state.current = { kind: 'story', title: stop.title, n: stop.n }
  state.audio = 'playing'
  state.log.push(`Leaving queue: stop ${stop.n}`)
  return 'released'
}

const aveburyInfo = { kind: 'info', title: 'Rider Alert: Avebury Village' }
const stop12 = { n: 12, title: 'Avebury Henge' }

test('the recorded order: info completion, then stop 12 waits behind that finished title, then Farewell releases it', () => {
  const state = session()
  state.current = aveburyInfo
  state.audio = 'playing'
  completeWithNothingWaiting(state)
  assert.equal(state.audio, 'ended')
  assert.equal(state.current.title, aveburyInfo.title)
  assert.equal(reachStop(state, stop12), 'queued')
  assert.equal(state.log.at(-1).includes('plays after "Rider Alert: Avebury Village"'), true)
  assert.equal(state.log.some((line) => line.includes('starting audio') && line.includes('12')), false)
  assert.equal(startFarewell(state), 'started')
  assert.equal(completeFarewell(state), 'released')
  assert.equal(state.log.at(-1), 'Leaving queue: stop 12')
})

test('clearing the finished info title, the change not yet made, would start stop 12 at the zone', () => {
  const state = session()
  state.current = aveburyInfo
  state.audio = 'playing'
  completeWithNothingWaiting(state)
  state.current = null
  assert.equal(reachStop(state, stop12), 'started')
})

test('a PLAY line without a Reached line in the same buffer does not prove an automatic arrival', () => {
  const events = ['EXIT Left red zone 11', 'PLAY Audio started: The Red Lion, Avebury']
  assert.equal(events.some((line) => line.startsWith('ENTER Reached stop 11')), false)
})
