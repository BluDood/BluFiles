import {
  createCollection,
  filterCollection,
  getCollections
} from '../../lib/collections.js'
import { createCollectionSchema } from '../../lib/schemas.js'

export async function get(req, res) {
  if (!req.user) return res.sendStatus(401)

  const collections = await getCollections(req.user.id)

  return res.json(collections.map(filterCollection))
}

export async function post(req, res) {
  if (!req.user) return res.sendStatus(401)

  const parsed = createCollectionSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)
  const { name } = parsed.data

  const collection = await createCollection({
    name,
    ownerId: req.user.id
  })

  return res.json(filterCollection(collection))
}
