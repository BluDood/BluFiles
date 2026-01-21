import { Request, Response } from 'express'

import { filterFile, getFiles } from '#lib/files.js'

export async function get(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  const files = await getFiles(req.user.id)

  return res.json(
    files
      .sort((a, b) => (b.size > a.size ? 1 : b.size < a.size ? -1 : 0))
      .map(filterFile)
      .slice(0, 10)
  )
}
