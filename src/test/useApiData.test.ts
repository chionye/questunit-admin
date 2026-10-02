import { describe, it, expect } from 'vitest';
import { extractData, extractPagination, normalizeId } from '@/hooks/useApiData';
import type { ApiResponse } from '@/types';
import type { AxiosResponse } from 'axios';

function makeResponse<T>(data: T): AxiosResponse<ApiResponse<T>> {
  return { data: data as ApiResponse<T> } as AxiosResponse<ApiResponse<T>>;
}

describe('extractData', () => {
  it('returns the body when it is a direct array', () => {
    const items = [{ id: 1 }, { id: 2 }];
    expect(extractData(makeResponse(items))).toEqual(items);
  });

  it('returns body.data when present', () => {
    expect(extractData(makeResponse({ data: { id: 1 } }))).toEqual({ id: 1 });
  });

  it('unwraps nested paginated { data: { data: [...] } } responses', () => {
    const nested = { data: { data: [{ id: 1 }], totalCount: 1 } };
    expect(extractData(makeResponse(nested))).toEqual([{ id: 1 }]);
  });

  it('falls back to results when data is absent', () => {
    expect(extractData(makeResponse({ results: [{ id: 3 }] }))).toEqual([
      { id: 3 },
    ]);
  });

  it('returns the raw envelope when nothing else matches', () => {
    const envelope = { random: 'x' };
    expect(extractData(makeResponse(envelope))).toEqual(envelope);
  });
});

describe('extractPagination', () => {
  it('reads pagination metadata from inner payload', () => {
    const response = makeResponse({
      data: { data: [], totalCount: 42, totalPages: 5, currentPage: 2 },
    });
    expect(extractPagination(response)).toEqual({
      totalCount: 42,
      totalPages: 5,
      currentPage: 2,
    });
  });

  it('returns defaults for non-paginated responses', () => {
    const response = makeResponse({ data: [{ id: 1 }] });
    expect(extractPagination(response)).toEqual({
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
    });
  });

  it('falls back to zero/one for missing pagination keys', () => {
    const response = makeResponse({ data: { data: [] } });
    expect(extractPagination(response)).toEqual({
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
    });
  });
});

describe('normalizeId', () => {
  it('uses id when present', () => {
    expect(normalizeId({ id: 42 })).toBe('42');
  });

  it('falls back to _id (Mongo-style ids)', () => {
    expect(normalizeId({ _id: 'abc123' })).toBe('abc123');
  });

  it('returns empty string when neither is present', () => {
    expect(normalizeId({ name: 'x' })).toBe('');
  });
});