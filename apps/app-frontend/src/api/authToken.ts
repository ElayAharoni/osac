const ACCESS_TOKEN_STORAGE_KEY = 'osac.accessToken'

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  const token = window.sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
  return token && token.trim() ? token : null
}

export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return
  const value = token.trim()
  if (!value) {
    window.sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
    return
  }
  window.sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, value)
}

export function clearAccessToken(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
}

export function buildAuthHeaders(headers?: HeadersInit): Headers {
  const normalized = new Headers(headers ?? {})
  const token = getAccessToken()
  if (token) normalized.set('Authorization', `Bearer ${token}`)
  return normalized
}
