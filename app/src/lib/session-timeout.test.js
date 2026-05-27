import { getSessionTimeoutHours, isSessionInactive } from './session-timeout';

describe('application session timeout', () => {
  it('defaults missing, zero, and invalid role values to no idle sign-out', () => {
    expect(getSessionTimeoutHours('buyer', {})).toBe(0);
    expect(getSessionTimeoutHours('seller', { VITE_VENDOR_SESSION_TIMEOUT_HOURS: '0' })).toBe(0);
    expect(getSessionTimeoutHours('admin', { VITE_ADMIN_SESSION_TIMEOUT_HOURS: 'bad' })).toBe(0);
  });

  it('uses per-role timeout configuration', () => {
    const environment = {
      VITE_BUYER_SESSION_TIMEOUT_HOURS: '1',
      VITE_VENDOR_SESSION_TIMEOUT_HOURS: '2',
      VITE_ADMIN_SESSION_TIMEOUT_HOURS: '3',
    };
    expect(getSessionTimeoutHours('buyer', environment)).toBe(1);
    expect(getSessionTimeoutHours('seller', environment)).toBe(2);
    expect(getSessionTimeoutHours('admin', environment)).toBe(3);
  });

  it('expires only after the configured inactivity period', () => {
    const now = Date.parse('2026-05-27T10:00:00Z');
    expect(isSessionInactive(now - (60 * 60 * 1000) + 1, 1, now)).toBe(false);
    expect(isSessionInactive(now - (60 * 60 * 1000), 1, now)).toBe(true);
    expect(isSessionInactive(now - (10 * 60 * 60 * 1000), 0, now)).toBe(false);
  });
});
