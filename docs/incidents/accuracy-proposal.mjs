/**
 * Measures two unapproved accuracy proposals against the saved route.
 * The published guard is reported accuracy > 150. It does not read speed.
 * These helpers are not a phone trial and not a live threshold change.
 */
import { readFileSync } from 'node:fs'
import { haversineMeters } from './stop5-trigger-replay.mjs'

export const fixture = JSON.parse(readFileSync(new URL('./devizes-avebury-route.json', import.meta.url)))

export const POLICIES = {
  current150: { immediate: 150, fallbackAfterMs: null, ceiling: null },
  immediate300: { immediate: 300, fallbackAfterMs: null, ceiling: null },
  /** Probe only: keep 150 for a single fix; after 20s continuously inside one zone, also accept 151–300. */
  fallback300after20s: { immediate: 150, fallbackAfterMs: 20_000, ceiling: 300 },
}

export function routeLength(route = fixture.route) {
  let total = 0
  for (let i = 1; i < route.length; i++) total += haversineMeters(route[i - 1][0], route[i - 1][1], route[i][0], route[i][1])
  return total
}

export function nearestOnRoute(lat, lng, route = fixture.route) {
  let best = Infinity
  let index = 0
  let along = 0
  let cursor = 0
  for (let i = 0; i < route.length; i++) {
    const d = haversineMeters(lat, lng, route[i][0], route[i][1])
    if (d < best) {
      best = d
      index = i
      along = cursor
    }
    if (i + 1 < route.length) cursor += haversineMeters(route[i][0], route[i][1], route[i + 1][0], route[i + 1][1])
  }
  return { index, distance: best, along }
}

/** Metres of saved route from which an error aimed at the pin could land inside the circle. */
export function routeMetresWithin(lat, lng, radius, route = fixture.route) {
  let total = 0
  for (let i = 1; i < route.length; i++) {
    const d0 = haversineMeters(lat, lng, route[i - 1][0], route[i - 1][1])
    const d1 = haversineMeters(lat, lng, route[i][0], route[i][1])
    if (d0 <= radius || d1 <= radius) total += haversineMeters(route[i - 1][0], route[i - 1][1], route[i][0], route[i][1])
  }
  return total
}

export function offsetPath(route, meters) {
  return route.map((p, i) => {
    const a = route[Math.max(0, i - 1)]
    const b = route[Math.min(route.length - 1, i + 1)]
    const north = (b[0] - a[0]) * 111320
    const east = (b[1] - a[1]) * 111320 * Math.cos((p[0] * Math.PI) / 180)
    const mag = Math.hypot(-east, north) || 1
    const dLat = ((-east / mag) * meters) / 111320
    const dLng = ((north / mag) * meters) / (111320 * Math.cos((p[0] * Math.PI) / 180))
    return [p[0] + dLat, p[1] + dLng]
  })
}

export function circleGap(a, b) {
  return haversineMeters(a.lat, a.lng, b.lat, b.lng) - a.r - b.r
}

/**
 * Reported accuracy is the only number the guard sees.
 * `insideForMs` is how long the reported point has already stayed inside this zone
 * while reported accuracy was over the immediate threshold.
 */
export function accuracyDecision(policy, reportedAccuracy, insideForMs = 0) {
  if (reportedAccuracy <= policy.immediate) return 'accept'
  if (policy.fallbackAfterMs != null && reportedAccuracy <= policy.ceiling && insideForMs >= policy.fallbackAfterMs) return 'fallback'
  return 'reject'
}

export function playable(policy, sample) {
  const gate = accuracyDecision(policy, sample.reportedAccuracy, sample.insideForMs ?? 0)
  const reportedInside = haversineMeters(sample.reported.lat, sample.reported.lng, sample.zone.lat, sample.zone.lng) <= sample.zone.r
  const trueInside = haversineMeters(sample.true.lat, sample.true.lng, sample.zone.lat, sample.zone.lng) <= sample.zone.r
  const fires = gate !== 'reject' && reportedInside
  return { gate, reportedInside, trueInside, fires, falseTrigger: fires && !trueInside, missedTrueInside: trueInside && !fires }
}
