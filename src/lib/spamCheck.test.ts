import { describe, it, expect, vi } from 'vitest'

// Mock fetch so you don't hit the real API in tests
vi.stubGlobal('fetch', vi.fn())

describe('checkEventSpam', () => {
  it('returns isSpam: false for a legitimate event', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({
        choices: [{ message: { content: '{"isSpam":false,"reason":null}' } }],
      }),
    } as any)

    const { checkEventSpam } = await import('./spamCheck')
    const result = await checkEventSpam({
      title: 'Morning Hike',
      description: 'Come join us!',
      location: 'Waitakere',
    })
    expect(result.isSpam).toBe(false)
  })

  it('returns isSpam: true for gibberish', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({
        choices: [{ message: { content: '{"isSpam":true,"reason":"nonsense"}' } }],
      }),
    } as any)

    const { checkEventSpam } = await import('./spamCheck')
    const result = await checkEventSpam({
      title: '$$$ BUY NOW $$$',
      description: 'asdflkjhqwer',
      location: '',
    })
    expect(result.isSpam).toBe(true)
  })
})