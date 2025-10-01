import { getFile } from '../../../lib/files.js'
import { read } from '../../../lib/filesystem.js'
import { getRawFileSchema } from '../../../lib/schemas.js'
import { getToken } from '../../../lib/tokens.js'

export async function get(req, res) {
  const { id } = req.params
  if (!id) return res.sendStatus(400)

  if (!req.user) {
    const parsed = getRawFileSchema.safeParse(req.query)
    if (!parsed.success) return res.sendStatus(400)
    const { token } = parsed.data

    const foundToken = await getToken({ token })
    if (!foundToken) return res.sendStatus(404)
    req.user = {
      id: foundToken.userId
    }
  }

  const file = await getFile(id)
  if (!file) return res.sendStatus(404)
  if (file.ownerId !== req.user.id) return res.sendStatus(404)
  const data = await read(file.id)
  if (!data) return res.sendStatus(404)

  res.setHeader('Content-Type', file.mime)
  res.setHeader('Content-Length', data.byteLength)

  return res.send(data)
}
