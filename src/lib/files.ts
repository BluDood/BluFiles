import prisma, { File, Folder } from '#lib/prisma.js'

import { moveUploadToFile, getType, hashFile, remove } from '#lib/filesystem.js'
import { deleteFileUpload, getFileUpload } from './upload.js'

interface FilteredFile {
  id: string
  name: string
  mime: string
  size: string
  ownerId: string
  folderId: string | null
  createdAt: Date
  updatedAt: Date
  shareId?: string
}

export const filterFile = (
  f: File | (File & { share: { id: string } })
): FilteredFile | null => {
  if (!f) return null
  const file: FilteredFile = {
    id: f.id,
    name: f.name,
    mime: f.mime,
    size: f.size.toString(),
    ownerId: f.ownerId,
    folderId: f.folderId,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt
  }

  if ('share' in f && f.share) file.shareId = f.share.id

  return file
}

interface FilteredFolder {
  id: string
  name: string
  ownerId: string
  parentId: string | null
  files?: FilteredFile[]
  folders?: FilteredFolder[]
  createdAt: Date
  updatedAt: Date
  shareId?: string
}

export const filterFolder = (
  f:
    | Folder
    | (Folder & { files: any[]; folders: any[]; share: { id: string } })
    | { name: string; files: any[]; folders: any[] }
    | null
): FilteredFolder | null => {
  if (!f) return null
  const folder: Partial<FilteredFolder> = {
    name: f.name
  }

  if ('id' in f) {
    folder.id = f.id
    folder.ownerId = f.ownerId
    folder.parentId = f.parentId
    folder.createdAt = f.createdAt
    folder.updatedAt = f.updatedAt
  }

  if ('files' in f)
    folder.files = f.files.map(filterFile).filter(f => f !== null)
  if ('folders' in f)
    folder.folders = f.folders.map(filterFolder).filter(f => f !== null)
  if ('share' in f && f.share) folder.shareId = f.share.id

  return folder as FilteredFolder
}

export async function countFolders(ownerId?: string) {
  return prisma.folder.count({
    where: { ownerId }
  })
}

export async function getRootFolder(ownerId: string) {
  const folders = await prisma.folder.findMany({
    where: { parentId: null, ownerId },
    include: { share: { select: { id: true } } }
  })

  const files = await prisma.file.findMany({
    where: { folderId: null, ownerId },
    include: { share: { select: { id: true } } }
  })

  return {
    name: 'Root',
    files,
    folders
  }
}

export async function getFolder(id: string) {
  const folder = await prisma.folder.findUnique({
    where: { id },
    include: {
      files: {
        include: { share: { select: { id: true } } }
      },
      folders: {
        include: { share: { select: { id: true } } }
      },
      share: {
        select: {
          id: true
        }
      }
    }
  })

  return folder
}

export async function createFolder({
  name,
  parentId,
  ownerId
}: {
  name: string
  parentId?: string
  ownerId: string
}) {
  const folder = await prisma.folder.create({
    data: { name, parentId, ownerId }
  })

  return folder
}

export async function getFolders(ownerId: string | null) {
  const folders = await prisma.folder.findMany({
    where: ownerId ? { ownerId } : undefined
  })

  return folders
}

export async function deleteFolder(id: string) {
  const files = await getFilesRecursive(id)

  for (const file of files) {
    await deleteFile(file.id)
  }

  const folder = await prisma.folder.delete({
    where: { id }
  })

  return folder
}

export async function updateFolder(
  id: string,
  {
    name,
    parentId
  }: {
    name?: string
    parentId?: string | null
  }
) {
  const update: any = {}
  if (name) update.name = name
  if (parentId !== undefined) update.parentId = parentId

  const folder = await prisma.folder.update({
    where: { id },
    data: update
  })

  return folder
}

export async function countFiles(ownerId?: string) {
  return prisma.file.count({
    where: { ownerId }
  })
}

export async function getFiles(ownerId: string | null, onlyIds = false) {
  const files = await prisma.file.findMany({
    where: ownerId ? { ownerId } : undefined,
    select: onlyIds ? { id: true } : undefined
  })

  return files
}

export async function getFile(id: string) {
  const file = await prisma.file.findUnique({
    where: { id },
    include: {
      share: {
        select: {
          id: true
        }
      }
    }
  })

  return file
}

