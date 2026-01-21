import { fileTypeFromStream } from 'file-type'
import { createReadStream } from 'fs'
import fs from 'fs/promises'
import crypto from 'crypto'
import path from 'path'

const basePath = path.resolve(process.env.STORAGE_DIR || 'data', 'storage')
const uploadsPath = path.resolve(process.env.STORAGE_DIR || 'data', 'uploads')

export async function exists(id: string, type: 'file' | 'upload' = 'file') {
  try {
    await fs.access(path.join(type === 'file' ? basePath : uploadsPath, id))
    return true
  } catch {
    return false
  }
}

export async function read(id: string, type: 'file' | 'upload' = 'file') {
  if (!(await exists(id, type))) return null

  return await fs.readFile(
    path.join(type === 'file' ? basePath : uploadsPath, id)
  )
}

export async function getReadStream(
  id: string,
  type: 'file' | 'upload' = 'file'
) {
  if (!(await exists(id, type))) return null
  return createReadStream(
    path.join(type === 'file' ? basePath : uploadsPath, id)
  )
}

export async function write(
  id: string,
  data: Buffer,
  type: 'file' | 'upload' = 'file'
) {
  return await fs.writeFile(
    path.join(type === 'file' ? basePath : uploadsPath, id),
    data
  )
}

export async function moveUploadToFile(uploadId: string, fileId: string) {
  return await fs.rename(
    path.join(uploadsPath, uploadId),
    path.join(basePath, fileId)
  )
}

export async function append(
  id: string,
  data: Buffer,
  type: 'file' | 'upload' = 'file'
) {
  return await fs.appendFile(
    path.join(type === 'file' ? basePath : uploadsPath, id),
    data
  )
}

export async function remove(id: string, type: 'file' | 'upload' = 'file') {
  if (!(await exists(id, type))) return false

  return await fs.rm(path.join(type === 'file' ? basePath : uploadsPath, id))
}

export async function hashFile(id: string, type: 'file' | 'upload' = 'file') {
  return new Promise<string>((resolve, reject) => {
    const hash = crypto.createHash('sha256')

    const stream = createReadStream(
      path.join(type === 'file' ? basePath : uploadsPath, id)
    )

    stream.on('data', data => hash.update(data))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', err => reject(err))
  })
}

function isFilePlainText(buffer: Buffer) {
  const SAMPLE_SIZE = 64 * 1024
  const TOLERANCE = 0.95

  const slice =
    buffer.length > SAMPLE_SIZE ? buffer.subarray(0, SAMPLE_SIZE) : buffer

  let textChars = 0
  for (let i = 0; i < slice.length; i++) {
    const byte = slice[i]
    if (
      (byte >= 32 && byte <= 126) || // printable ASCII
      byte === 9 || // tab
      byte === 10 || // line feed
      byte === 13 // carriage return
    ) {
      textChars++
    }
  }

  return textChars / slice.length >= TOLERANCE
}

export async function getType(
  id: string,
  type: 'file' | 'upload' = 'file',
  size: bigint | number
) {
  const stream = await getReadStream(id, type)
  if (!stream) return 'unknown'

  const mime = await fileTypeFromStream(stream)
  if (mime) return mime.mime

  const PLAIN_MAX_SIZE = 10 * 1024 * 1024 // 10MB
  if (size <= PLAIN_MAX_SIZE) {
    const buffer = await read(id, type)
    if (buffer && isFilePlainText(buffer)) return 'text/plain'
  }

  return 'unknown'
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

if (!(await exists(uploadsPath, 'upload')))
  fs.mkdir(uploadsPath, {
    recursive: true
  })
