import { describe, it } from 'vitest'

const pages = [
  'Dashboard',
  'Portfolio',
  'AuditTrail',
  'Tokenize',
]

describe('XRPL page integrations', () => {
  pages.forEach((page) => {
    it.todo(`${page} integrates with XRPL`)
  })
})
