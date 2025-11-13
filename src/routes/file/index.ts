import { Request, Response } from 'express'

import { checkFileCreationAllowed } from '#lib/config.js'
import { createFile, filterFile } from '#lib/files.js'
import { createFileSchema } from '#lib/schemas.js'
import { createShare } from '#lib/shares.js'

export async function post(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const parsed = createFileSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)
  const { name, folderId, data, share } = parsed.data
  if (!(await checkFileCreationAllowed(req.user.id, data.byteLength)))
    return res.sendStatus(403)

  const file = await createFile({
    name,
    folderId,
    ownerId: req.user.id,
    data
  })

  if (share) {
    const share = await createShare({
      ownerId: req.user.id,
      type: 'file',
      id: file.id
    })

    return res.json(
      filterFile({
        ...file,
        share
      })
    )
  } else {
    return res.json(filterFile(file))
  }
}
