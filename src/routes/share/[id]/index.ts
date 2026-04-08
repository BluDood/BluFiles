import { Request, Response } from 'express'

import {
  deleteShare,
  filterShare,
  getShare,
  incrementShareViews
} from '#lib/shares.js'

import { idSchema } from '#lib/schemas.js'

/**
 * Get share
 *
 * Returns share metadata and increments the view counter. Publicly accessible.
 */
export async function get(req: Request, res: Response) {
  const parsedParams = idSchema.safeParse(req.params)
  if (!parsedParams.success) return res.sendStatus(400)
  const { id } = parsedParams.data

  const share = await getShare(id)

  if (!share) return res.sendStatus(404)

  const newCount = await incrementShareViews(id)

  share.views = newCount

  return res.json(filterShare(share))
}

/**
 * Delete share
 *
 * Revokes a share link, making the shared resource inaccessible to anonymous users.
 */
export async function del(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const parsedParams = idSchema.safeParse(req.params)
  if (!parsedParams.success) return res.sendStatus(400)
  const { id } = parsedParams.data

  const share = await getShare(id)
  if (!share) return res.sendStatus(404)
  if (share.ownerId !== req.user.id) return res.sendStatus(404)

  await deleteShare(id)

  return res.sendStatus(204)
}
