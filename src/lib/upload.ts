import prisma, { FileUpload, FileUploadStatus } from '#lib/prisma.js'
import { append } from './filesystem.js'

interface FilteredFileUpload {
  id: string
  createdAt: Date
  updatedAt: Date
  currentBytes: string
  totalBytes: string
  status: FileUploadStatus
}

export const filterFileUpload = (u: FileUpload): FilteredFileUpload | null => {
  if (!u) return null
  const upload: FilteredFileUpload = {
    id: u.id,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    currentBytes: u.currentBytes.toString(),
    totalBytes: u.totalBytes.toString(),
    status: u.status
  }

  return upload
}

export async function getFileUpload(id: string) {
  const upload = await prisma.fileUpload.findUnique({
    where: { id }
  })

  return upload
}

export async function createFileUpload({
  totalBytes,
  ownerId
}: {
  totalBytes: number
  ownerId: string
}) {
  const upload = await prisma.fileUpload.create({
    data: {
      totalBytes,
      ownerId
    }
  })

  return upload
}

export async function deleteFileUpload(id: string) {
  const upload = await prisma.fileUpload.delete({
    where: { id }
  })

  return upload
}

export async function updateFileUpload(
  id: string,
  {
    currentBytes,
    status
  }: {
    currentBytes?: number
    status?: FileUploadStatus
  }
) {
  const update: any = {}
  if (currentBytes !== undefined) update.currentBytes = currentBytes
  if (status) update.status = status

  const file = await prisma.fileUpload.update({
    where: { id },
    data: update
  })

  return file
}

export async function pushFileUpload(id: string, data: Buffer) {
  await append(id, data, 'upload')

  let upload = await prisma.fileUpload.update({
    where: { id },
    data: {
      currentBytes: { increment: data.length }
    }
  })

  if (upload.currentBytes === upload.totalBytes) {
    upload = await prisma.fileUpload.update({
      where: { id },
      data: {
        status: 'completed'
      }
    })
  }

  return upload
}
