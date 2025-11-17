import prisma from '#lib/prisma.js'

import { hashPassword, verifyPassword } from '#lib/utils.js'
import { getFiles } from './files.js'
import { remove } from './filesystem.js'

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
  const { salt, hash } = hashPassword(password)

  const user = await prisma.user.create({
    data: {
      username,
      salt,
      hash
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
  password
}: {
  id: string
  username?: string
  password?: string
}) {
  const update: any = {}
  if (username) update.username = username
  if (password) {
    const { salt, hash } = hashPassword(password)
    update.salt = salt
    update.hash = hash
  }

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

  const { salt, hash } = user

  if (!verifyPassword(password, salt, hash)) return false

  return user
}
