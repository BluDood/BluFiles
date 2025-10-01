import prisma from './prisma.js'

export const filterShare = s => {
  if (!s) return null
  const share = {
    id: s.id,
    ownerId: s.ownerId,
    type: s.type,
    createdAt: s.createdAt,
    views: s.views
  }

  if (s.type === 'file' && s.file) {
    share.file = {
      id: s.file.id,
      name: s.file.name,
      size: s.file.size,
      mime: s.file.mimeType
    }
  } else if (s.type === 'folder' && s.folder) {
    share.folder = {
      id: s.folder.id,
      name: s.folder.name,
      fileCount: s.folder._count?.files || 0,
      folderCount: s.folder._count?.folders || 0
    }
  } else if (s.type === 'collection' && s.collection) {
    share.collection = {
      id: s.collection.id,
      name: s.collection.name,
      fileCount: s.collection._count?.files || 0
    }
  } else if (s.type === 'paste' && s.paste) {
    share.paste = {
      id: s.paste.id,
      name: s.paste.name,
      type: s.paste.type,
      content: s.paste.content
    }
  }

  return share
}

export async function getShares(userId) {
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

export async function createShare({ ownerId, type, id }) {
  const data = { ownerId, type }
  if (type === 'file') data.fileId = id
  if (type === 'folder') data.folderId = id
  if (type === 'collection') data.collectionId = id
  if (type === 'paste') data.pasteId = id
  const share = await prisma.share.create({
    data
  })

  return share
}

export async function deleteShare(id) {
  const share = await prisma.share.delete({
    where: {
      id
    }
  })

  return share
}

export async function getShare(id) {
  const share = await prisma.share.findUnique({
    where: {
      id
    },
    include: {
      file: true,
      folder: true,
      collection: true
    }
  })

  return share
}
