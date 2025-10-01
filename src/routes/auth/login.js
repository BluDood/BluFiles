import { loginSchema } from '../../lib/schemas.js'
import { createToken } from '../../lib/tokens.js'
import { authenticate } from '../../lib/users.js'

export async function post(req, res) {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)
  const { username, password } = parsed.data

  const user = await authenticate({ username, password })

  if (!user) return res.sendStatus(401)

  const token = await createToken({
    userId: user.id,
    userAgent: req.headers['user-agent']
  })

  return res.json({
    token: token.token,
    user: {
      id: user.id,
      username: user.username
    }
  })
}
