import { describe, expect, it } from 'vitest'
import { withRetries } from '../src/utils/retry.js'

describe('withRetries', () => {
  it('retries a failing operation until it succeeds', async () => {
    let attempts = 0

    const result = await withRetries(async () => {
      attempts++
      if (attempts < 3) {
        throw new Error('temporary failure')
      }
      return 'ok'
    }, 3)

    expect(result).toBe('ok')
    expect(attempts).toBe(3)
  })
})
