import { render, screen, fireEvent } from '@testing-library/react'
import DonatePanel from './DonatePanel'

vi.stubGlobal('fetch', vi.fn())

describe('DonatePanel', () => {
  it('shows raised amount in dollars', () => {
    render(<DonatePanel eventId="1" raised={2500} count={3} />)
    expect(screen.getByText(/\$25\.00/)).toBeInTheDocument()
    expect(screen.getByText(/3 donations/)).toBeInTheDocument()
  })

  it('preset buttons update the amount', async () => {
    render(<DonatePanel eventId="1" raised={0} count={0} />)
    fireEvent.click(screen.getByText('$20'))
    const input = screen.getByPlaceholderText('Custom amount') as HTMLInputElement
    expect(input.value).toBe('20')
  })

  it('disables donate button when amount is empty', () => {
    render(<DonatePanel eventId="1" raised={0} count={0} />)
    const input = screen.getByPlaceholderText('Custom amount')
    fireEvent.change(input, { target: { value: '' } })
    expect(screen.getByText('Donate').closest('button')).toBeDisabled()
  })
})