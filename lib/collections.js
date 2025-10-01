import { filterFile } from './files.js'
import prisma from './prisma.js'

export const filterCollection = c => {
  if (!c) return null
  const collection = {
    id: c.id,
    name: c.name,
    ownerId: c.ownerId,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt
  }

  if (c.files) collection.files = c.files.map(filterFile)
  if (c._count) collection.count = c._count.files

  if (c.share) collection.shareId = c.share.id

  return collection
}

export async function getCollections(userId) {
  const collections = await prisma.collection.findMany({
    where: {
      ownerId: userId
    },
    include: {
      _count: {
        select: {
          files: true
        }
      }
    }
  })

  return collections
}

export async function createCollection({ name, ownerId }) {
  const collection = await prisma.collection.create({
    data: {
      name,
      ownerId
    }
  })

  return collection
}

export async function deleteCollection(id) {
  const collection = await prisma.collection.delete({
    where: {
      id
    }
  })

  return collection
}

export async function updateCollection(id, { name, fileIds }) {
  const collection = await prisma.collection.update({
    where: {
      id
    },
    data: {
      name,
      files: {
        set: fileIds.map(id => ({ id }))
      }
    }
  })

  return collection
}

export async function getCollection(id) {
  const collection = await prisma.collection.findUnique({
    where: {
      id
    },
    include: {
      files: true,
      share: {
        select: { id: true }
      }
    }
  })

  return collection
}
