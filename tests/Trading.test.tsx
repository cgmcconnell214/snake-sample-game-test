import { render, screen } from '@testing-library/react'
import Trading from '../src/pages/Trading'

vi.mock('../src/components/TradingChart', () => ({ TradingChart: () => <div>chart</div> }))
vi.mock('../src/components/OrderBook', () => ({ OrderBook: () => <div>orderbook</div> }))
vi.mock('../src/components/TradePanel', () => ({ TradePanel: () => <div>panel</div> }))

it('renders Trading page heading', () => {
  render(<Trading />)
  expect(screen.getByText('Trading Platform')).toBeInTheDocument()
})
