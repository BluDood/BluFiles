import prisma from '#lib/prisma.js'

import { getAllFiles, remove } from '#lib/filesystem.js'
import { logger } from '#lib/utils.js'

export const name = 'Purge Unassociated Files'

export const interval = '0 0 * * *'

export const runImmediately = true

export async function execute() {
  const dbFiles = await prisma.file.findMany()
  const fsFiles = await getAllFiles()

  const unassociatedEntries = dbFiles.filter(file => !fsFiles.includes(file.id))
  const unassociatedFiles = fsFiles.filter(
    fsFile => !dbFiles.some(dbFile => dbFile.id === fsFile)
  )

  if (unassociatedEntries.length > 0) {
    logger.info(
      `Deleting ${unassociatedEntries.length} unassociated entries from the database.`
    )

    for (const file of unassociatedEntries) {
      await prisma.file.delete({ where: { id: file.id } })
    }
  }

  if (unassociatedFiles.length > 0) {
    logger.info(
      `Deleting ${unassociatedFiles.length} unassociated files from the filesystem.`
    )

    for (const fileId of unassociatedFiles) {
      await remove(fileId)
    }
  }

  return { status: 'success' }
}
