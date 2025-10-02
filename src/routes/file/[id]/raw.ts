import { Request, Response } from 'express'

import { getRawFileSchema } from '#lib/schemas.js'
import { getToken } from '#lib/tokens.js'
import { read } from '#lib/filesystem.js'
import { getFile } from '#lib/files.js'

export async function get(req: Request, res: Response) {
  const { id } = req.params
  if (!id) return res.sendStatus(400)
  let userId = req.user?.id

  if (!userId) {
    const parsed = getRawFileSchema.safeParse(req.query)
    if (!parsed.success) return res.sendStatus(400)
    const { token } = parsed.data

    const foundToken = await getToken({ token })
    if (!foundToken) return res.sendStatus(404)
    userId = foundToken.userId
  }

  const file = await getFile(id)
  if (!file) return res.sendStatus(404)
  if (file.ownerId !== userId) return res.sendStatus(404)
  const data = await read(file.id)
  if (!data) return res.sendStatus(404)

  res.setHeader('Content-Type', file.mime)
  res.setHeader('Content-Length', data.byteLength)

  return res.send(data)
}