export async function createFile({
  name,
  folderId,
  ownerId,
  uploadId
}: {
  name: string
  folderId?: string
  ownerId: string
  uploadId: string
}) {
  const upload = await getFileUpload(uploadId)
  if (!upload) return null

  if (upload.ownerId !== ownerId) return null

  const fileHash = await hashFile(upload.id, 'upload')
  const mime = await getType(upload.id, 'upload', upload.totalBytes)

  const file = await prisma.file.create({
    data: {
      name,
      folderId,
      ownerId,
      hash: fileHash,
      mime,
      size: upload.totalBytes
    }
  })

  await moveUploadToFile(upload.id, file.id)

  await deleteFileUpload(upload.id)

  return file
}

export async function deleteFile(id: string) {
  const file = await prisma.file.delete({
    where: { id }
  })

  await remove(id)

  return file
}

export async function deleteUserFilesFolders(ownerId: string) {
  const files = await getFiles(ownerId, true)

  for (const file of files) {
    await deleteFile(file.id)
  }

  await prisma.folder.deleteMany({
    where: { ownerId }
  })
}

export async function updateFile(
  id: string,
  {
    name,
    folderId
  }: {
    name?: string
    folderId?: string | null
  }
) {
  const update: any = {}
  if (name) update.name = name
  if (folderId !== undefined) update.folderId = folderId

  const file = await prisma.file.update({
    where: { id },
    data: update
  })

  return file
}

export async function getFilesRecursive(folderId: string) {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: {
      files: true,
      folders: true
    }
  })
  if (!folder) return []

  const files = folder.files

  for (const subFolder of folder.folders) {
    files.push(...(await getFilesRecursive(subFolder.id)))
  }

  return files
}

export async function getStorageUsage(ownerId?: string) {
  const files = await getFiles(ownerId || null)
  return files.reduce((acc, file) => acc + file.size, 0n).toString()
}

export async function search(
  query: string,
  ownerId: string,
  recursive = false,
  folderId?: string
) {
  const results: { files: File[]; folders: Folder[] } = {
    files: [],
    folders: []
  }

  if (recursive) {
    if (!folderId) {
      const [files, folders] = await Promise.all([
        prisma.file.findMany({
          where: {
            ownerId,
            name: { contains: query, mode: 'insensitive' }
          },
          include: { share: { select: { id: true } } }
        }),
        prisma.folder.findMany({
          where: {
            ownerId,
            name: { contains: query, mode: 'insensitive' }
          },
          include: { share: { select: { id: true } } }
        })
      ])
      results.files = files
      results.folders = folders
    } else {
      const recursiveFolderIds = await prisma.$queryRaw<{ id: string }[]>`
        WITH RECURSIVE tree AS (
          SELECT id FROM "Folder" WHERE id = ${folderId} AND "ownerId" = ${ownerId}
          UNION ALL
          SELECT f.id FROM "Folder" f JOIN tree t ON f."parentId" = t.id
        )
        SELECT id FROM tree
      `
      const folderIds = recursiveFolderIds.map(d => d.id)

      const [files, folders] = await Promise.all([
        prisma.file.findMany({
          where: {
            ownerId,
            folderId: { in: folderIds },
            name: { contains: query, mode: 'insensitive' }
          },
          include: { share: { select: { id: true } } }
        }),
        prisma.folder.findMany({
          where: {
            ownerId,
            id: { in: folderIds },
            name: { contains: query, mode: 'insensitive' }
          },
          include: { share: { select: { id: true } } }
        })
      ])
      results.files = files
      results.folders = folders
    }
  } else {
    const [files, folders] = await Promise.all([
      prisma.file.findMany({
        where: {
          ownerId,
          folderId: folderId || null,
          name: { contains: query, mode: 'insensitive' }
        },
        include: { share: { select: { id: true } } }
      }),
      prisma.folder.findMany({
        where: {
          ownerId,
          parentId: folderId || null,
          name: { contains: query, mode: 'insensitive' }
        },
        include: { share: { select: { id: true } } }
      })
    ])
    results.files = files
    results.folders = folders
  }

  function similarityRank(name: string): number {
    const n = name.toLowerCase()
    const q = query.toLowerCase()

    if (n === q) return 3
    if (n.startsWith(q)) return 2
    if (n.includes(q)) return 1

    return 0
  }

  return {
    files: results.files.sort(
      (a, b) => similarityRank(b.name) - similarityRank(a.name)
    ),
    folders: results.folders.sort(
      (a, b) => similarityRank(b.name) - similarityRank(a.name)
    )
  }
}
