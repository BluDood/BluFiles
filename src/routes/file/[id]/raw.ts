import { Request, Response } from 'express'

import { genericShareSchema } from '#lib/schemas.js'
import { isValidShare } from '#lib/shares.js'
import { read } from '#lib/filesystem.js'
import { getFile } from '#lib/files.js'

export async function get(req: Request, res: Response) {
  const { id } = req.params
  if (!id) return res.sendStatus(400)

  const parsed = genericShareSchema.safeParse(req.query)
  if (!parsed.success) return res.sendStatus(400)
  const { shareId } = parsed.data

  const validShare = await isValidShare(shareId, 'file', id)
  if (!req.user && !validShare) return res.sendStatus(401)

  const file = await getFile(id)
  if (!file) return res.sendStatus(404)
  if (!validShare && file.ownerId !== req.user?.id) return res.sendStatus(404)

  const data = await read(file.id)
  if (!data) return res.sendStatus(404)

  res.setHeader('Content-Type', file.mime)
  res.setHeader('Content-Length', data.byteLength)

  return res.send(data)
}
