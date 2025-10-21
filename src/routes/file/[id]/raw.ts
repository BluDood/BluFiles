import { Request, Response } from 'express'

import { getRawFileSchema } from '#lib/schemas.js'
import { getToken } from '#lib/tokens.js'
import { read } from '#lib/filesystem.js'
import { getFile } from '#lib/files.js'
import { getShare, isFileInFolderSHared } from '#lib/shares.js'

export async function get(req: Request, res: Response) {
  const { id } = req.params
  if (!id) return res.sendStatus(400)
  let userId = req.user?.id

  const parsed = getRawFileSchema.safeParse(req.query)
  if (!parsed.success) return res.sendStatus(400)
  const { token, shareId } = parsed.data

  const file = await getFile(id)
  if (!file) return res.sendStatus(404)

  if (!userId) {
    if (token) {
      const foundToken = await getToken({ token })
      if (foundToken) userId = foundToken.userId
    }
    if (shareId) {
      const share = await getShare(shareId)
      if (share) {
        if (share.type === 'file' && share.fileId) {
          if (file.id === share.fileId) userId = 'share'
        } else if (share.type === 'folder' && share.folderId) {
          if (await isFileInFolderSHared(file.id, shareId)) userId = 'share'
        }
      }
    }
  }

  if (file.ownerId !== userId && userId !== 'share') return res.sendStatus(404)
  const data = await read(file.id)
  if (!data) return res.sendStatus(404)

  res.setHeader('Content-Type', file.mime)
  res.setHeader('Content-Length', data.byteLength)

  return res.send(data)
}
