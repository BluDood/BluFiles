import { updateUser } from '../../lib/users.js'

export async function get(req, res) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  const { id, username } = req.user

  res.json({
    id,
    username
  })
}

export async function patcH(req, res) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  const { id } = req.user
  const { username } = req.body

  if (!username) return res.sendStatus(400)

  await updateUser({ id, username })

  res.sendStatus(204)
}
