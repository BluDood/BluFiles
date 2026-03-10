import { Request, Response } from 'express'

import {
  createUser,
  filterAdminUser,
  getUsers,
  userExists
} from '#lib/users.js'
import { checkUserCreationAllowed } from '#lib/config.js'
import { createUserSchema } from '#lib/schemas.js'
import { getStorageUsage } from '#lib/files.js'

/**
 * List all users
 *
 * Returns all registered users including their storage usage. Requires an admin session token.
 */
export async function get(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.type !== 'admin') return res.sendStatus(403)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  const users = await getUsers()

  const withUsage = await Promise.all(
    users.map(async u => ({
      ...u,
      usage: await getStorageUsage(u.id)
    }))
  )

  res.json(withUsage.map(filterAdminUser))
}

/**
 * Create a user
 *
 * Creates a new user account. Requires an admin session token.
 */
export async function post(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.type !== 'admin') return res.sendStatus(403)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  const parsed = createUserSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)
  const { username, password } = parsed.data

  if (!(await checkUserCreationAllowed())) return res.sendStatus(403)

  if (await userExists(username)) return res.sendStatus(409)

  await createUser({ username, password })

  return res.sendStatus(201)
}
