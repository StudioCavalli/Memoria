import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('resolves conflicting Tailwind classes (last one wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('drops falsy values and keeps conditionals', () => {
    expect(cn('a', false && 'b', undefined, 'c')).toBe('a c')
  })
})
