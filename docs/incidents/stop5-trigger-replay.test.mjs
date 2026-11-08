import assert from 'node:assert/strict'
import test from 'node:test'
import {
  FURZE,
  decideGpsArrival,
  freshRun,
  haversineMeters,
  jumpToStop,
  pointFrom,
  restartTour,
  skipToNext,
  tourStops,
} from './stop5-trigger-replay.mjs'

const playedThrough4 = new Set([1, 2, 3, 4])

function ride(furze, distanceM) {
  const stops = tourStops(furze)
  const at = pointFrom(furze, distanceM, 180)
  const state = { ...freshRun(), stops, played: playedThrough4, firstGpsPending: false }
  return { at, decision: decideGpsArrival(state, { ...at, accuracy: 12 }) }
}

test('stops 1-4 played, play_in_order false: 95m, 273m and 385m inside the 420m zone play stop 5', () => {
  for (const distance of [95, 124, 273, 385]) {
    const { decision } = ride(FURZE.verified, distance)
    assert.equal(decision.action, 'play', `${distance}m`)
    assert.equal(decision.chapter, 5)
  }
})

test('421m is outside the verified 420m zone and does not play', () => {
  const { decision } = ride(FURZE.verified, 421)
  assert.equal(decision.action, 'none')
})

test('once mode does not play stop 5 again while the rider stays inside', () => {
  const stops = tourStops()
  const at = pointFrom(FURZE.verified, 95, 180)
  const first = decideGpsArrival({ ...freshRun(), stops, played: playedThrough4, firstGpsPending: false }, { ...at, accuracy: 8 })
  assert.equal(first.action, 'play')
  const second = decideGpsArrival({ ...freshRun(), stops, played: first.played, firstGpsPending: false, insideChapter: first.insideChapter, lastFix: at }, { ...at, accuracy: 8 })
  assert.equal(second.action, 'none')
  const latched = decideGpsArrival({ ...freshRun(), stops, played: playedThrough4, firstGpsPending: false, insideChapter: 5 }, { ...at, accuracy: 8 })
  assert.equal(latched.action, 'latched')
  assert.equal(latched.played.has(5), false)
})

test('leaving and re-entering a once stop stays silent after it has played', () => {
  const stops = tourStops()
  const inside = pointFrom(FURZE.verified, 50, 180)
  const outside = pointFrom(FURZE.verified, 500, 180)
  const played = new Set([...playedThrough4, 5])
  const left = decideGpsArrival({ ...freshRun(), stops, played, firstGpsPending: false, insideChapter: 5 }, { ...outside, accuracy: 8 })
  assert.equal(left.action, 'none')
  const back = decideGpsArrival({ ...freshRun(), stops, played, firstGpsPending: false, insideChapter: null, lastFix: outside }, { ...inside, accuracy: 8 })
  assert.equal(back.action, 'none')
})

test('play_in_order true still plays the next stop, stop 5, and does not skip ahead to stop 6', () => {
  const stops = tourStops()
  const at = pointFrom(FURZE.verified, 100, 180)
  const decision = decideGpsArrival({ ...freshRun(), stops, played: playedThrough4, firstGpsPending: false, playInOrder: true }, { ...at, accuracy: 10 })
  assert.equal(decision.action, 'play')
  assert.equal(decision.chapter, 5)
})

test('numerical order blocks stop 5 only after a later chapter is already played', () => {
  const stops = tourStops()
  const at = pointFrom(FURZE.verified, 100, 180)
  const decision = decideGpsArrival({ ...freshRun(), stops, played: new Set([1, 2, 3, 4, 6]), firstGpsPending: false }, { ...at, accuracy: 10 })
  assert.equal(decision.action, 'none')
})

test('a fresh restart inside stop 5 waits for stop 1; jumping to stop 4 then allows stop 5', () => {
  const stops = tourStops()
  const at5 = pointFrom(FURZE.verified, 95, 180)
  const restarted = { ...restartTour({ ...freshRun(), stops }), stops }
  const blocked = decideGpsArrival(restarted, { ...at5, accuracy: 10 })
  assert.equal(blocked.action, 'none')

  const afterJump = { ...jumpToStop(restarted, 4), busy: false }
  assert.equal(afterJump.firstGpsPending, false)
  assert.equal(afterJump.played.has(4), true)
  assert.equal(afterJump.played.has(5), false)
  const played = decideGpsArrival(afterJump, { ...at5, accuracy: 10 })
  assert.equal(played.action, 'play')
  assert.equal(played.chapter, 5)
})

