import { getType, hashFile, remove, write } from '#lib/filesystem.js'
import prisma, { File, Folder } from '#lib/prisma.js'

interface FilteredFile {
  id: string
  name: string
  mime: string
  size: number
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
    size: f.size,
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

export async function countFolders(ownerId: string | null) {
  return prisma.folder.count({
    where: ownerId ? { ownerId } : undefined
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
  if (parentId) update.parentId = parentId

  const folder = await prisma.folder.update({
    where: { id },
    data: update
  })

  return folder
}

export async function countFiles(ownerId: string | null) {
  return prisma.file.count({
    where: ownerId ? { ownerId } : undefined
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
  data
}: {
  name: string
  folderId?: string
  ownerId: string
  data: Buffer
}) {
  const fileHash = await hashFile(data)
  const mime = (await getType(data))?.mime || 'unknown'
  const size = data.byteLength

  const file = await prisma.file.create({
    data: {
      name,
      folderId,
      ownerId,
      hash: fileHash,
      mime,
      size
    }
  })

  await write(file.id, data)

  return file
}

export async function deleteFile(id: string) {
  const file = await prisma.file.delete({
    where: { id }
  })

  await remove(id)

  return file
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
