import crypto from "crypto"

function getKey(): Buffer {
  const hex = process.env.PII_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    return Buffer.alloc(32)
  }
  return Buffer.from(hex, "hex")
}

export function encryptPII(plain: string | null | undefined): string | null {
  if (!plain || plain === "") {
    return null
  }

  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()
  const combined = Buffer.concat([iv, authTag, encrypted])

  return combined.toString("base64")
}

export function decryptPII(enc: string | null | undefined): string | null {
  if (!enc || enc === "") {
    return null
  }

  try {
    const key = getKey()
    const buffer = Buffer.from(enc, "base64")

    const iv = buffer.slice(0, 12)
    const authTag = buffer.slice(12, 28)
    const ciphertext = buffer.slice(28)

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ])

    return decrypted.toString("utf8")
  } catch {
    return null
  }
}

export function maskPII(
  value: string | null | undefined,
  visible = 4
): string {
  if (!value || value === "") {
    return "—"
  }

  if (value.length <= visible) {
    return "•".repeat(value.length)
  }

  const dots = Math.min(value.length - visible, 8)
  return "•".repeat(dots) + value.slice(-visible)
}
