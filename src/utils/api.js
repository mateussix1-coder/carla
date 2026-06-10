export async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.error || 'Não foi possível concluir a operação.')
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}

export function mediaUrl(path) {
  if (!path) return ''
  if (path.startsWith('/') && !path.startsWith('/api/')) return path
  if (path.startsWith('http')) return path
  return `/api/media/${path.split('/').map(encodeURIComponent).join('/')}`
}
