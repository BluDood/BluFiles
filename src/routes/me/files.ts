import { deleteUserFilesFolders } from '#lib/files.js'
import { Request, Response } from 'express'

export async function del(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  await deleteUserFilesFolders(req.user.id)

  res.sendStatus(204)
}
