import fs from 'fs/promises'
import crypto from 'crypto'

export const random = (len: number) =>
  crypto.randomBytes(len / 2).toString('hex')

export const hash = (str: string) =>
  crypto.createHash('sha256').update(str).digest('hex')

export function hashPassword(password: string) {
  const salt = random(16)
  const hashed = hash(salt + password)
  return { salt, hash: hashed }
}

export const verifyPassword = (pass: string, salt: string, hashed: string) =>
  hash(salt + pass) === hashed

export const getPackage = async () =>
  JSON.parse(await fs.readFile('./package.json', 'utf8'))

export const isDev = process.env.NODE_ENV !== 'production'

enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR
}

class Logger {
  private level: LogLevel = isDev ? LogLevel.DEBUG : LogLevel.INFO
  constructor() {
    if (process.env.BLUTOOLS_LOG_LEVEL) {
      const level = parseInt(process.env.BLUTOOLS_LOG_LEVEL, 10)
      if (level >= LogLevel.DEBUG && level <= LogLevel.ERROR) {
        this.level = level
      }
    }
  }

  private logLevelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR']

  private log(text: string, scope?: string, level = LogLevel.INFO) {
    if (level < this.level) return

    const time = new Date().toLocaleTimeString([], {
      hour12: false,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    })

    const levelName = this.logLevelNames[level]

    const log = `[${time}] ${levelName}${scope ? ` <${scope}>:` : ''} ${text}`

    console.log(log)
  }

  public debug(text: string, scope?: string) {
    this.log(text, scope, LogLevel.DEBUG)
  }

  public info(text: string, scope?: string) {
    this.log(text, scope, LogLevel.INFO)
  }

  public warn(text: string, scope?: string) {
    this.log(text, scope, LogLevel.WARN)
  }

  public error(text: string, scope?: string) {
    this.log(text, scope, LogLevel.ERROR)
  }
}

export const logger = new Logger()
