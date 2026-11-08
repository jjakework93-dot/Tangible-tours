/** Copy of the manual-order decision in Lovable preview 64533b23. Not the player. */

export function manualStopChoice(playInOrder, played, chapter, nextExpected) {
  const kept = new Set(played)
  if (!playInOrder || chapter <= 0) {
    const jumped = new Set()
    for (let n = 1; n <= chapter; n++) jumped.add(n)
    return { action: 'jump', played: jumped }
  }
  if (kept.has(chapter)) return { action: 'replay', played: kept }
  if (nextExpected === chapter) {
    kept.add(chapter)
    return { action: 'next', played: kept }
  }
  return { action: 'blocked', played: kept }
}
