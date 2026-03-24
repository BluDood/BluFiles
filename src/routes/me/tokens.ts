import { Request, Response } from 'express'

import {
  createToken,
  deleteToken,
  deleteTokens,
  filterToken,
  getToken,
  getTokens,
  regenerateToken
} from '#lib/tokens.js'

import {
  createTokenSchema,
  deleteTokenSchema,
  regenerateTokenSchema
} from '#lib/schemas.js'
import { checkTokenCreationAllowed } from '#lib/config.js'

/**
 * List API tokens
 *
 * Returns all API tokens for the authenticated user, sorted with the current token first.
 */
export async function get(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  const tokens = await getTokens(req.user.id)

  res.json(
    tokens
      .map(token => {
        if (token.hash === req.user!.token.hash)
          return {
            ...token,
            me: true
          }
        else return token
      })
      .map(filterToken)
      .sort((a, b) => {
        const bTime = b.usedAt ? b.usedAt.getTime() : Number.MAX_SAFE_INTEGER
        const aTime = a.usedAt ? a.usedAt.getTime() : Number.MAX_SAFE_INTEGER
        return bTime - aTime
      })
      .sort(a => (a.me ? -1 : 1))
  )
}

/**
 * Create API token
 *
 * Creates a new named uploader API token for programmatic access.
 */
export async function post(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.token.type !== 'user') return res.sendStatus(418)
  if (!(await checkTokenCreationAllowed(req.user.id)))
    return res.sendStatus(403)

  const parsed = createTokenSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)
  const { name } = parsed.data

  const token = await createToken({
    userId: req.user.id,
    type: 'uploader',
    name: name
  })

  return res.json({ ...filterToken(token), token: token.token })
}

/**
 * Regenerate API token
 *
 * Regenerates a token by ID. Only applicable to uploader tokens.
 */
export async function patch(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  const parsed = regenerateTokenSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)
  const { id } = parsed.data

  const token = await getToken({ id })
  if (!token) return res.sendStatus(404)
  if (token.userId !== req.user.id) return res.sendStatus(404)
  if (token.type !== 'uploader') return res.sendStatus(400)

  const newToken = await regenerateToken(id)

  return res.json({ ...filterToken(newToken), token: newToken.token })
}

/**
 * Delete API token(s)
 *
 * Deletes a specific token by ID, all tokens, or all tokens except the current session.
 */
export async function del(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  const parsed = deleteTokenSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)
  const { id } = parsed.data

  if (id === 'all') {
    await deleteTokens(req.user.id)

    res.sendStatus(204)
  } else if (id === 'except') {
    await deleteTokens(req.user.id, [req.user.token.hash])

    res.sendStatus(204)
  } else {
    const token = await getToken({ id })
    if (!token) return res.sendStatus(404)
    if (token.userId !== req.user.id) return res.sendStatus(404)

    await deleteToken({ id })

    res.sendStatus(204)
  }
}
