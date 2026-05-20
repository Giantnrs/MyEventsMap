import { describe, it, expect, vi } from 'vitest'
import { downloadIcs } from '@/lib/icsExport'

describe('downloadIcs', () => {
  it('triggers a download with valid ICS content', () => {
    let captured = ''

    // Capture what gets passed to Blob
    vi.stubGlobal('Blob', class {
      constructor(parts: string[]) { captured = parts.join('') }
    })
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:fake'),
      revokeObjectURL: vi.fn(),
    })

    const clickSpy = vi.fn()
    vi.spyOn(document, 'createElement').mockReturnValue({
      click: clickSpy,
      href: '',
      download: '',
    } as any)

    downloadIcs([{
      id: 'abc',
      title: 'Test Event',
      description: 'A test',
      location: 'Auckland',
      lat: -36.8,
      lng: 174.7,
      startTime: new Date('2025-06-01T10:00:00Z'),
      endTime: new Date('2025-06-01T12:00:00Z'),
    } as any])

    expect(captured).toContain('BEGIN:VCALENDAR')
    expect(captured).toContain('SUMMARY:Test Event')
    expect(captured).toContain('DTSTART:20250601T100000Z')
    expect(clickSpy).toHaveBeenCalled()
  })
})