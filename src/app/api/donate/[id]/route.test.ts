import { describe, it, expect, vi } from 'vitest'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: { findUnique: vi.fn() },
    donation: { create: vi.fn() },
  },
}))
vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: { create: vi.fn() },
    },
  },
}))
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))

describe('POST /api/donate/[id]', () => {
  it('returns 400 for invalid amount', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/donate/1', {
      method: 'POST',
      body: JSON.stringify({ amount: 0 }),
    })
    const res = await POST(req as any, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(400)
  })
})