import { Request, Response } from 'express'

import {
  deleteCollection,
  filterCollection,
  getCollection,
  updateCollection
} from '#lib/collections.js'

import { genericShareSchema, updateCollectionSchema } from '#lib/schemas.js'
import { getShare } from '#lib/shares.js'

export async function get(req: Request, res: Response) {
  const parsed = genericShareSchema.safeParse(req.query)
  if (!parsed.success) return res.sendStatus(400)
  const { shareId } = parsed.data

  const { id } = req.params
  if (!id) return res.sendStatus(400)

  let validShare = false
  if (shareId) {
    const share = await getShare(shareId)

    if (share && share.type === 'collection' && share.collectionId) {
      if (id === share.collectionId) {
        validShare = true
      }
    }
  }

  if (!req.user && !validShare) return res.sendStatus(401)

  const collection = await getCollection(id)
  if (!collection) return res.sendStatus(404)
  if (!validShare && collection.ownerId !== req.user?.id)
    return res.sendStatus(404)

  return res.json(filterCollection(collection))
}

export async function patch(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const { id } = req.params

  const parsed = updateCollectionSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)

  const collection = await getCollection(id)
  if (!collection) return res.sendStatus(404)
  if (collection.ownerId !== req.user.id) return res.sendStatus(404)

  await updateCollection(id, parsed.data)

  return res.sendStatus(204)
}

export async function del(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const { id } = req.params

  const collection = await getCollection(id)
  if (!collection) return res.sendStatus(404)
  if (collection.ownerId !== req.user.id) return res.sendStatus(404)

  await deleteCollection(id)

  return res.sendStatus(204)
}
