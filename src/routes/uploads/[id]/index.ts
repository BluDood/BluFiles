import { Request, Response } from 'express'

import { pushFileUploadSchema } from '#lib/schemas.js'
import {
  deleteFileUpload,
  filterFileUpload,
  getFileUpload,
  pushFileUpload
} from '#lib/upload.js'

export async function post(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const { id } = req.params
  if (!id) return res.sendStatus(400)

  const upload = await getFileUpload(id)
  if (!upload) return res.sendStatus(404)

  const parsed = pushFileUploadSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)
  const data = parsed.data

  if (upload.status === 'completed') return res.sendStatus(400)
  if (upload.currentBytes + BigInt(data.byteLength) > upload.totalBytes)
    return res.sendStatus(400)

  const updated = await pushFileUpload(id, data)

  return res.json(filterFileUpload(updated))
}

export async function del(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const { id } = req.params
  if (!id) return res.sendStatus(400)

  const upload = await getFileUpload(id)
  if (!upload) return res.sendStatus(404)

  await deleteFileUpload(id)

  return res.sendStatus(204)
}
