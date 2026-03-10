import { Request, Response } from 'express'

import { checkFileCreationAllowed } from '#lib/config.js'
import { createFileUploadSchema } from '#lib/schemas.js'
import { createFileUpload, filterFileUpload } from '#lib/upload.js'

/**
 * Start chunked upload
 *
 * Initialises a multi-part file upload session and returns an upload ID.
 * Use the upload ID to push data chunks, then finalise by creating a file.
 */
export async function post(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const parsed = createFileUploadSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)
  const { totalBytes } = parsed.data
  if (!(await checkFileCreationAllowed(req.user.id, totalBytes)))
    return res.sendStatus(403)

  const upload = await createFileUpload({
    totalBytes,
    ownerId: req.user.id
  })

  return res.json(filterFileUpload(upload))
}
