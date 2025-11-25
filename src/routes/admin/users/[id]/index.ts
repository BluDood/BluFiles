import { Request, Response } from 'express'

import { updateAdminUserSchema } from '#lib/schemas.js'
import { deleteUser, updateUser } from '#lib/users.js'

export async function patch(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.type !== 'admin') return res.sendStatus(403)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  const { id } = req.params
  if (!id) return res.sendStatus(400)

  const parsed = updateAdminUserSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)
  const { type } = parsed.data

  await updateUser({ id, type })

  return res.sendStatus(204)
}

export async function del(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.type !== 'admin') return res.sendStatus(403)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  const { id } = req.params
  if (!id) return res.sendStatus(400)

  await deleteUser(id)

  return res.sendStatus(204)
}
