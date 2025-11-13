import { Request, Response } from 'express'

import { createPaste, filterPaste, getPastes } from '#lib/paste.js'
import { checkPasteCreationAllowed } from '#lib/config.js'
import { createPasteSchema } from '#lib/schemas.js'
import { createShare } from '#lib/shares.js'

export async function get(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const pastes = await getPastes(req.user.id)

  return res.json(pastes.map(p => filterPaste(p, false)))
}

export async function post(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (!(await checkPasteCreationAllowed(req.user.id)))
    return res.sendStatus(403)

  const parsed = createPasteSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)
  const { name, content, type, share } = parsed.data

  const paste = await createPaste({
    name,
    content,
    type,
    ownerId: req.user.id
  })

  if (share) {
    const share = await createShare({
      ownerId: req.user.id,
      type: 'paste',
      id: paste.id
    })

    return res.json(
      filterPaste(
        {
          ...paste,
          share
        },
        false
      )
    )
  } else {
    return res.json(filterPaste(paste, false))
  }
}
