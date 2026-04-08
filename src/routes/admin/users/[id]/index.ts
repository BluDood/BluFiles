import { Request, Response } from 'express'

import { idSchema, updateAdminUserSchema } from '#lib/schemas.js'
import { deleteUser, updateUser } from '#lib/users.js'

/**
 * Update a user
 *
 * Updates the role of a specific user. Requires an admin session token.
 */
export async function patch(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.type !== 'admin') return res.sendStatus(403)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  const parsedParams = idSchema.safeParse(req.params)
  if (!parsedParams.success) return res.sendStatus(400)
  const { id } = parsedParams.data

  const parsed = updateAdminUserSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)
  const { type } = parsed.data

  await updateUser({ id, type })

  return res.sendStatus(204)
}

/**
 * Delete a user
 *
 * Permanently deletes a user account and all associated data. Requires an admin session token.
 */
export async function del(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.type !== 'admin') return res.sendStatus(403)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  const parsedParams = idSchema.safeParse(req.params)
  if (!parsedParams.success) return res.sendStatus(400)
  const { id } = parsedParams.data

  await deleteUser(id)

  return res.sendStatus(204)
}
