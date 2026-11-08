/** Published recordingBounds and seekTourRecording, copied for the opening-clip question. */

export function recordingBounds(stop) {
  const standalone = !!stop.audio_path && !stop.recording_path
  return { from: standalone ? 0 : stop.start_time ?? 0, to: standalone ? null : stop.end_time }
}

export function seekTarget(from, duration, to) {
  const known = Number.isFinite(duration) && duration > 0 ? duration : Infinity
  const upper = Math.min(known, to ?? Infinity)
  return Math.max(0, Math.min(from, Number.isFinite(upper) ? Math.max(0, upper - 0.01) : from))
}
