import { render, screen, fireEvent } from '@testing-library/react'
import FilterBar, { DEFAULT_FILTERS } from './FilterBar'

describe('FilterBar', () => {
  it('calls onChange with search text', () => {
    const onChange = vi.fn()
    render(<FilterBar filters={DEFAULT_FILTERS} onChange={onChange} />)
    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: 'hike' }
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'hike' })
    )
  })

  it('shows Clear button only when a filter is active', () => {
    const { rerender } = render(
      <FilterBar filters={DEFAULT_FILTERS} onChange={vi.fn()} />
    )
    expect(screen.queryByText('Clear')).not.toBeInTheDocument()

    rerender(
      <FilterBar
        filters={{ ...DEFAULT_FILTERS, category: 'MUSIC' }}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText('Clear')).toBeInTheDocument()
  })
})