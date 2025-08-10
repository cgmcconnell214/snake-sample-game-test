import React from 'react'
import { render, screen } from '@testing-library/react'
import AIAgents from '../src/pages/AIAgents'

vi.mock('../src/hooks/useToast', () => ({ useToast: () => ({ toast: vi.fn() }) }))

it('renders AI Agents heading', () => {
  render(<AIAgents />)
  expect(screen.getByText('AI Agents Marketplace')).toBeInTheDocument()
})
