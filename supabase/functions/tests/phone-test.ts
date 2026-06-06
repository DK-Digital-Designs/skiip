import { assertEquals } from "jsr:@std/assert@1"
import { normalizeSubmittedOperationalPhone, normalizeSubmittedWhatsAppPhone } from "../_shared/phone.ts"

Deno.test("normalizes canonical E.164 WhatsApp input", () => {
  assertEquals(normalizeSubmittedWhatsAppPhone("+44 7700 900123"), "+447700900123")
  assertEquals(normalizeSubmittedWhatsAppPhone("+27(82)123-4567"), "+27821234567")
})

Deno.test("rejects local or malformed WhatsApp input at the order boundary", () => {
  assertEquals(normalizeSubmittedWhatsAppPhone("07700900123"), null)
  assertEquals(normalizeSubmittedWhatsAppPhone("not-a-number"), null)
})

Deno.test("normalizes operational order phone input without requiring WhatsApp format", () => {
  assertEquals(normalizeSubmittedOperationalPhone(" 07700 900123 "), "07700900123")
  assertEquals(normalizeSubmittedOperationalPhone("+44 (7700) 900-123"), "+447700900123")
  assertEquals(normalizeSubmittedOperationalPhone("+44 [7700].900-123"), "+447700900123")
})

Deno.test("rejects empty or implausible operational order phone input", () => {
  assertEquals(normalizeSubmittedOperationalPhone(""), null)
  assertEquals(normalizeSubmittedOperationalPhone("not-a-number"), null)
  assertEquals(normalizeSubmittedOperationalPhone("123"), null)
})
