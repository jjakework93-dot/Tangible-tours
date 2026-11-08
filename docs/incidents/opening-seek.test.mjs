import assert from 'node:assert/strict'
import test from 'node:test'
import { recordingBounds, seekTarget } from './opening-seek.mjs'

const story = { audio_path: 'gps/story.mp3', recording_path: null, start_time: null, end_time: null }

test('a standalone story with no saved cut starts at zero', () => {
  assert.deepEqual(recordingBounds(story), { from: 0, to: null })
  assert.equal(seekTarget(0, 441, null), 0)
  assert.equal(seekTarget(0, Infinity, null), 0)
})

test('a master cut with a positive start time seeks into the file', () => {
  const cut = { audio_path: null, recording_path: 'master.wav', start_time: 12.4, end_time: 40 }
  assert.equal(recordingBounds(cut).from, 12.4)
  assert.equal(seekTarget(12.4, 180, 40), 12.4)
})

test('the tenth-of-a-second end guard does not move a zero start', () => {
  assert.equal(seekTarget(0, 30, 30), 0)
  assert.ok(Math.abs(seekTarget(29.995, 30, 30) - 29.99) < 1e-9)
})
