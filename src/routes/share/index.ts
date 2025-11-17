import { Request, Response } from 'express'

import { createShare, filterShare, getShares } from '#lib/shares.js'
import { checkShareCreationAllowed } from '#lib/config.js'
import { createShareSchema } from '#lib/schemas.js'

export async function get(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const shares = await getShares(req.user.id)

  return res.json(shares.map(filterShare))
}

export async function post(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (!(await checkShareCreationAllowed(req.user.id)))
    return res.sendStatus(403)

  const parsed = createShareSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)
  const { type, id } = parsed.data

  const share = await createShare({
    ownerId: req.user.id,
    type,
    id
  })

  return res.json(filterShare(share))
}
