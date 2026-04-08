import { Request, Response } from 'express'

import {
  deleteCollection,
  filterCollection,
  getCollection,
  updateCollection
} from '#lib/collections.js'

import {
  genericShareSchema,
  idSchema,
  updateCollectionSchema
} from '#lib/schemas.js'

import { isValidShare } from '#lib/shares.js'

/**
 * Get collection
 *
 * Returns a collection by ID. Accessible via a valid share link or as the owner.
 */
export async function get(req: Request, res: Response) {
  const parsed = genericShareSchema.safeParse(req.query)
  if (!parsed.success) return res.sendStatus(400)
  const { shareId } = parsed.data

  const parsedParams = idSchema.safeParse(req.params)
  if (!parsedParams.success) return res.sendStatus(400)
  const { id } = parsedParams.data

  const validShare = await isValidShare(shareId, 'collection', id)

  if (!req.user && !validShare) return res.sendStatus(401)

  const collection = await getCollection(id)
  if (!collection) return res.sendStatus(404)
  if (!validShare && collection.ownerId !== req.user?.id)
    return res.sendStatus(404)

  return res.json(filterCollection(collection))
}

/**
 * Update collection
 *
 * Updates the name or file membership of a collection.
 */
export async function patch(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const parsedParams = idSchema.safeParse(req.params)
  if (!parsedParams.success) return res.sendStatus(400)
  const { id } = parsedParams.data

  const parsed = updateCollectionSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)

  const collection = await getCollection(id)
  if (!collection) return res.sendStatus(404)
  if (collection.ownerId !== req.user.id) return res.sendStatus(404)

  await updateCollection(id, parsed.data)

  return res.sendStatus(204)
}

/**
 * Delete collection
 *
 * Permanently deletes a collection. The files inside are not deleted.
 */
export async function del(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)

  const parsedParams = idSchema.safeParse(req.params)
  if (!parsedParams.success) return res.sendStatus(400)
  const { id } = parsedParams.data

  const collection = await getCollection(id)
  if (!collection) return res.sendStatus(404)
  if (collection.ownerId !== req.user.id) return res.sendStatus(404)

  await deleteCollection(id)

  return res.sendStatus(204)
}
