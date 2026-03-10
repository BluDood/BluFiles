import { Request, Response } from 'express'

import { deletePaste, filterPaste, getPaste, updatePaste } from '#lib/paste.js'
import { updatePasteSchema } from '#lib/schemas.js'

/**
 * Get paste
 *
 * Returns a paste including its full content.
 */
export async function get(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const { id } = req.params
  const paste = await getPaste(id)

  if (!paste) return res.sendStatus(404)

  return res.json(filterPaste(paste, true))
}

/**
 * Update paste
 *
 * Updates the name, content, or syntax type of a paste.
 */
export async function patch(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const { id } = req.params

  const parsed = updatePasteSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)

  const paste = await getPaste(id)
  if (!paste) return res.sendStatus(404)
  if (paste.ownerId !== req.user.id) return res.sendStatus(404)

  const updated = await updatePaste(id, parsed.data)

  return res.json(filterPaste(updated, false))
}

/**
 * Delete paste
 *
 * Permanently deletes a paste.
 */
export async function del(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const { id } = req.params

  const paste = await getPaste(id)
  if (!paste) return res.sendStatus(404)
  if (paste.ownerId !== req.user.id) return res.sendStatus(404)

  await deletePaste(id)

  return res.sendStatus(204)
}
