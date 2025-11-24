import { Request, Response } from 'express'

import { authenticate, updateUser } from '#lib/users.js'
import { updatePasswordSchema } from '#lib/schemas.js'

export async function patch(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  const parsed = updatePasswordSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)
  const { currentPassword, newPassword } = parsed.data

  const { id, username } = req.user

  if (!(await authenticate({ username, password: currentPassword })))
    return res.sendStatus(401)

  if (currentPassword === newPassword) return res.sendStatus(409)

  await updateUser({ id, password: newPassword })

  res.sendStatus(204)
}
