import { browser } from '$app/environment'

export const BASE_URL = browser
  ? location.port !== ''
    ? `${location.hostname}:1337`
    : location.host
  : null

export const API_URL = browser ? `${location.protocol}//${BASE_URL}/api` : null

export const SHARE_URL = browser ? `${location.protocol}//${BASE_URL}/s` : null

interface LanguageMapping {
  name: string
  monaco: string
  noLineNumbers?: boolean
}

export const LANGUAGE_MAPPINGS: Record<string, LanguageMapping> = {
  text: {
    name: 'Plain Text',
    monaco: 'plaintext',
    noLineNumbers: true
  },
  js: {
    name: 'JavaScript',
    monaco: 'javascript'
  },
  ts: {
    name: 'TypeScript',
    monaco: 'typescript'
  },
  json: {
    name: 'JSON',
    monaco: 'json'
  },
  yaml: {
    name: 'YAML',
    monaco: 'yaml'
  },
  dockerfile: {
    name: 'Dockerfile',
    monaco: 'dockerfile'
  },
  md: {
    name: 'Markdown',
    monaco: 'markdown'
  },
  py: {
    name: 'Python',
    monaco: 'python'
  },
  cs: {
    name: 'C#',
    monaco: 'csharp'
  },
  java: {
    name: 'Java',
    monaco: 'java'
  },
  cpp: {
    name: 'C++',
    monaco: 'cpp'
  },
  html: {
    name: 'HTML',
    monaco: 'html'
  },
  css: {
    name: 'CSS',
    monaco: 'css'
  },
  rb: {
    name: 'Ruby',
    monaco: 'ruby'
  },
  go: {
    name: 'Go',
    monaco: 'go'
  },
  php: {
    name: 'PHP',
    monaco: 'php'
  },
  xml: {
    name: 'XML',
    monaco: 'xml'
  },
  swift: {
    name: 'Swift',
    monaco: 'swift'
  },
  shell: {
    name: 'Shell',
    monaco: 'shell'
  }
}
