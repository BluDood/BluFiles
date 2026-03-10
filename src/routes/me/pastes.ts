import { deleteUserPastes } from '#lib/paste.js'
import { Request, Response } from 'express'

/**
 * Delete all pastes
 *
 * Permanently deletes all pastes owned by the authenticated user.
 */
export async function del(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  await deleteUserPastes(req.user.id)

  res.sendStatus(204)
}
