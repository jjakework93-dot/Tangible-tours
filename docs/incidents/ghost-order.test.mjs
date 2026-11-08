import assert from 'node:assert/strict'
import test from 'node:test'
import { manualStopChoice } from './ghost-order.mjs'

test('an in-order tour plays the next stop, replays a finished one, and blocks a later one', () => {
  const played = new Set([1])
  const next = manualStopChoice(true, played, 2, 2)
  assert.equal(next.action, 'next')
  assert.deepEqual([...next.played], [1, 2])
  const replay = manualStopChoice(true, new Set([1, 2, 3]), 1, 4)
  assert.equal(replay.action, 'replay')
  assert.deepEqual([...replay.played], [1, 2, 3])
  const blocked = manualStopChoice(true, new Set([1]), 4, 2)
  assert.equal(blocked.action, 'blocked')
  assert.deepEqual([...blocked.played], [1])
})

test('a tour that is not in order can still jump ahead', () => {
  const jumped = manualStopChoice(false, new Set([1]), 4, 2)
  assert.equal(jumped.action, 'jump')
  assert.deepEqual([...jumped.played], [1, 2, 3, 4])
})
