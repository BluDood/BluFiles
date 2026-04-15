import { Request, Response } from 'express'

import { createShare, filterShare, getShares } from '#lib/shares.js'
import { checkShareCreationAllowed } from '#lib/config.js'
import { createShareSchema } from '#lib/schemas.js'
import { getCollection } from '#lib/collections.js'
import { getFile, getFolder } from '#lib/files.js'
import { getPaste } from '#lib/paste.js'

/**
 * List shares
 *
 * Returns all share links owned by the authenticated user.
 */
export async function get(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const shares = await getShares(req.user.id)

  return res.json(shares.map(filterShare))
}

/**
 * Create share
 *
 * Creates a public share link for a file, folder, collection, or paste.
 */
export async function post(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (!(await checkShareCreationAllowed(req.user.id)))
    return res.sendStatus(403)

  const parsed = createShareSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)
  const { type, id, password } = parsed.data

  const getResource = {
    file: getFile,
    folder: getFolder,
    collection: getCollection,
    paste: getPaste
  }
  const resource = await getResource[type](id)
  if (!resource) return res.sendStatus(404)
  if (resource.ownerId !== req.user.id) return res.sendStatus(403)

  const share = await createShare({
    ownerId: req.user.id,
    type,
    id,
    password
  })

  return res.json(filterShare(share))
}
