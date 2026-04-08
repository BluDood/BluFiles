import { Request, Response } from 'express'

import { genericShareSchema, idSchema, updateFileSchema } from '#lib/schemas.js'
import { deleteFile, filterFile, getFile, updateFile } from '#lib/files.js'
import { isValidShare } from '#lib/shares.js'

/**
 * Get file metadata
 *
 * Returns metadata for a file by ID. Accessible via a valid share link or as the owner.
 */
export async function get(req: Request, res: Response) {
  const parsedParams = idSchema.safeParse(req.params)
  if (!parsedParams.success) return res.sendStatus(400)
  const { id } = parsedParams.data

  const parsed = genericShareSchema.safeParse(req.query)
  if (!parsed.success) return res.sendStatus(400)
  const { shareId } = parsed.data

  const validShare = await isValidShare(shareId, 'file', id)
  if (!req.user && !validShare) return res.sendStatus(401)

  const file = await getFile(id)
  if (!file) return res.sendStatus(404)
  if (!validShare && file.ownerId !== req.user?.id) return res.sendStatus(404)

  return res.json(filterFile(file))
}

/**
 * Delete file
 *
 * Permanently deletes a file and its stored content.
 */
export async function del(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const parsedParams = idSchema.safeParse(req.params)
  if (!parsedParams.success) return res.sendStatus(400)
  const { id } = parsedParams.data

  const file = await getFile(id)
  if (!file) return res.sendStatus(404)
  if (file.ownerId !== req.user.id) return res.sendStatus(404)

  await deleteFile(id)
  return res.sendStatus(204)
}

/**
 * Update file metadata
 *
 * Updates the name or parent folder of a file.
 */
export async function patch(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const parsedParams = idSchema.safeParse(req.params)
  if (!parsedParams.success) return res.sendStatus(400)
  const { id } = parsedParams.data

  const parsed = updateFileSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)

  const file = await getFile(id)
  if (!file) return res.sendStatus(404)
  if (file.ownerId !== req.user.id) return res.sendStatus(404)
  await updateFile(id, parsed.data)
  return res.sendStatus(204)
}
