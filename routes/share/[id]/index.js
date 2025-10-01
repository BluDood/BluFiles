import { deleteShare, filterShare, getShare } from '../../../lib/shares.js'

export async function get(req, res) {
  if (!req.user) return res.sendStatus(401)

  const { id } = req.params
  const share = await getShare(id)

  if (!share) return res.sendStatus(404)

  return res.json(filterShare(share))
}

export async function del(req, res) {
  if (!req.user) return res.sendStatus(401)

  const { id } = req.params

  const share = await getShare(id)
  if (!share) return res.sendStatus(404)
  if (share.ownerId !== req.user.id) return res.sendStatus(404)

  await deleteShare(id)

  return res.sendStatus(204)
}
