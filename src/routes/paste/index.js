import { checkPasteCreationAllowed } from '../../lib/config.js'
import { createPaste, filterPaste, getPastes } from '../../lib/paste.js'
import { createPasteSchema } from '../../lib/schemas.js'

export async function get(req, res) {
  if (!req.user) return res.sendStatus(401)

  const pastes = await getPastes(req.user.id)

  return res.json(pastes.map(filterPaste))
}

export async function post(req, res) {
  if (!req.user) return res.sendStatus(401)
  if (!(await checkPasteCreationAllowed(req.user.id)))
    return res.sendStatus(403)

  const parsed = createPasteSchema.safeParse(req.body)
  if (!parsed.success) return res.sendStatus(400)
  const { name, content, type } = parsed.data

  const paste = await createPaste({
    name,
    content,
    type,
    ownerId: req.user.id
  })

  return res.json(filterPaste(paste))
}
