import axios from 'axios'
import bowser from 'bowser'

import { browser } from '$app/environment'
import { API_URL } from './constants.js'

export function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes'

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatDate(timestamp: number | string) {
  const date = new Date(timestamp)
  const hoursSince = (Date.now() - date.getTime()) / 60 / 60 / 60
  if (hoursSince < 24) {
    return Intl.DateTimeFormat(navigator.language, {
      hour: 'numeric',
      minute: 'numeric'
    }).format(date)
  } else {
    return Intl.DateTimeFormat(navigator.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }
}

export const req = axios.create({
  baseURL: API_URL!,
  validateStatus: () => true
})

req.interceptors.request.use(req => {
  if (browser) {
    const token = localStorage.getItem('token')
    if (token) req.headers.Authorization = `token ${token}`
  }

  return req
})

req.interceptors.response.use(res => {
  if (!res.config.no401Redirect && res.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/auth/login'

    return new Promise(() => {})
  } else {
    return res
  }
})

export function formatUA(ua: string) {
  const parsed = bowser.getParser(ua)
  const browser = parsed.getBrowser()
  const os = parsed.getOS()
  if (!browser.name || !os.name) return 'Unknown'

  return `${browser.name} ${browser.version} on ${os.name} ${os.versionName}`
}

export const random = (len: number) =>
  [...crypto.getRandomValues(new Uint8Array(Math.ceil(len / 2)))]
    .map(s => s.toString(16))
    .join('')
    .slice(0, len)
