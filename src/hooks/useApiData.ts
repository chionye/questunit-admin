import type { AxiosResponse } from 'axios';
import type { ApiResponse } from '@/types';

/**
 * Extracts data from various API response shapes.
 * Handles: { data: [...] }, { results: [...] }, { data: { data: [...] } }, or direct array
 */
export function extractData<T>(response: AxiosResponse<ApiResponse<T>>): T | undefined {
  const body = response.data;
  if (Array.isArray(body)) return body as unknown as T;
  if (body?.data !== undefined) {
    // Handle paginated responses: { data: { data: [...], totalCount, ... } }
    if (body.data && typeof body.data === 'object' && !Array.isArray(body.data) && 'data' in body.data) {
      return (body.data as Record<string, unknown>).data as T;
    }
    return body.data as T;
  }
  if (body?.results !== undefined) return body.results as T;
  return body as unknown as T;
}

/**
 * Normalizes an item's id field.
 * Handles both `id` and `_id` from MongoDB.
 */
export function normalizeId(item: Record<string, unknown>): string {
  return String(item.id || item._id || '');
}
