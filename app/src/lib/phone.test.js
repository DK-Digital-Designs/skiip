import { normalizeE164Phone, splitE164Phone } from './phone';

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
});
