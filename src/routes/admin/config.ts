import { Request, Response } from 'express'

import { getConfig, updateConfig } from '#lib/config.js'
import { updateConfigSchema } from '#lib/schemas.js'

export async function get(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.type !== 'admin') return res.sendStatus(403)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  const config = await getConfig()

  res.json(config)
}

export async function patch(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.type !== 'admin') return res.sendStatus(403)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  const parsed = updateConfigSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)

  await updateConfig(parsed.data)

  return res.sendStatus(204)
}
