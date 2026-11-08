import assert from 'node:assert/strict'
import test from 'node:test'
import {
  POLICIES,
  accuracyDecision,
  circleGap,
  fixture,
  nearestOnRoute,
  offsetPath,
  playable,
  routeLength,
  routeMetresWithin,
} from './accuracy-proposal.mjs'
import { haversineMeters } from './stop5-trigger-replay.mjs'

const stop7 = fixture.stops.find((s) => s.n === 7)
const stop6 = fixture.stops.find((s) => s.n === 6)
const stop4 = fixture.stops.find((s) => s.n === 4)
const stop5 = fixture.stops.find((s) => s.n === 5)
const stop8 = fixture.stops.find((s) => s.n === 8)
const stop9 = fixture.stops.find((s) => s.n === 9)
const stop2 = fixture.stops.find((s) => s.n === 2)
const stop3 = fixture.stops.find((s) => s.n === 3)
const a361 = fixture.alerts.find((a) => a.title === 'Rider Alert: A361 Crossing')
const road = fixture.alerts.find((a) => a.title === 'Rider Alert: Road Crossing')

function at(zone, distanceM) {
  const lat = zone.lat + distanceM / 111320
  return { lat, lng: zone.lng }
}

test('the saved line is the Devizes to Avebury route and stop 7 still matches the unread-changed pin', () => {
  assert.equal(fixture.route.length, 957)
  assert.ok(routeLength() > 20_000 && routeLength() < 25_000)
  assert.equal(stop7.lat, 51.392409)
  assert.equal(stop7.lng, -1.88084)
  assert.equal(stop7.r, 376)
})

test('reported accuracy is the gate; speed is not an input', () => {
  for (const speed of [0, 8.5]) {
    for (const policy of Object.values(POLICIES)) {
      const result = playable(policy, {
        reportedAccuracy: 12,
        speed,
        reported: at(stop7, 40),
        true: at(stop7, 40),
        zone: stop7,
      })
      assert.equal(result.fires, true, `${policy.immediate} speed ${speed}`)
      assert.equal(result.falseTrigger, false)
    }
  }
})

test('a point inside stop 7 with reported accuracy 220 is rejected at 150, taken at once by 300, and taken by the 20s probe only after the dwell', () => {
  const sample = { reportedAccuracy: 220, reported: at(stop7, 80), true: at(stop7, 80), zone: stop7 }
  assert.equal(playable(POLICIES.current150, sample).fires, false)
  assert.equal(playable(POLICIES.current150, sample).missedTrueInside, true)
  assert.equal(playable(POLICIES.immediate300, sample).fires, true)
  assert.equal(playable(POLICIES.fallback300after20s, { ...sample, insideForMs: 19_000 }).fires, false)
  assert.equal(playable(POLICIES.fallback300after20s, { ...sample, insideForMs: 20_000 }).gate, 'fallback')
})

test('reported accuracy 340 stays rejected by the 300 proposals', () => {
  const sample = { reportedAccuracy: 340, insideForMs: 60_000, reported: at(stop7, 20), true: at(stop7, 20), zone: stop7 }
  for (const policy of Object.values(POLICIES)) assert.equal(playable(policy, sample).fires, false)
})

test('an under-reported accuracy fires the road alert on every policy', () => {
  const sample = {
    reportedAccuracy: 40,
    reported: { lat: a361.lat, lng: a361.lng },
    true: at(a361, 250),
    zone: a361,
  }
  for (const policy of Object.values(POLICIES)) {
    const result = playable(policy, sample)
    assert.equal(result.fires, true)
    assert.equal(result.falseTrigger, true)
  }
})

test('a stable 250m-accurate report inside the 50m A361 circle false-triggers at 300 and after the 20s probe, and is rejected at 150', () => {
  const sample = {
    reportedAccuracy: 250,
    reported: { lat: a361.lat, lng: a361.lng },
    true: at(a361, 250),
    zone: a361,
  }
  assert.equal(playable(POLICIES.current150, sample).fires, false)
  assert.equal(playable(POLICIES.immediate300, sample).falseTrigger, true)
  assert.equal(playable(POLICIES.fallback300after20s, { ...sample, insideForMs: 20_000 }).falseTrigger, true)
})

test('the A361 alert contains a short piece of the saved route and sits about 600m after the Wansdyke pin', () => {
  const crossing = nearestOnRoute(a361.lat, a361.lng)
  const dyke = nearestOnRoute(stop6.lat, stop6.lng)
  assert.ok(crossing.distance < 50)
  assert.ok(crossing.distance > 40)
  assert.ok(dyke.distance < 15)
  assert.ok(Math.abs(crossing.along - dyke.along) > 500)
  assert.ok(Math.abs(crossing.along - dyke.along) < 700)
  const trulyInside = routeMetresWithin(a361.lat, a361.lng, a361.r)
  const within150 = routeMetresWithin(a361.lat, a361.lng, a361.r + 150)
  const within300 = routeMetresWithin(a361.lat, a361.lng, a361.r + 300)
  assert.ok(trulyInside > 0 && trulyInside < 120)
  assert.ok(within150 > trulyInside + 200)
  assert.ok(within300 > within150 + 200)
})

test('a 70m parallel shift makes one side miss the A361 circle while the saved line enters it', () => {
  const left = offsetPath(fixture.route, 70)
  const right = offsetPath(fixture.route, -70)
  const mins = [fixture.route, left, right].map((path) => nearestOnRoute(a361.lat, a361.lng, path).distance)
  assert.ok(mins[0] <= 50)
  assert.ok(mins.some((d) => d > 50))
  assert.ok(mins.some((d) => d <= 50))
})

test('the 10m Road Crossing circle does not contain the saved route', () => {
  const nearest = nearestOnRoute(road.lat, road.lng)
  assert.ok(nearest.distance > 10)
  assert.equal(routeMetresWithin(road.lat, road.lng, road.r), 0)
  for (const meters of [70, -70]) assert.ok(nearestOnRoute(road.lat, road.lng, offsetPath(fixture.route, meters)).distance > 10)
})

test('150m of error cannot bridge neighbouring stop circles that 300m can', () => {
  const pairs = [[stop2, stop3], [stop4, stop5], [stop8, stop9]]
  for (const [a, b] of pairs) {
    const gap = circleGap(a, b)
    assert.ok(gap > 150, `${a.n}-${b.n} ${gap}`)
    assert.ok(gap < 300, `${a.n}-${b.n} ${gap}`)
  }
  assert.ok(circleGap(stop6, stop7) > 1500)
  assert.ok(haversineMeters(a361.lat, a361.lng, stop7.lat, stop7.lng) > 1500)
})

test('stop 5 and stop 7 zones contain the saved route, so an accurate on-route fix is inside them', () => {
  for (const zone of [stop5, fixture.furzeVerified, stop7]) {
    const nearest = nearestOnRoute(zone.lat, zone.lng)
    assert.ok(nearest.distance < zone.r)
    assert.ok(routeMetresWithin(zone.lat, zone.lng, zone.r) > 400)
  }
})
