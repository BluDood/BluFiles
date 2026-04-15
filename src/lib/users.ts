import prisma, { User } from '#lib/prisma.js'

import { hashPassword, verifyPassword } from '#lib/utils.js'
import { getFiles } from './files.js'
import { remove } from './filesystem.js'

interface FilteredAdminUser {
  id: string
  username: string
  type: 'user' | 'admin'
  storage?: {
    current: string
    max?: string
  }
  files?: {
    current: number
    max?: number
  }
  folders?: {
    current: number
    max?: number
  }
  pastes?: {
    current: number
    max?: number
  }
  collections?: {
    current: number
    max?: number
  }
  shares?: {
    current: number
    max?: number
  }
  tokens?: {
    current: number
    max?: number
  }
}

export const filterAdminUser = (
  f:
    | User
    | (User & {
        storage: bigint
        _count: {
          files: number
          folders: number
          pastes: number
          collections: number
          shares: number
          tokens: number
        }
      })
): FilteredAdminUser | null => {
  if (!f) return null
  const user: FilteredAdminUser = {
    id: f.id,
    username: f.username,
    type: f.type
  }

  if ('storage' in f)
    user.storage = {
      current: f.storage.toString(),
      max: f.storageLimit?.toString() ?? undefined
    }

  if ('_count' in f) {
    user.files = {
      current: f._count.files,
      max: f.fileLimit ?? undefined
    }
    user.folders = {
      current: f._count.folders,
      max: f.folderLimit ?? undefined
    }
    user.pastes = {
      current: f._count.pastes,
      max: f.pasteLimit ?? undefined
    }
    user.collections = {
      current: f._count.collections,
      max: f.collectionLimit ?? undefined
    }
    user.shares = {
      current: f._count.shares,
      max: f.shareLimit ?? undefined
    }
    user.tokens = {
      current: f._count.tokens,
      max: f.tokenLimit ?? undefined
    }
  }

  return user
}

export async function countUsers() {
  return await prisma.user.count()
}

export async function createUser({
  username,
  password
}: {
  username: string
  password: string
}) {
  const hash = await hashPassword(password)

  const count = await countUsers()

  const user = await prisma.user.create({
    data: {
      username,
      hash,
      type: count === 0 ? 'admin' : 'user'
    }
  })

  return user
}

export async function userExists(username: string) {
  const user = await prisma.user.findUnique({
    where: {
      username
    }
  })

  return !!user
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: {
      id
    }
  })

  return user
}

export async function getUserWithCounts(id: string) {
  const user = await prisma.user.findUnique({
    where: {
      id
    },
    include: {
      _count: {
        select: {
          files: true,
          folders: true,
          pastes: true,
          collections: true,
          shares: true,
          tokens: true
        }
      }
    }
  })

  return user
}

export async function updateUser({
  id,
  username,
  password,
  type,
  storageLimit,
  fileLimit,
  folderLimit,
  pasteLimit,
  collectionLimit,
  shareLimit,
  tokenLimit
}: {
  id: string
  username?: string
  password?: string
  type?: 'user' | 'admin'
  storageLimit?: number | null
  fileLimit?: number | null
  folderLimit?: number | null
  pasteLimit?: number | null
  collectionLimit?: number | null
  shareLimit?: number | null
  tokenLimit?: number | null
}) {
  const update: any = {}
  if (username) update.username = username
  if (password) update.hash = await hashPassword(password)

  if (type) update.type = type
  if (storageLimit !== undefined) update.storageLimit = storageLimit
  if (fileLimit !== undefined) update.fileLimit = fileLimit
  if (folderLimit !== undefined) update.folderLimit = folderLimit
  if (pasteLimit !== undefined) update.pasteLimit = pasteLimit
  if (collectionLimit !== undefined) update.collectionLimit = collectionLimit
  if (shareLimit !== undefined) update.shareLimit = shareLimit
  if (tokenLimit !== undefined) update.tokenLimit = tokenLimit

  const user = await prisma.user.update({
    where: {
      id
    },
    data: update
  })

  return user
}

export async function deleteUser(id: string) {
  // delete files from filesystem
  const files = await getFiles(id, true)
  files.map(async file => await remove(file.id))

  const user = await prisma.user.delete({
    where: {
      id
    }
  })

  return user
}

export async function getUsers() {
  const users = await prisma.user.findMany()

  return users
}

export async function authenticate({
  username,
  password
}: {
  username: string
  password: string
}) {
  const user = await prisma.user.findUnique({
    where: {
      username
    }
  })

  if (!user) return false

  if (!(await verifyPassword(password, user.hash))) return false

  return user
}
