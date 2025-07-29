import { describe, it, expect } from 'vitest'
import { cn } from '../src/lib/utils'

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })
})
