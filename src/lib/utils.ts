import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// The server's own message for a failed request, so admins see why an
// action failed (e.g. "Renderer has already been approved"), not just that it did.
export function apiErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return typeof message === 'string' && message.trim() ? message : fallback;
}

// The login page link that returns to `path` after signing in.
export function loginPath(path: string) {
  return path === '/' ? '/login' : `/login?next=${encodeURIComponent(path)}`;
}

// Only follow paths on this site, so a crafted login link can't send an admin elsewhere.
export function safeNextPath(next: string | null) {
  return next && /^\/(?![/\\])/.test(next) ? next : '/';
}
