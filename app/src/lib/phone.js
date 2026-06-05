export const PHONE_COUNTRIES = [
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'IE', name: 'Ireland', dialCode: '+353' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27' },
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'AU', name: 'Australia', dialCode: '+61' },
  { code: 'DE', name: 'Germany', dialCode: '+49' },
  { code: 'FR', name: 'France', dialCode: '+33' },
];

const E164_PATTERN = /^\+[1-9]\d{7,14}$/;
const OPERATIONAL_PHONE_PATTERN = /^\+?\d{7,15}$/;

export function getPhoneCountry(code) {
  return PHONE_COUNTRIES.find((country) => country.code === code) || PHONE_COUNTRIES[0];
}

export function normalizeE164Phone(countryCode, number) {
  const dialCode = getPhoneCountry(countryCode).dialCode;
  const trimmed = String(number || '').trim();
  if (!trimmed) return null;

  const compact = trimmed.replace(/[\s()-]/g, '');
  const normalized = compact.startsWith('+')
    ? compact
    : compact.startsWith('00')
      ? `+${compact.slice(2)}`
      : `${dialCode}${compact.replace(/^0+/, '')}`;

  return E164_PATTERN.test(normalized) ? normalized : null;
}

export function normalizeOperationalPhone(number) {
  const normalized = String(number || '').trim().replace(/[\s().\[\]-]/g, '');
  return OPERATIONAL_PHONE_PATTERN.test(normalized) ? normalized : null;
}

export function splitE164Phone(number) {
  const compact = String(number || '').replace(/[\s()-]/g, '');
  const matchedCountry = [...PHONE_COUNTRIES]
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((country) => compact.startsWith(country.dialCode));

  if (!matchedCountry) {
    return { countryCode: 'GB', localNumber: compact };
  }

  return {
    countryCode: matchedCountry.code,
    localNumber: compact.slice(matchedCountry.dialCode.length),
  };
}
