import { describe, it, expect } from 'vitest'
import { computeNextReview, initSrsState, isDue } from '../utils/srs'

describe('computeNextReview', () => {
  const now = 1700000000000

  it('rating Again (0) resets interval and increments lapses', () => {
    const prev = { interval: 7, ease: 2.5, due: now, reps: 3, lapses: 0 }
    const next = computeNextReview(prev, 0, now)
    expect(next.interval).toBeLessThan(1)
    expect(next.lapses).toBe(1)
    expect(next.reps).toBe(0)
    expect(next.due).toBeGreaterThan(now)
  })

  it('rating Good (2) on first review sets interval to 1 day', () => {
    const prev = initSrsState()
    const next = computeNextReview(prev, 2, now)
    expect(next.interval).toBe(1)
    expect(next.reps).toBe(1)
    expect(next.lapses).toBe(0)
  })

  it('rating Good (2) on second review sets interval to 3 days', () => {
    const prev = { interval: 1, ease: 2.5, due: now, reps: 1, lapses: 0 }
    const next = computeNextReview(prev, 2, now)
    expect(next.interval).toBe(3)
    expect(next.reps).toBe(2)
  })

  it('rating Good (2) on third+ review multiplies interval by ease', () => {
    const prev = { interval: 3, ease: 2.5, due: now, reps: 2, lapses: 0 }
    const next = computeNextReview(prev, 2, now)
    expect(next.interval).toBe(8) // Math.round(3 * 2.5) = 8
  })

  it('rating Easy (3) increases ease factor', () => {
    const prev = { interval: 7, ease: 2.5, due: now, reps: 3, lapses: 0 }
    const next = computeNextReview(prev, 3, now)
    expect(next.ease).toBeGreaterThan(2.5)
    expect(next.reps).toBe(4)
  })

  it('ease never drops below 1.3', () => {
    const prev = { interval: 1, ease: 1.3, due: now, reps: 2, lapses: 0 }
    const next = computeNextReview(prev, 1, now)
    expect(next.ease).toBeGreaterThanOrEqual(1.3)
  })
})

describe('isDue', () => {
  it('returns true when due is in the past', () => {
    expect(isDue(1000, 2000)).toBe(true)
  })

  it('returns false when due is in the future', () => {
    expect(isDue(3000, 2000)).toBe(false)
  })
})
