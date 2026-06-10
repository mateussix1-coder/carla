import { sendJson } from '../server/_lib/http.js'
import health from '../server/health.js'
import media from '../server/media.js'
import state from '../server/state.js'
import upload from '../server/upload.js'
import login from '../server/auth/login.js'
import logout from '../server/auth/logout.js'
import register from '../server/auth/register.js'
import session from '../server/auth/session.js'
import users from '../server/users/index.js'
import userById from '../server/users/[id].js'
import currentUser from '../server/users/me.js'
import feed from '../server/feed/index.js'
import feedPost from '../server/feed/[id].js'
import feedLike from '../server/feed/[id]/like.js'
import feedComments from '../server/feed/[id]/comments.js'
import studentAnalytics from '../server/analytics/students.js'
import trackAnalytics from '../server/analytics/track.js'
import backup from '../server/cron/backup.js'
import education from '../server/education.js'

const staticRoutes = new Map([
  ['health', health],
  ['media', media],
  ['state', state],
  ['upload', upload],
  ['auth/login', login],
  ['auth/logout', logout],
  ['auth/register', register],
  ['auth/session', session],
  ['users', users],
  ['users/me', currentUser],
  ['feed', feed],
  ['analytics/students', studentAnalytics],
  ['analytics/track', trackAnalytics],
  ['cron/backup', backup],
])

export default async function handler(request, response) {
  const pathname = new URL(request.url, 'http://localhost').pathname
  const queryPath = Array.isArray(request.query?._route)
    ? request.query._route.join('/')
    : String(request.query?._route || '')
  const path = (queryPath || pathname.replace(/^\/api\/?/, '')).replace(/\/+$/, '')
  const staticHandler = staticRoutes.get(path)
  if (staticHandler) return staticHandler(request, response)

  const educationMatch = path.match(/^education(?:\/(.*))?$/)
  if (educationMatch) {
    request.query = {
      ...request.query,
      educationPath: educationMatch[1] || '',
    }
    return education(request, response)
  }

  const mediaMatch = path.match(/^media\/(.+)$/)
  if (mediaMatch) {
    request.query = {
      ...request.query,
      path: decodeURIComponent(mediaMatch[1]),
    }
    return media(request, response)
  }

  const feedMatch = path.match(/^feed\/([^/]+)(?:\/(like|comments))?$/)
  if (feedMatch) {
    request.query = {
      ...request.query,
      id: decodeURIComponent(feedMatch[1]),
    }
    if (feedMatch[2] === 'like') return feedLike(request, response)
    if (feedMatch[2] === 'comments') return feedComments(request, response)
    return feedPost(request, response)
  }

  const userMatch = path.match(/^users\/([^/]+)$/)
  if (userMatch) {
    request.query = {
      ...request.query,
      id: decodeURIComponent(userMatch[1]),
    }
    return userById(request, response)
  }

  return sendJson(response, 404, { error: 'Rota não encontrada.' })
}
