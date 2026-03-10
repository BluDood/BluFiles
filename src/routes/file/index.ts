import { Request, Response } from 'express'

import { createFileUpload, pushFileUpload } from '#lib/upload.js'
import { createFile, filterFile } from '#lib/files.js'
import { createFileSchema } from '#lib/schemas.js'
import { createShare } from '#lib/shares.js'

/**
 * Upload file
 *
 * Creates a new file record. Supply either an `uploadId` from a completed chunked upload
 * or raw `data` bytes for small files. Optionally creates a share link in the same request.
 */
export async function post(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const parsed = createFileSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)
  const { name, folderId, share } = parsed.data

  let uploadId: string | null = null
  if ('uploadId' in parsed.data) {
    uploadId = parsed.data.uploadId
  } else {
    const data = parsed.data.data
    const upload = await createFileUpload({
      ownerId: req.user.id,
      totalBytes: data.length
    })

    await pushFileUpload(upload.id, data)
    uploadId = upload.id
  }

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
