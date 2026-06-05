const E164_PATTERN = /^\+[1-9]\d{7,14}$/
const OPERATIONAL_PHONE_PATTERN = /^\+?\d{7,15}$/

export function normalizeSubmittedWhatsAppPhone(phone: string | null | undefined) {
  const normalized = (phone || '').trim().replace(/[\s()-]/g, '')
  return E164_PATTERN.test(normalized) ? normalized : null
}

export function normalizeSubmittedOperationalPhone(phone: string | null | undefined) {
  const normalized = (phone || '').trim().replace(/[\s().\[\]-]/g, '')
  return OPERATIONAL_PHONE_PATTERN.test(normalized) ? normalized : null
}
