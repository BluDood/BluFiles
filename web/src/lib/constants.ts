import { browser } from '$app/environment'

export const BASE_URL = browser
  ? location.port !== ''
    ? `${location.hostname}:1337`
    : location.host
  : null

export const API_URL = browser
  ? `${location.protocol}//${BASE_URL}/api`
  : null

export const SHARE_URL = browser
  ? `${location.protocol}//${BASE_URL}/s`
  : null
