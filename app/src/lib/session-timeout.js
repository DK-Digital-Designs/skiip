export const SESSION_EXPIRED_REASON = 'session_expired';

const SESSION_ACTIVITY_PREFIX = 'skiip-session-activity:';
const ROLE_TIMEOUT_KEYS = {
  buyer: 'VITE_BUYER_SESSION_TIMEOUT_HOURS',
  seller: 'VITE_VENDOR_SESSION_TIMEOUT_HOURS',
  admin: 'VITE_ADMIN_SESSION_TIMEOUT_HOURS',
};

export function getSessionTimeoutHours(role, environment = import.meta.env) {
  const value = Number(environment?.[ROLE_TIMEOUT_KEYS[role]]);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function getSessionActivityStorageKey(userId) {
  return `${SESSION_ACTIVITY_PREFIX}${userId}`;
}

export function markSessionActivity(userId, now = Date.now()) {
  window.localStorage.setItem(getSessionActivityStorageKey(userId), String(now));
}

export function clearSessionActivity(userId) {
  window.localStorage.removeItem(getSessionActivityStorageKey(userId));
}

export function isSessionInactive(lastActivityAt, timeoutHours, now = Date.now()) {
  const timestamp = Number(lastActivityAt);
  if (!Number.isFinite(timestamp) || timeoutHours <= 0) return false;
  return now - timestamp >= timeoutHours * 60 * 60 * 1000;
}
