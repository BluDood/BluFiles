import { Request, Response } from 'express'

import { deletePaste, filterPaste, getPaste, updatePaste } from '#lib/paste.js'
import { updatePasteSchema } from '#lib/schemas.js'

export async function get(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const { id } = req.params
  const paste = await getPaste(id)

  if (!paste) return res.sendStatus(404)

  return res.json(filterPaste(paste, true))
}

export async function patch(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const { id } = req.params

  const parsed = updatePasteSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)

  const paste = await getPaste(id)
  if (!paste) return res.sendStatus(404)
  if (paste.ownerId !== req.user.id) return res.sendStatus(404)

  await updatePaste(id, parsed.data)

  return res.sendStatus(204)
}

export async function del(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const { id } = req.params

  const paste = await getPaste(id)
  if (!paste) return res.sendStatus(404)
  if (paste.ownerId !== req.user.id) return res.sendStatus(404)

  await deletePaste(id)

  return res.sendStatus(204)
}
