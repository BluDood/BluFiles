import { deleteUserCollections } from '#lib/collections.js'
import { Request, Response } from 'express'

/**
 * Delete all collections
 *
 * Permanently deletes all collections owned by the authenticated user.
 */
export async function del(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  await deleteUserCollections(req.user.id)

  res.sendStatus(204)
}
