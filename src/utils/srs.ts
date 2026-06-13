export type Rating = 0 | 1 | 2 | 3 // Again | Hard | Good | Easy

export interface SrsState {
  interval: number   // days
  ease: number       // ease factor
  due: number        // timestamp ms
  reps: number       // successful review count
  lapses: number     // times forgotten
}

export function computeNextReview(prev: SrsState, rating: Rating, now: number = Date.now()): SrsState {
  let interval: number
  let ease = prev.ease
  let reps = prev.reps
  let lapses = prev.lapses

  if (rating === 0) {
    interval = 1 / 1440 // ~1 minute in days (same-session retry)
    lapses += 1
    reps = 0
  } else {
    if (reps === 0) {
      interval = 1      // 1 day
    } else if (reps === 1) {
      interval = 3      // 3 days
    } else {
      interval = Math.round(prev.interval * ease)
    }

    ease = ease + (0.1 - (2 - rating) * (0.08 + (2 - rating) * 0.02))
    if (ease < 1.3) ease = 1.3
    reps += 1
  }

  const due = now + interval * 86400000

  return { interval, ease, due, reps, lapses }
}

export function initSrsState(): SrsState {
  return {
    interval: 0,
    ease: 2.5,
    due: Date.now(),
    reps: 0,
    lapses: 0,
  }
}

export function isDue(srsDue: number, now: number = Date.now()): boolean {
  return srsDue <= now
}

export function getDueWords<T extends { srsDue: number }>(words: T[], now: number = Date.now()): T[] {
  return words.filter(w => isDue(w.srsDue, now))
}
