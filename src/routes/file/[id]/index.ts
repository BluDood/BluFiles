import { Request, Response } from 'express'

import {
  getShare,
  isFileInCollectionShared,
  isFileInFolderShared
} from '#lib/shares.js'

import { deleteFile, filterFile, getFile, updateFile } from '#lib/files.js'
import { genericShareSchema, updateFileSchema } from '#lib/schemas.js'

export async function get(req: Request, res: Response) {
  const { id } = req.params
  if (!id) return res.sendStatus(400)

  const parsed = genericShareSchema.safeParse(req.query)
  if (!parsed.success) return res.sendStatus(400)
  const { shareId } = parsed.data

  let validShare = false
  if (shareId) {
    const share = await getShare(shareId)
    if (share) {
      if (share.type === 'folder' && share.folderId) {
        if (await isFileInFolderShared(id, shareId)) validShare = true
      } else if (share.type === 'collection' && share.collectionId) {
        if (await isFileInCollectionShared(id, shareId)) validShare = true
      }
    }
  }
  if (!req.user && !validShare) return res.sendStatus(401)

  const file = await getFile(id)
  if (!file) return res.sendStatus(404)
  if (!validShare && file.ownerId !== req.user?.id) return res.sendStatus(404)

  return res.json(filterFile(file))
}

export async function del(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const { id } = req.params
  if (!id) return res.sendStatus(400)

  const file = await getFile(id)
  if (!file) return res.sendStatus(404)
  if (file.ownerId !== req.user.id) return res.sendStatus(404)

  await deleteFile(id)
  return res.sendStatus(204)
}

export async function patch(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const { id } = req.params
  if (!id) return res.sendStatus(400)

  const parsed = updateFileSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)

  const file = await getFile(id)
  if (!file) return res.sendStatus(404)
  if (file.ownerId !== req.user.id) return res.sendStatus(404)
  await updateFile(id, parsed.data)
  return res.sendStatus(204)
}
