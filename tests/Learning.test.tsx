import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { it, expect } from 'vitest'
import LearningPortal from '../src/pages/LearningPortal'

it('renders Learning heading', () => {
  render(
    <MemoryRouter>
      <LearningPortal />
    </MemoryRouter>
  )
  expect(screen.getByText('Learning Portal')).toBeInTheDocument()
})
