import { Request, Response } from 'express'

import { createFile, filterFile } from '#lib/files.js'
import { createFileSchema } from '#lib/schemas.js'
import { createShare } from '#lib/shares.js'

export async function post(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const parsed = createFileSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)
  const { name, folderId, uploadId, share } = parsed.data

  const file = await createFile({
    name,
    folderId,
    ownerId: req.user.id,
    uploadId
  })
  if (!file) return res.sendStatus(400)

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
