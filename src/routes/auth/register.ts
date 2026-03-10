import { Request, Response } from 'express'

import { checkRegistrationAllowed } from '#lib/config.js'
import { createUser, userExists } from '#lib/users.js'
import { registerSchema } from '#lib/schemas.js'
import { createToken } from '#lib/tokens.js'
import { logger } from '#lib/utils.js'

/**
 * Register
 *
 * Creates a new user account and returns a session token. May be disabled by server configuration.
 */
export async function post(req: Request, res: Response) {
  if (!(await checkRegistrationAllowed())) return res.sendStatus(403)

  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)
  const { username, password } = parsed.data

  if (await userExists(username)) return res.sendStatus(409)

  const user = await createUser({ username, password })
  const token = await createToken({
    userId: user.id,
    userAgent: req.headers['user-agent']
  })

  logger.debug(`User registered: ${username} (ID: ${user.id})`)

  return res.json({
    token: token.token,
    user: {
      id: user.id,
      username: user.username
    }
  })
}
