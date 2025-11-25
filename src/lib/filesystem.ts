import { fileTypeFromBuffer as fileType } from 'file-type'
import fs from 'fs/promises'
import crypto from 'crypto'
import path from 'path'

const basePath = path.resolve(process.env.STORAGE_DIR || 'data', 'storage')

export async function exists(id: string) {
  try {
    await fs.access(path.join(basePath, id))
    return true
  } catch {
    return false
  }
}

export async function read(id: string) {
  if (!(await exists(id))) return null

  return await fs.readFile(path.join(basePath, id))
}

export async function write(id: string, data: Buffer) {
  return await fs.writeFile(path.join(basePath, id), data)
}

export async function remove(id: string) {
  if (!(await exists(id))) return false

  return await fs.rm(path.join(basePath, id))
}

export async function hashFile(buffer: Buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

export async function getType(buffer: Buffer) {
  const type = await fileType(buffer)
  return type
}

export async function getStorageStats() {
  const stat = await fs.statfs(basePath)

  const total = stat.blocks * stat.bsize
  const used = (stat.blocks - stat.bfree) * stat.bsize

  return {
    total: Math.round(total / 1024 / 1024 / 1024),
    used: Math.round(used / 1024 / 1024 / 1024)
  }
}

export async function getStorageUsage(ids: string[] | null = null) {
  let files = await fs.readdir(basePath)
  if (ids) files = files.filter(file => ids.includes(file))
  const stats = await Promise.all(
    files.map(async file => {
      const stat = await fs.stat(path.join(basePath, file))
      return stat.size
    })
  )

  const total = stats.reduce((a, b) => a + b, 0)
  return Math.round(total)
}

if (!(await exists(basePath)))
  fs.mkdir(basePath, {
    recursive: true
  })
