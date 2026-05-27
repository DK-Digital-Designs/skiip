const E164_PATTERN = /^\+[1-9]\d{7,14}$/

export function normalizeSubmittedWhatsAppPhone(phone: string | null | undefined) {
  const normalized = (phone || '').trim().replace(/[\s()-]/g, '')
  return E164_PATTERN.test(normalized) ? normalized : null
}
