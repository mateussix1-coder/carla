export function generateId(prefix = 'ID') {
  const random = globalThis.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  return `${prefix}-${random}`
}

export function sanitizeInput(value, maxLength = 500) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength)
}

export function isValidHttpUrl(value) {
  try {
    const url = new URL(String(value || '').trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function videoEmbedUrl(value) {
  if (!isValidHttpUrl(value)) return ''
  const url = new URL(value)

  if (url.hostname.includes('youtu.be')) {
    const id = url.pathname.split('/').filter(Boolean)[0]
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : ''
  }

  if (url.hostname.includes('youtube.com')) {
    const id = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).at(-1)
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : ''
  }

  if (url.hostname.includes('vimeo.com')) {
    const id = url.pathname.split('/').filter(Boolean).at(-1)
    return id ? `https://player.vimeo.com/video/${id}` : ''
  }

  return ''
}
