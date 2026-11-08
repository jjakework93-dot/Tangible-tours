import assert from 'node:assert/strict'
import test from 'node:test'
import {
  arrive, aveburyInfo, beginInfo, failPlay, finish, leaveZone, nextInfo, pause, phoneStop12, resume, session, stop12,
} from './queue-side-by-side.mjs'

const modes = ['published', 'proposed']

test('phone stop 12 waits behind the finished alert before the patch and starts after it', () => {
  const before = phoneStop12('published')
  const after = phoneStop12('proposed')
  assert.equal(before.afterInfo, 'empty')
  assert.equal(before.arrival, 'queued')
  assert.equal(before.heldBehind, true)
  assert.equal(after.afterInfo, 'empty')
  assert.equal(after.arrival, 'started')
  assert.equal(after.heldBehind, false)
})

test('an alert that is still playing holds the next arrival in both copies', () => {
  for (const mode of modes) {
    const state = session()
    assert.equal(beginInfo(state, mode, aveburyInfo), 'started')
    assert.equal(arrive(state, mode, stop12), 'queued')
    assert.equal(finish(state, mode), 'released-story')
    assert.equal(state.current.n, 12)
  }
})

test('a story already waiting is released when the alert ends, in both copies', () => {
  for (const mode of modes) {
    const state = session()
    state.current = { kind: 'info', id: aveburyInfo.id, title: aveburyInfo.title }
    state.audio = 'playing'
    state.pendingStops.push(stop12)
    assert.equal(finish(state, mode), 'released-story')
    assert.equal(state.log.at(-1), 'release:12')
  }
})

test('a second alert after an empty completion starts only in the proposed copy', () => {
  for (const mode of modes) {
    const state = session()
    state.current = { kind: 'info', id: aveburyInfo.id, title: aveburyInfo.title }
    state.audio = 'playing'
    finish(state, mode)
    const second = beginInfo(state, mode, nextInfo)
    assert.equal(second, mode === 'proposed' ? 'started' : 'blocked')
  }
})

test('a playing story can be replaced by an alert, and a paused alert still holds the next stop', () => {
  for (const mode of modes) {
    const state = session()
    state.current = { kind: 'story', id: 'stop-11', title: 'The Red Lion, Avebury', n: 11 }
    state.audio = 'playing'
    assert.equal(beginInfo(state, mode, aveburyInfo), 'started')
    pause(state)
    assert.equal(arrive(state, mode, stop12), 'queued')
    resume(state)
    assert.equal(state.pendingStops[0].n, 12)
    assert.equal(finish(state, mode), 'released-story')
  }
})

test('Farewell still starts when the player is idle, and waits when a story is actually playing', () => {
  for (const mode of modes) {
    const idle = session()
    idle.audio = 'ended'
    idle.current = { kind: 'info', id: aveburyInfo.id, title: aveburyInfo.title }
    if (mode === 'proposed') idle.current = null
    assert.equal(leaveZone(idle), 'farewell')
  }
  const playing = phoneStop12('proposed')
  assert.equal(playing.arrival, 'started')
  const state = session()
  state.current = { kind: 'story', id: stop12.id, title: stop12.title, n: 12 }
  state.audio = 'playing'
  assert.equal(leaveZone(state), 'queued-exit')
  assert.equal(finish(state, 'proposed'), 'farewell')
})

test('owner switch off and accuracy over 150 reject before either queue', () => {
  for (const mode of modes) {
    const state = session()
    assert.equal(arrive(state, mode, stop12, { ownerManual: true }), 'owner-off')
    assert.equal(arrive(state, mode, stop12, { accuracy: 180 }), 'accuracy')
    assert.equal(state.played.has(12), false)
  }
})

test('a rejected info play still holds the next stop, and an error completion releases a waiting stop', () => {
  for (const mode of modes) {
    const held = session()
    held.current = { kind: 'info', id: aveburyInfo.id, title: aveburyInfo.title }
    held.audio = 'playing'
    failPlay(held)
    assert.equal(arrive(held, mode, stop12), 'queued')
    const errored = session()
    errored.current = { kind: 'info', id: aveburyInfo.id, title: aveburyInfo.title }
    errored.audio = 'playing'
    errored.pendingStops.push(stop12)
    assert.equal(finish(errored, mode), 'released-story')
  }
})
