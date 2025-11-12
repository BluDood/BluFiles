import { Request, Response } from 'express'

import {
  deleteShare,
  filterShare,
  getShare,
  incrementShareViews
} from '#lib/shares.js'

export async function get(req: Request, res: Response) {
  const { id } = req.params
  const share = await getShare(id)

  if (!share) return res.sendStatus(404)

  const newCount = await incrementShareViews(id)

  share.views = newCount

  return res.json(filterShare(share))
}

export async function del(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const { id } = req.params

  const share = await getShare(id)
  if (!share) return res.sendStatus(404)
  if (share.ownerId !== req.user.id) return res.sendStatus(404)

  await deleteShare(id)

  return res.sendStatus(204)
}
