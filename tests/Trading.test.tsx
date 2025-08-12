import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, it, expect } from 'vitest'
import Trading from '../src/pages/Trading'

vi.mock('../src/components/RealTimeTrading', () => ({ default: () => <div>Trading Platform</div> }))

vi.mock('../src/components/TradingChart', () => ({ TradingChart: () => <div>chart</div> }))
vi.mock('../src/components/OrderBook', () => ({ OrderBook: () => <div>orderbook</div> }))
vi.mock('../src/components/TradePanel', () => ({ TradePanel: () => <div>panel</div> }))

it('renders Trading page heading', () => {
  render(
    <MemoryRouter>
      <Trading />
    </MemoryRouter>
  )
  expect(screen.getByText('Trading Platform')).toBeInTheDocument()
})
