import prisma, { Share } from '#lib/prisma.js'

interface FilteredShare {
  id: string
  ownerId: string
  type: 'file' | 'folder' | 'collection' | 'paste'
  createdAt: Date
  views: number
  owner?: {
    id: string
    username: string
  }
  file?: {
    id: string
    name: string
    size: number
    mime: string
  }
  folder?: {
    id: string
    name: string
    fileCount: number
    folderCount: number
  }
  collection?: {
    id: string
    name: string
    fileCount: number
  }
  paste?: {
    id: string
    name: string
    type: string
    content: string
  }
}

export const filterShare = (
  s:
    | Share
    | (Share & {
        file?: { id: string; name: string; size: number; mime: string }
        folder?: {
          id: string
          name: string
          _count?: { files: number; folders: number }
        }
        collection?: {
          id: string
          name: string
          _count?: { files: number }
        }
        paste?: { id: string; name: string; type: string; content: string }
        owner?: {
          id: string
          username: string
        }
      })
) => {
  if (!s) return null
  const share: FilteredShare = {
    id: s.id,
    ownerId: s.ownerId,
    type: s.type,
    createdAt: s.createdAt,
    views: s.views
  }

  if ('owner' in s && s.owner) {
    share['owner'] = {
      id: s.owner.id,
      username: s.owner.username
    }
  }

  if (s.type === 'file' && 'file' in s && s.file) {
    share.file = {
      id: s.file.id,
      name: s.file.name,
      size: s.file.size,
      mime: s.file.mime
    }
  } else if (s.type === 'folder' && 'folder' in s && s.folder) {
    share.folder = {
      id: s.folder.id,
      name: s.folder.name,
      fileCount: s.folder._count?.files || 0,
      folderCount: s.folder._count?.folders || 0
    }
  } else if (s.type === 'collection' && 'collection' in s && s.collection) {
    share.collection = {
      id: s.collection.id,
      name: s.collection.name,
      fileCount: s.collection._count?.files || 0
    }
  } else if (s.type === 'paste' && 'paste' in s && s.paste) {
    share.paste = {
      id: s.paste.id,
      name: s.paste.name,
      type: s.paste.type,
      content: s.paste.content
    }
  }

  return share
}

export async function getShares(userId: string) {
  const shares = await prisma.share.findMany({
    where: {
      ownerId: userId
    },
    include: {
      file: {
        select: {
          id: true,
          name: true,
          size: true,
          mime: true
        }
      },
      folder: {
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              files: true,
              folders: true
            }
          }
        }
      },
      collection: {
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              files: true
            }
          }
        }
      },
      paste: {
        select: {
          id: true,
          name: true,
          type: true,
          content: true
        }
      }
    }
  })

  return shares
}

export async function countShares(ownerId?: string) {
  const count = await prisma.share.count({
    where: {
      ownerId
    }
  })
  return count
}

export async function createShare({
  ownerId,
  type,
  id
}: {
  ownerId: string
  type: 'file' | 'folder' | 'collection' | 'paste'
  id: string
}) {
  const data: any = { ownerId, type }
  if (type === 'file') data.fileId = id
  if (type === 'folder') data.folderId = id
  if (type === 'collection') data.collectionId = id
  if (type === 'paste') data.pasteId = id
  const share = await prisma.share.create({
    data
  })

  return share
}

export async function deleteShare(id: string) {
  const share = await prisma.share.delete({
    where: {
      id
    }
  })

  return share
}

export async function deleteUserShares(ownerId: string) {
  await prisma.share.deleteMany({
    where: {
      ownerId
    }
  })
}

export async function getShare(id: string) {
  const share = await prisma.share.findUnique({
    where: {
      id
    },
    include: {
      file: true,
      folder: {
        include: {
          _count: {
            select: {
              files: true,
              folders: true
            }
          }
        }
      },
      collection: true,
      paste: true,
      owner: {
        select: {
          id: true,
          username: true
        }
      }
    }
  })

  return share
}

export async function incrementShareViews(id: string) {
  const share = await prisma.share.update({
    where: {
      id
    },
    data: {
      views: {
        increment: 1
      }
    }
  })

  return share.views
}

export async function isFolderShared(folderId: string, shareId: string) {
  const share = await prisma.share.findFirst({
    where: {
      id: shareId
    }
  })
  if (!share || share.type !== 'folder') return false
  if (share.folderId === folderId) return true
  let folder = await prisma.folder.findUnique({
    where: {
      id: folderId
    }
  })
  while (folder) {
    if (folder.id === share.folderId) return true
    if (!folder.parentId) break
    folder = await prisma.folder.findUnique({
      where: {
        id: folder.parentId
      }
    })
  }
  return false
}

export async function isFileInFolderShared(fileId: string, shareId: string) {
  const share = await prisma.share.findFirst({
    where: {
      id: shareId
    }
  })
  if (!share || share.type !== 'folder') return false
  const file = await prisma.file.findUnique({
    where: {
      id: fileId
    }
  })
  if (!file || !file.folderId) return false
  if (file.folderId === share.folderId) return true
  let folder = await prisma.folder.findUnique({
    where: {
      id: file.folderId
    }
  })
  while (folder) {
    if (folder.id === share.folderId) return true
    if (!folder.parentId) break
    folder = await prisma.folder.findUnique({
      where: {
        id: folder.parentId
      }
    })
  }
  return false
}

export async function isFileInCollectionShared(
  fileId: string,
  shareId: string
) {
  const share = await prisma.share.findFirst({
    where: {
      id: shareId
    }
  })
  if (!share || share.type !== 'collection') return false
  const collection = await prisma.collection.findUnique({
    where: {
      id: share.collectionId!
    },
    include: {
      files: {
        where: {
          id: fileId
        }
      }
    }
  })
  if (!collection) return false
  return collection.files.length > 0
}
