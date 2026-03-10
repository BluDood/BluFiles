import { Request, Response } from 'express'

import {
  deleteFolder,
  filterFolder,
  getFolder,
  updateFolder
} from '#lib/files.js'

import { genericShareSchema, updateFolderSchema } from '#lib/schemas.js'
import { isValidShare } from '#lib/shares.js'

/**
 * Get folder
 *
 * Returns a folder and its contents by ID. Accessible via a valid share link or as the owner.
 */
export async function get(req: Request, res: Response) {
  const parsed = genericShareSchema.safeParse(req.query)
  if (!parsed.success) return res.sendStatus(400)
  const { shareId } = parsed.data

  const { id } = req.params
  if (!id) return res.sendStatus(400)

  const validShare = await isValidShare(shareId, 'folder', id)

  if (!req.user && !validShare) return res.sendStatus(401)

  const folder = await getFolder(id)
  if (!folder) return res.sendStatus(404)
  if (!validShare && folder.ownerId !== req.user?.id) return res.sendStatus(404)

  return res.json(filterFolder(folder))
}

/**
 * Delete folder
 *
 * Permanently deletes a folder and all files inside it.
 */
export async function del(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const { id } = req.params
  if (!id) return res.sendStatus(400)

  const folder = await getFolder(id)
  if (!folder) return res.sendStatus(404)
  if (folder.ownerId !== req.user.id) return res.sendStatus(404)

  await deleteFolder(id)
  return res.sendStatus(204)
}

/**
 * Update folder
 *
 * Updates the name or parent folder of an existing folder.
 */
export async function patch(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const { id } = req.params
  if (!id) return res.sendStatus(400)

  const parsed = updateFolderSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)

  const folder = await getFolder(id)
  if (!folder) return res.sendStatus(404)
  if (folder.ownerId !== req.user.id) return res.sendStatus(404)

  await updateFolder(id, parsed.data)
  return res.sendStatus(204)
}
