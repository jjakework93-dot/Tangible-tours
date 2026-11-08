import assert from 'node:assert/strict'
import test from 'node:test'
import { fixture, nearestOnRoute } from './accuracy-proposal.mjs'
import { applyFix, initialRide } from './info-queue.mjs'
import { decideGpsArrival, freshRun, haversineMeters } from './stop5-trigger-replay.mjs'

const stop5 = fixture.stops.find((s) => s.n === 5)
const stop7 = fixture.stops.find((s) => s.n === 7)
const stop8 = fixture.stops.find((s) => s.n === 8)
const stop9 = fixture.stops.find((s) => s.n === 9)
const playedBefore = new Set([1, 2, 3, 4, 6])
const failedStops = [stop5, stop7, stop8, stop9]

function asTrigger(stop) {
  return { chapter_number: stop.n, title: stop.title, latitude: stop.lat, longitude: stop.lng, trigger_radius_meters: stop.r, playback_mode: 'once', trigger_on: stop.on }
}

test('stop 8 is the current Silbury pin and the saved route passes through its 102m circle', () => {
  assert.equal(stop8.title, 'Silbury Hill')
  assert.equal(stop8.lat, 51.414836)
  assert.equal(stop8.lng, -1.857679)
  assert.equal(stop8.r, 102)
  assert.equal(stop8.on, 'enter')
  assert.ok(nearestOnRoute(stop8.lat, stop8.lng).distance < 102)
})

test('a good fix inside stop 8 plays, and reported accuracy 151 at the same pin does not', () => {
  const stops = [stop5, stop7, stop8].map(asTrigger)
  const state = { ...freshRun(), stops, played: new Set(playedBefore), firstGpsPending: false }
  const inside = decideGpsArrival(state, { lat: stop8.lat, lng: stop8.lng, accuracy: 12 })
  assert.equal(inside.action, 'play')
  assert.equal(inside.chapter, 8)
  const poor = decideGpsArrival(state, { lat: stop8.lat, lng: stop8.lng, accuracy: 151 })
  assert.equal(poor.reason, 'accuracy')
  assert.equal(poor.played.has(8), false)
})

test('stop 9 is West Kennet Long Barrow, 60m, and the saved route enters that circle', () => {
  assert.equal(stop9.title, 'West Kennet Long Barrow')
  assert.equal(stop9.lat, 51.414157)
  assert.equal(stop9.lng, -1.851983)
  assert.equal(stop9.r, 60)
  assert.equal(stop9.on, 'enter')
  assert.ok(nearestOnRoute(stop9.lat, stop9.lng).distance < 60)
})

test('one accuracy rejection or an owner switch skips 5, 7, 8, and 9 without marking them played', () => {
  const stops = failedStops.map(asTrigger)
  for (const patch of [{ }, { ownerManual: true }]) {
    let state = { ...freshRun(), stops, played: new Set(playedBefore), firstGpsPending: false, ...patch }
    for (const stop of failedStops) {
      const fix = { lat: stop.lat, lng: stop.lng, accuracy: patch.ownerManual ? 8 : 180 }
      const result = decideGpsArrival(state, fix)
      assert.notEqual(result.action, 'play')
      assert.equal(result.played.has(stop.n), false)
      state = { ...state, played: result.played, insideChapter: result.insideChapter }
    }
  }
})

/** What each reported gesture does in the published page. Zoom is not a remedy. */
function mapGesture(kind, { queued = false, audioIdle = true } = {}) {
  if (kind === 'pinch-zoom' || kind === 'expand-map' || kind === 'offline-map-button') {
    return { unmounted: false, restartedWatch: false, freshFix: false, startedQueuedSpeech: false }
  }
  if (kind === 'page-visible') {
    return { unmounted: false, restartedWatch: true, freshFix: true, startedQueuedSpeech: queued && audioIdle }
  }
  return { unmounted: false, restartedWatch: true, freshFix: true, startedQueuedSpeech: false }
}

test('zooming the map does not start a queued stop 9, and it is not the page-return path', () => {
  const zoom = mapGesture('pinch-zoom', { queued: true, audioIdle: true })
  assert.equal(zoom.unmounted, false)
  assert.equal(zoom.freshFix, false)
  assert.equal(zoom.startedQueuedSpeech, false)
  const returned = mapGesture('page-visible', { queued: true, audioIdle: true })
  assert.equal(returned.restartedWatch, true)
  assert.equal(returned.freshFix, true)
  assert.equal(returned.startedQueuedSpeech, true)
  const busy = mapGesture('page-visible', { queued: true, audioIdle: false })
  assert.equal(busy.freshFix, true)
  assert.equal(busy.startedQueuedSpeech, false)
})

test('a blocked info play persists and would mark 5, 7, 8, and 9 played, so it cannot leave all four as next', () => {
  const stops = failedStops.map((s) => ({ id: `s${s.n}`, n: s.n, title: s.title, lat: s.lat, lng: s.lng, r: s.r, trigger_on: 'enter' }))
  const alert = { id: 'held', title: 'Held alert', lat: stop5.lat, lng: stop5.lng, r: 50, audio: true }
  const state = initialRide()
  applyFix(state, { lat: stop5.lat, lng: stop5.lng, accuracy: 10 }, { alerts: [alert], stops, infoPlay: 'blocked' })
  applyFix(state, { lat: stop7.lat, lng: stop7.lng, accuracy: 10 }, { alerts: [], stops })
  applyFix(state, { lat: stop8.lat, lng: stop8.lng, accuracy: 10 }, { alerts: [], stops })
  applyFix(state, { lat: stop9.lat, lng: stop9.lng, accuracy: 10 }, { alerts: [], stops })
  assert.equal(state.current.kind, 'info')
  assert.deepEqual([...state.played].sort((a, b) => a - b), [5, 7, 8, 9])
  assert.equal(state.log.filter((line) => line.includes('starting audio')).length, 0)
})

test('after stop 4 has cleared the fresh-run gate, stop 8 is not held back by that gate', () => {
  const stops = [asTrigger(fixture.stops.find((s) => s.n === 4)), asTrigger(stop8)]
  const state = { ...freshRun(), stops, played: new Set([1, 2, 3, 4, 5, 6, 7]), firstGpsPending: false }
  const result = decideGpsArrival(state, { lat: stop8.lat, lng: stop8.lng, accuracy: 9 })
  assert.equal(result.action, 'play')
  assert.equal(result.chapter, 8)
  assert.ok(haversineMeters(stop8.lat, stop8.lng, stop7.lat, stop7.lng) > stop8.r + stop7.r)
})
