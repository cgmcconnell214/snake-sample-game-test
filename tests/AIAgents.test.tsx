import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }) }) }) }),
    auth: { getUser: vi.fn(() => ({ data: { user: null } })) },
  },
}))

import AIAgents from '@/pages/AIAgents'

describe('AI Agents interface', () => {
  it('renders AI Agents Marketplace heading', () => {
    render(<AIAgents />)
    expect(screen.getByText(/AI Agents Marketplace/i)).toBeInTheDocument()
  })
})
