import { generateXrplCurrencyCode } from '../supabase/functions/utils'

describe('generateXrplCurrencyCode', () => {
  it('pads short symbols to three chars', () => {
    expect(generateXrplCurrencyCode('USD')).toBe('USD')
    expect(generateXrplCurrencyCode('US')).toBe('US\0')
  })

  it('creates hex code for long symbols', () => {
    const code = generateXrplCurrencyCode('LONGTOKEN')
    expect(code.length).toBe(40)
    expect(code).toMatch(/^[0-9A-F]+$/)
  })
})
