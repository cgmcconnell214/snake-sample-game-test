import { render, screen } from '@testing-library/react'
import LearningPortal from '../src/pages/LearningPortal'

it('renders Learning heading', () => {
  render(<LearningPortal />)
  expect(screen.getByText('Learning Portal')).toBeInTheDocument()
})
