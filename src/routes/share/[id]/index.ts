import { Request, Response } from 'express'

import {
  deleteShare,
  filterShare,
  getShare,
  getShareCredentials,
  incrementShareViews,
  updateShare
} from '#lib/shares.js'

import { idSchema, updateShareSchema } from '#lib/schemas.js'
import { verifyPassword } from '#lib/utils.js'

/**
 * Get share
 *
 * Returns share metadata and increments the view counter. Publicly accessible.
 */
export async function get(req: Request, res: Response) {
  const parsedParams = idSchema.safeParse(req.params)
  if (!parsedParams.success) return res.sendStatus(400)
  const { id } = parsedParams.data

  const shareCredentials = getShareCredentials(req)

  const share = await getShare(id)
  if (!share) return res.sendStatus(404)
  if (share.ownerId !== req.user?.id) {
    if (share.passwordHash) {
      if (!shareCredentials.password) return res.sendStatus(401)
      if (
        !(await verifyPassword(shareCredentials.password, share.passwordHash))
      )
        return res.sendStatus(401)
    }

    const newCount = await incrementShareViews(id)

    share.views = newCount
  }

  return res.json(filterShare(share))
}

/**
 * Update share
 *
 * Allows the owner of a share to update its password.
 */
export async function patch(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const parsedParams = idSchema.safeParse(req.params)
  if (!parsedParams.success) return res.sendStatus(400)
  const { id } = parsedParams.data

  const parsedBody = updateShareSchema.safeParse(req.body)
  if (!parsedBody.success) return res.sendStatus(400)
  const { password } = parsedBody.data

  const share = await getShare(id)
  if (!share) return res.sendStatus(404)
  if (share.ownerId !== req.user.id) return res.sendStatus(404)

  await updateShare(id, {
    password: password
  })

  return res.sendStatus(204)
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
