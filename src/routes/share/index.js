import { createShareSchema } from '../../lib/schemas.js'
import { createShare, filterShare, getShares } from '../../lib/shares.js'

export async function get(req, res) {
  if (!req.user) return res.sendStatus(401)

  const shares = await getShares(req.user.id)

  return res.json(shares.map(filterShare))
}

export async function post(req, res) {
  if (!req.user) return res.sendStatus(401)

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
