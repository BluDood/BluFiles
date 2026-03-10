import { Request, Response } from 'express'

import { deleteToken } from '#lib/tokens.js'

/**
 * Log out
 *
 * Invalidates the current session token.
 */
export async function post(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  await deleteToken({ id: req.user.token.id })

  return res.sendStatus(204)
}
