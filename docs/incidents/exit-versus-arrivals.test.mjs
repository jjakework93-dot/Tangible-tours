import assert from 'node:assert/strict'
import test from 'node:test'
import { fixture } from './accuracy-proposal.mjs'
import { decidePublishedFix, freshRun, pointFrom } from './stop5-trigger-replay.mjs'

const reportedMisses = [5, 7, 8, 9, 10, 12]

function asTrigger(stop) {
  return { chapter_number: stop.n, title: stop.title, latitude: stop.lat, longitude: stop.lng, trigger_radius_meters: stop.r, playback_mode: 'once', trigger_on: stop.on }
}

const stops = fixture.stops.map(asTrigger)
const farewell = stops.find((s) => s.chapter_number === 13)
const outsideFarewell = pointFrom(farewell, farewell.trigger_radius_meters + 40, 0)

function ride() {
  return { ...freshRun(), stops, firstGpsPending: false, armedExit: new Set() }
}

function step(state, fix) {
  const result = decidePublishedFix(state, fix)
  return [{ ...state, played: result.played, insideChapter: result.insideChapter ?? null, armedExit: result.armedExit, lastFix: { lat: fix.lat, lng: fix.lng } }, result]
}

test('stop 12 is Avebury Henge and stays on the reported miss list', () => {
  const stop12 = fixture.stops.find((s) => s.n === 12)
  assert.equal(stop12.title, 'Avebury Henge')
  assert.equal(stop12.r, 60)
  assert.equal(stop12.on, 'enter')
  assert.ok(reportedMisses.includes(12))
  assert.equal(fixture.stops.find((s) => s.n === 11).title, 'The Red Lion, Avebury')
  assert.equal(fixture.stops.some((s) => /avery/i.test(s.title)), false)
})

test('a good fix arms Farewell inside the circle and plays it once the rider is clearly outside', () => {
  let state = ride()
  let result
  ;[state, result] = step(state, { lat: farewell.latitude, lng: farewell.longitude, accuracy: 12 })
  assert.notEqual(result.action, 'play')
  assert.equal(state.armedExit.has(13), true)
  ;[state, result] = step(state, { ...outsideFarewell, accuracy: 12 })
  assert.equal(result.action, 'play')
  assert.equal(result.reason, 'exit')
  assert.equal(result.chapter, 13)
})

test('the owner switch and a poor arming fix both stop the exit from firing', () => {
  let state = { ...ride(), ownerManual: true }
  let result
  ;[state, result] = step(state, { lat: farewell.latitude, lng: farewell.longitude, accuracy: 12 })
  ;[state, result] = step(state, { ...outsideFarewell, accuracy: 12 })
  assert.equal(result.reason, 'owner-manual')
  assert.equal(result.played.has(13), false)

  state = ride()
  ;[state] = step(state, { lat: farewell.latitude, lng: farewell.longitude, accuracy: 180 })
  assert.equal(state.armedExit.has(13), false)
  ;[, result] = step(state, { ...outsideFarewell, accuracy: 12 })
  assert.notEqual(result.reason, 'exit')
  assert.equal(result.played.has(13), false)
})

test('synthetic poor enters plus a good exit are possible together, and so are good enters plus that exit', () => {
  let poor = ride()
  for (const n of reportedMisses) {
    const stop = stops.find((s) => s.chapter_number === n)
    let result
    ;[poor, result] = step(poor, { lat: stop.latitude, lng: stop.longitude, accuracy: 180 })
    assert.equal(result.reason, 'accuracy')
    assert.equal(result.played.has(n), false)
  }
  let result
  poor = { ...poor, lastFix: null }
  ;[poor] = step(poor, { lat: farewell.latitude, lng: farewell.longitude, accuracy: 12 })
  ;[poor, result] = step(poor, { ...outsideFarewell, accuracy: 12 })
  assert.equal(result.reason, 'exit')
  for (const n of reportedMisses) assert.equal(poor.played.has(n), false)

  const missed = stops.find((s) => s.chapter_number === 12)
  let recovered
  ;[recovered, result] = step(ride(), { lat: missed.latitude, lng: missed.longitude, accuracy: 180 })
  ;[recovered, result] = step(recovered, { lat: missed.latitude, lng: missed.longitude, accuracy: 12 })
  assert.equal(result.reason, 'enter')
  assert.equal(result.chapter, 12)

  let good = ride()
  for (const n of reportedMisses) {
    const stop = stops.find((s) => s.chapter_number === n)
    ;[good, result] = step({ ...good, lastFix: null }, { lat: stop.latitude, lng: stop.longitude, accuracy: 12 })
    assert.equal(result.action, 'play')
    assert.equal(result.reason, 'enter')
    good = { ...good, insideChapter: null }
  }
  ;[good] = step({ ...good, lastFix: null }, { lat: farewell.latitude, lng: farewell.longitude, accuracy: 12 })
  ;[good, result] = step(good, { ...outsideFarewell, accuracy: 12 })
  assert.equal(result.reason, 'exit')
})
