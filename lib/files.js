import { getType, hashFile, remove, write } from './filesystem.js'
import prisma from './prisma.js'

export const filterFile = f => {
  if (!f) return null
  const file = {
    id: f.id,
    name: f.name,
    mime: f.mime,
    size: f.size,
    ownerId: f.ownerId,
    folderId: f.folderId,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt
  }

  if (f.share) file.shareId = f.share.id

  return file
}

export const filterFolder = f => {
  if (!f) return null
  const folder = {
    id: f.id,
    name: f.name,
    ownerId: f.ownerId,
    parentId: f.parentId,
    files: f.files?.map(filterFile),
    folders: f.folders?.map(filterFolder),
    createdAt: f.createdAt,
    updatedAt: f.updatedAt
  }

  if (f.share) folder.shareId = f.share.id

  return folder
}

export async function countFolders(ownerId) {
  return prisma.folder.count({
    where: ownerId ? { ownerId } : undefined
  })
}

export async function getRootFolder(ownerId) {
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

export async function getFolder(id) {
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

export async function createFolder({ name, parentId, ownerId }) {
  const folder = await prisma.folder.create({
    data: { name, parentId, ownerId }
  })

  return folder
}

export async function getFolders(ownerId) {
  const folders = await prisma.folder.findMany({
    where: ownerId ? { ownerId } : undefined
  })

  return folders
}

export async function deleteFolder(id) {
  const files = await getFilesRecursive(id)

  for (const file of files) {
    await deleteFile(file.id)
  }

  const folder = await prisma.folder.delete({
    where: { id }
  })

  return folder
}

export async function updateFolder(id, { name, parentId }) {
  const folder = await prisma.folder.update({
    where: { id },
    data: { name, parentId }
  })

  return folder
}

export async function countFiles(ownerId) {
  return prisma.file.count({
    where: ownerId ? { ownerId } : undefined
  })
}

export async function getFiles(ownerId, onlyIds = false) {
  const files = await prisma.file.findMany({
    where: ownerId ? { ownerId } : undefined,
    select: onlyIds ? { id: true } : undefined
  })

  return files
}

export async function getFile(id) {
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

export async function createFile({ name, folderId, ownerId, data }) {
  const fileHash = (await hashFile(data)).toString('hex')
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

export async function deleteFile(id) {
  const file = await prisma.file.delete({
    where: { id }
  })

  await remove(id)

  return file
}

export async function updateFile(id, { name, folderId }) {
  const file = await prisma.file.update({
    where: { id },
    data: {
      name,
      folderId
    }
  })

  return file
}

export async function getFilesRecursive(folderId) {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: {
      files: true,
      folders: true
    }
  })

  const files = folder.files

  for (const subFolder of folder.folders) {
    files.push(...(await getFilesRecursive(subFolder.id)))
  }

  return files
}
