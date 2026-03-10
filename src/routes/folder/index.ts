import { Request, Response } from 'express'

import { createFolder, filterFolder, getRootFolder } from '#lib/files.js'
import { checkFolderCreationAllowed } from '#lib/config.js'
import { createFolderSchema } from '#lib/schemas.js'

/**
 * Get root folder
 *
 * Returns the authenticated user's root folder.
 */
export async function get(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const folder = await getRootFolder(req.user.id)

  return res.json(filterFolder(folder))
}

/**
 * Create folder
 *
 * Create a new folder under an optional parent.
 */
export async function post(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (!(await checkFolderCreationAllowed(req.user.id)))
    return res.sendStatus(403)

  const parsed = createFolderSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)
  const { name, parentId } = parsed.data

  const folder = await createFolder({
    name,
    parentId,
    ownerId: req.user.id
  })

  return res.json(filterFolder(folder))
}
