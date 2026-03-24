import prisma, { User } from '#lib/prisma.js'

import { hashPassword, verifyPassword } from '#lib/utils.js'
import { getFiles } from './files.js'
import { remove } from './filesystem.js'

interface FilteredAdminUser {
  id: string
  username: string
  type: 'user' | 'admin'
  usage?: number
}

export const filterAdminUser = (
  f: User | (User & { usage: number })
): FilteredAdminUser | null => {
  if (!f) return null
  const user: FilteredAdminUser = {
    id: f.id,
    username: f.username,
    type: f.type
  }

  if ('usage' in f && f.usage !== undefined) user.usage = f.usage

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

export async function updateUser({
  id,
  username,
  password,
  type
}: {
  id: string
  username?: string
  password?: string
  type?: 'user' | 'admin'
}) {
  const update: any = {}
  if (username) update.username = username
  if (password) update.hash = await hashPassword(password)

  if (type) update.type = type

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
