import prisma, { Collection } from '#lib/prisma.js'
import { filterFile } from '#lib/files.js'

interface FilteredCollection {
  id: string
  name: string
  ownerId: string
  createdAt: Date
  updatedAt: Date
  files?: ReturnType<typeof filterFile>[]
  count?: number
  shareId?: string
}

export const filterCollection = (
  c:
    | Collection
    | (Collection & {
        files: any[]
        _count: { files: number }
        share: { id: string }
      })
): FilteredCollection | null => {
  if (!c) return null
  const collection: FilteredCollection = {
    id: c.id,
    name: c.name,
    ownerId: c.ownerId,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt
  }

  if ('files' in c) collection.files = c.files.map(filterFile)
  if ('_count' in c) collection.count = c._count.files

  if ('share' in c && c.share) collection.shareId = c.share.id

  return collection
}

export async function getCollections(userId: string) {
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

export async function createCollection({
  name,
  ownerId
}: {
  name: string
  ownerId: string
}) {
  const collection = await prisma.collection.create({
    data: {
      name,
      ownerId
    }
  })

  return collection
}

export async function deleteCollection(id: string) {
  const collection = await prisma.collection.delete({
    where: {
      id
    }
  })

  return collection
}

export async function updateCollection(
  id: string,
  { name, fileIds }: { name?: string; fileIds?: string[] }
) {
  const update: any = {}
  if (name) update.name = name
  if (fileIds) update.files = { set: fileIds.map(id => ({ id })) }
  const collection = await prisma.collection.update({
    where: {
      id
    },
    data: update
  })

  return collection
}

export async function getCollection(id: string) {
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
