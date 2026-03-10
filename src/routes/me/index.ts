import { Request, Response } from 'express'

import { deleteUser, updateUser } from '#lib/users.js'
import { updateUserSchema } from '#lib/schemas.js'

/**
 * Get current user
 *
 * Returns the authenticated user's ID, username, and role.
 */
export async function get(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  const { id, username, type } = req.user

  res.json({
    id,
    username,
    type
  })
}

/**
 * Update current user
 *
 * Updates the authenticated user's username.
 */
export async function patcH(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  const parsed = updateUserSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)
  const { username } = parsed.data

  const { id } = req.user

  if (!username) return res.sendStatus(400)

  await updateUser({ id, username })

  res.sendStatus(204)
}

/**
 * Delete current user
 *
 * Permanently deletes the authenticated user's account and all associated data.
 */
export async function del(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  await deleteUser(req.user.id)

  res.sendStatus(204)
}
