import crypto from 'crypto'
import fs from 'fs/promises'

export const random = len => crypto.randomBytes(len / 2).toString('hex')

export const hash = str =>
  crypto.createHash('sha256').update(str).digest('hex')

export function hashPassword(password) {
  const salt = random(16)
  const hashed = hash(salt + password)
  return { salt, hash: hashed }
}

export const verifyPassword = (pass, salt, hashed) =>
  hash(salt + pass) === hashed

export const getPackage = async () =>
  JSON.parse(await fs.readFile('./package.json', 'utf8'))
