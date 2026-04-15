import { Request, Response } from 'express'

import { idSchema, updateAdminUserSchema } from '#lib/schemas.js'
import { getStorageUsage } from '#lib/files.js'

import {
  deleteUser,
  filterAdminUser,
  getUserWithCounts,
  updateUser
} from '#lib/users.js'

/**
 * Get a user
 *
 * Get info about a specific user and their storage usage/limits. Requires an admin session token.
 */
export async function get(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.type !== 'admin') return res.sendStatus(403)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  const parsedParams = idSchema.safeParse(req.params)
  if (!parsedParams.success) return res.sendStatus(400)
  const { id } = parsedParams.data

  const user = await getUserWithCounts(id)
  if (!user) return res.sendStatus(404)

  return res.json(
    filterAdminUser({
      ...user,
      storage: await getStorageUsage(user.id)
    })
  )
}

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

  await updateUser({ id, ...parsed.data })

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
