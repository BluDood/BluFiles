import { Request, Response } from 'express'

import { filterFile, filterFolder, search } from '#lib/files.js'
import { searchSchema } from '#lib/schemas.js'

/**
 * Search files and folders
 *
 * Searches for files and folders using a query and optional folder ID
 */
export async function post(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const parsed = searchSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)
  const { query, folderId, recursive } = parsed.data

  const results = await search(query, req.user.id, recursive, folderId)
  res.json({
    files: results.files.map(filterFile),
    folders: results.folders.map(filterFolder)
  })
}
