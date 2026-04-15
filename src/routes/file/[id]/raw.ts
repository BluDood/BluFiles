import { Request, Response } from 'express'

import { getShareCredentials, isValidShare } from '#lib/shares.js'
import { getRawFileSchema, idSchema } from '#lib/schemas.js'
import { getReadStream } from '#lib/filesystem.js'
import { getFile } from '#lib/files.js'

/**
 * Download file
 *
 * Streams the raw file content with the appropriate Content-Type header.
 * Accessible via a valid share link or as the owner.
 */
export async function get(req: Request, res: Response) {
  const parsedParams = idSchema.safeParse(req.params)
  if (!parsedParams.success) return res.sendStatus(400)
  const { id } = parsedParams.data

  const shareCredentials = getShareCredentials(req)

  const parsedQuery = getRawFileSchema.safeParse(req.query)
  if (!parsedQuery.success) return res.sendStatus(400)
  const { shareId } = parsedQuery.data

  const validShare = await isValidShare(
    {
      id: shareCredentials.id || shareId,
      password: shareCredentials.password
    },
    'file',
    id
  )
  if (!req.user && !validShare) return res.sendStatus(401)

  const file = await getFile(id)
  if (!file) return res.sendStatus(404)
  if (!validShare && file.ownerId !== req.user?.id) return res.sendStatus(404)

  const stream = await getReadStream(id)
  if (!stream) return res.sendStatus(404)

  res.setHeader('Content-Type', file.mime)
  res.setHeader('Content-Length', file.size.toString())
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(file.name)}"`
  )

  return stream.pipe(res)
}
