import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('filters falsy values', () => {
    expect(cn('a', null, undefined, false, 'b')).toBe('a b');
  });

  it('resolves tailwind conflicts with the later class winning', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('returns empty string when nothing is passed', () => {
    expect(cn()).toBe('');
  });
});