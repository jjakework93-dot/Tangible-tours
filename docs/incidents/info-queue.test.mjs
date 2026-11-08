import assert from 'node:assert/strict'
import test from 'node:test'
import { applyFix, complete, initialRide, riderDrawsInfoMarker, skip } from './info-queue.mjs'

const stop7 = { id: 'stop-7', n: 7, title: 'On to Silbury Hill', lat: 51.392409, lng: -1.88084, r: 376, trigger_on: 'enter' }
const alert = { id: 'a361', title: 'Rider Alert: A361 Crossing', lat: 51.390094, lng: -1.906211, r: 50, audio: true, parking: false, walkStart: false }

test('ordinary info markers are not drawn on the rider map', () => {
  assert.equal(riderDrawsInfoMarker(alert), false)
  assert.equal(riderDrawsInfoMarker({ ...alert, parking: true }), true)
})

test('accuracy over 150 stores the dot and queues neither the alert nor stop 7', () => {
  const state = initialRide()
  const result = applyFix(state, { lat: alert.lat, lng: alert.lng, accuracy: 220 }, { alerts: [alert], stops: [stop7] })
  assert.equal(result.event, 'accuracy-rejected')
  assert.equal(state.map.accuracy, 220)
  assert.equal(state.pendingInfo.length, 0)
  assert.equal(state.played.has(7), false)
  assert.equal(state.log.includes('Info speech queued: Rider Alert: A361 Crossing'), false)
})

test('a good fix inside the alert and stop 7 queues the story behind the alert, and completion starts the story', () => {
  const state = initialRide()
  const both = { lat: stop7.lat, lng: stop7.lng, accuracy: 8 }
  const alertHere = { ...alert, lat: stop7.lat, lng: stop7.lng }
  const queued = applyFix(state, both, { alerts: [alertHere], stops: [stop7], infoPlay: 'start' })
  assert.equal(queued.event, 'story-queued')
  assert.equal(state.current.kind, 'info')
  assert.equal(state.played.has(7), true)
  assert.ok(state.log.some((line) => line.startsWith('Info speech queued')))
  assert.ok(state.log.some((line) => line.includes('WAITING IN QUEUE: stop 7')))
  const done = complete(state)
  assert.equal(done.event, 'story-after-info')
  assert.equal(state.current.n, 7)
})

test('a blocked info play leaves the info title current and holds stop 7 until skip', () => {
  const state = initialRide()
  const alertHere = { ...alert, lat: stop7.lat, lng: stop7.lng }
  const held = applyFix(state, { lat: stop7.lat, lng: stop7.lng, accuracy: 12 }, { alerts: [alertHere], stops: [stop7], infoPlay: 'blocked' })
  assert.equal(held.event, 'story-queued')
  assert.equal(state.audio, 'paused')
  assert.equal(state.current.title, alert.title)
  assert.equal(state.log.includes('Stop 7 — starting audio'), false)
  const again = applyFix(state, { lat: stop7.lat, lng: stop7.lng, accuracy: 12 }, { alerts: [alertHere], stops: [stop7] })
  assert.equal(again.event, 'none')
  assert.equal(state.pendingStops.length, 1)
  assert.equal(state.played.has(7), true)
  const released = skip(state)
  assert.equal(released.event, 'skip-to-story')
  assert.equal(released.stop, 7)
})

test('stop 7 alone, with a good fix and no alert, starts', () => {
  const state = initialRide()
  const result = applyFix(state, { lat: stop7.lat, lng: stop7.lng, accuracy: 15 }, { alerts: [], stops: [stop7] })
  assert.equal(result.event, 'story-started')
  assert.equal(state.played.has(7), true)
})
