import { render, screen } from '@testing-library/react'
import Trading from '@/pages/Trading'

describe('Trading interface', () => {
  it('renders page heading', () => {
    render(<Trading />)
    expect(screen.getByText(/Trading Platform/i)).toBeInTheDocument()
  })
})
