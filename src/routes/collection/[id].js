import {
  deleteCollection,
  filterCollection,
  getCollection,
  updateCollection
} from '../../lib/collections.js'
import { updateCollectionSchema } from '../../lib/schemas.js'

export async function get(req, res) {
  if (!req.user) return res.sendStatus(401)

  const { id } = req.params
  const collection = await getCollection(id)

  if (!collection) return res.sendStatus(404)

  return res.json(filterCollection(collection))
}

export async function patch(req, res) {
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

export async function del(req, res) {
  if (!req.user) return res.sendStatus(401)

  const { id } = req.params

  const collection = await getCollection(id)
  if (!collection) return res.sendStatus(404)
  if (collection.ownerId !== req.user.id) return res.sendStatus(404)

  await deleteCollection(id)

  return res.sendStatus(204)
}
