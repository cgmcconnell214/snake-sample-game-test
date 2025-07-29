import { render, screen } from '@testing-library/react'
import LearningPortal from '@/pages/LearningPortal'

describe('Learning interface', () => {
  it('renders Learning Portal heading', () => {
    render(<LearningPortal />)
    expect(screen.getByText(/Learning Portal/i)).toBeInTheDocument()
  })
})
