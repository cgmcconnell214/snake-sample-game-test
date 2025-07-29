import { describe, it } from 'vitest'

const pages = [
  'AIAgents',
  'Admin',
  'Auth',
  'DivineTrustNew',
  'EscrowVaults',
  'LearningPortalNew',
  'LiquidityPoolsNew',
  'LiveClassesNew',
  'MarketplaceNew',
  'Reports',
  'SacredLaw',
  'Settings',
  'SiteEntry',
  'SmartContracts',
  'SmartContractsNew',
  'Tokenize',
  'UserProfile',
  'WorkflowAutomation',
]

describe('Supabase page integrations', () => {
  pages.forEach((page) => {
    it.todo(`${page} integrates with Supabase`)
  })
})
