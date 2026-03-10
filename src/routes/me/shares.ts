import { deleteUserShares } from '#lib/shares.js'
import { Request, Response } from 'express'

/**
 * Delete all shares
 *
 * Permanently deletes all share links owned by the authenticated user.
 */
export async function del(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  await deleteUserShares(req.user.id)

  res.sendStatus(204)
}