test('skip-to-next without clearing the fresh-run gate silences every later zone, including stop 4 and stop 5', () => {
  let state = { ...freshRun(), stops: tourStops() }
  for (let i = 0; i < 4; i++) state = skipToNext(state)
  assert.deepEqual([...state.played].sort((a, b) => a - b), [1, 2, 3, 4])
  assert.equal(state.firstGpsPending, true)
  const at4 = pointFrom(FURZE.stop4, 20, 0)
  const at5 = pointFrom(FURZE.verified, 20, 0)
  assert.equal(decideGpsArrival(state, { ...at4, accuracy: 5 }).action, 'none')
  assert.equal(decideGpsArrival(state, { ...at5, accuracy: 5 }).action, 'none')
})

test('after stop 4 has fired, the fresh-run gate is clear and stop 5 plays', () => {
  const stops = tourStops()
  const at4 = pointFrom(FURZE.stop4, 30, 0)
  const started = { ...freshRun(), stops, played: new Set([1, 2, 3]), firstGpsPending: false }
  const stop4 = decideGpsArrival(started, { ...at4, accuracy: 10 })
  assert.equal(stop4.action, 'play')
  assert.equal(stop4.chapter, 4)
  const at5 = pointFrom(FURZE.verified, 273, 180)
  const stop5 = decideGpsArrival({ ...started, played: stop4.played, firstGpsPending: false, insideChapter: null, lastFix: at4 }, { ...at5, accuracy: 10 })
  assert.equal(stop5.action, 'play')
  assert.equal(stop5.chapter, 5)
})

test('arrival during info speech queues stop 5 and keeps it for when the alert ends', () => {
  const stops = tourStops()
  const at = pointFrom(FURZE.verified, 95, 180)
  const queued = decideGpsArrival({ ...freshRun(), stops, played: playedThrough4, firstGpsPending: false, busy: true }, { ...at, accuracy: 10 })
  assert.equal(queued.action, 'queued')
  assert.equal(queued.chapter, 5)
  assert.equal(queued.played.has(5), true)
  const after = decideGpsArrival({ ...freshRun(), stops, played: queued.played, firstGpsPending: false, insideChapter: null, busy: false }, { ...at, accuracy: 10 })
  assert.equal(after.action, 'none')
})

test('accuracy over 150m updates nothing in the trigger, while 150m still plays', () => {
  const stops = tourStops()
  const at = pointFrom(FURZE.verified, 95, 180)
  const state = { ...freshRun(), stops, played: playedThrough4, firstGpsPending: false }
  assert.equal(decideGpsArrival(state, { ...at, accuracy: 151 }).reason, 'accuracy')
  assert.equal(decideGpsArrival(state, { ...at, accuracy: 150 }).action, 'play')
})

test('owner manual mode leaves the map fix unused by triggers', () => {
  const stops = tourStops()
  const at = pointFrom(FURZE.verified, 10, 0)
  const decision = decideGpsArrival({ ...freshRun(), stops, played: playedThrough4, firstGpsPending: false, ownerManual: true }, { ...at, accuracy: 5 })
  assert.equal(decision.reason, 'owner-manual')
})

test('verified Furze Knoll and stop 4 zones do not overlap, and the video distances stay inside 420m', () => {
  const gap = haversineMeters(FURZE.stop4.latitude, FURZE.stop4.longitude, FURZE.verified.latitude, FURZE.verified.longitude)
  assert.ok(gap > FURZE.stop4.trigger_radius_meters + FURZE.verified.trigger_radius_meters)
  for (const distance of [95, 124, 273, 385]) assert.ok(distance <= 420)
  assert.ok(haversineMeters(FURZE.verified.latitude, FURZE.verified.longitude, FURZE.afterStudioSave.latitude, FURZE.afterStudioSave.longitude) > 100)
})

test('a falling distance to the same centre cannot be an exit of that circle', () => {
  const samples = [124, 110, 95]
  assert.ok(samples.every((d) => d <= 420))
  for (let i = 1; i < samples.length; i++) assert.ok(samples[i] < samples[i - 1])
})

test('the post-12:11 studio geometry still plays at 95m and 273m, and is outside at 385m', () => {
  assert.equal(ride(FURZE.afterStudioSave, 95).decision.chapter, 5)
  assert.equal(ride(FURZE.afterStudioSave, 273).decision.chapter, 5)
  assert.equal(ride(FURZE.afterStudioSave, 385).decision.action, 'none')
})
