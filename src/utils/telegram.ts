const TELEGRAM_USERNAME_REGEX = /^@[a-zA-Z][a-zA-Z0-9_]{4,31}$/

export function normalizeTelegram(username: string): string {
  return username.trim().replace(/^@/, '').toLowerCase()
}

export function formatTelegram(username: string): string {
  const normalized = normalizeTelegram(username)
  return normalized ? `@${normalized}` : ''
}

export function isValidTelegram(username: string): boolean {
  return TELEGRAM_USERNAME_REGEX.test(username.trim())
}
