import React from 'react'
import { render, screen } from '@testing-library/react'
import Marketplace from '../src/pages/Marketplace'

it('renders Marketplace heading', () => {
  render(<Marketplace />)
  expect(screen.getByText('P2P Marketplace')).toBeInTheDocument()
})
