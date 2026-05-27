import { assertEquals } from "jsr:@std/assert@1"
import { normalizeSubmittedWhatsAppPhone } from "../_shared/phone.ts"

Deno.test("normalizes canonical E.164 WhatsApp input", () => {
  assertEquals(normalizeSubmittedWhatsAppPhone("+44 7700 900123"), "+447700900123")
  assertEquals(normalizeSubmittedWhatsAppPhone("+27(82)123-4567"), "+27821234567")
})

Deno.test("rejects local or malformed WhatsApp input at the order boundary", () => {
  assertEquals(normalizeSubmittedWhatsAppPhone("07700900123"), null)
  assertEquals(normalizeSubmittedWhatsAppPhone("not-a-number"), null)
})
