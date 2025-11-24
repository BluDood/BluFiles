import { getUsers } from '#lib/users.js'
import { Request, Response } from 'express'

export async function get(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.type !== 'admin') return res.sendStatus(403)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  const users = await getUsers()

  res.json(users)
}
