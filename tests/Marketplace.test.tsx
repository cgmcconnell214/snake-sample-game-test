import { render, screen } from '@testing-library/react'
import Marketplace from '@/pages/Marketplace'

describe('Marketplace interface', () => {
  it('shows P2P Marketplace heading', () => {
    render(<Marketplace />)
    expect(screen.getByText(/P2P Marketplace/i)).toBeInTheDocument()
  })
})
