import prisma from '#lib/prisma.js'

import { deleteFileUpload } from '#lib/upload.js'
import { logger } from '#lib/utils.js'

export const name = 'Purge Unfinished Downloads'

export const interval = '0 * * * *'

export const runImmediately = true

export async function execute() {
  const uploads = await prisma.fileUpload.findMany({
    where: {
      updatedAt: {
        lt: new Date(Date.now() - 60 * 60 * 1000)
      }
    }
  })

  if (uploads.length === 0) return { status: 'success' }

  logger.info(
    `Purging ${uploads.length} unfinished downloads`,
    'Purge Unfinished Downloads'
  )

  for (const upload of uploads) {
    await deleteFileUpload(upload.id)
  }

  return { status: 'success' }
}
