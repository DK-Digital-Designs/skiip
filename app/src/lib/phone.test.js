import { normalizeE164Phone, normalizeOperationalPhone, splitE164Phone } from './phone';

describe('checkout phone normalization', () => {
  it('normalizes local UK and international input to E.164', () => {
    expect(normalizeE164Phone('GB', '07700 900123')).toBe('+447700900123');
    expect(normalizeE164Phone('ZA', '082 123 4567')).toBe('+27821234567');
    expect(normalizeE164Phone('GB', '+353 87 123 4567')).toBe('+353871234567');
  });

  it('rejects invalid opted-in values and separates existing E.164 data', () => {
    expect(normalizeE164Phone('GB', 'abc')).toBeNull();
    expect(splitE164Phone('+27821234567')).toEqual({ countryCode: 'ZA', localNumber: '821234567' });
  });

  it('normalizes event-day operational phone input without country assumptions', () => {
    expect(normalizeOperationalPhone(' 07700 900123 ')).toBe('07700900123');
    expect(normalizeOperationalPhone('+44 (7700) 900-123')).toBe('+447700900123');
  });

  it('rejects empty or implausible operational phone input', () => {
    expect(normalizeOperationalPhone('')).toBeNull();
    expect(normalizeOperationalPhone('not-a-phone')).toBeNull();
    expect(normalizeOperationalPhone('123')).toBeNull();
  });
});
