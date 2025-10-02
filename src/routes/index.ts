import { Request, Response } from 'express'

import { countFiles, countFolders } from '#lib/files.js'
import { getStorageUsage } from '#lib/filesystem.js'
import { countPastes } from '#lib/paste.js'
import { getConfig } from '#lib/config.js'

export async function get(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.token.type !== 'user') return res.sendStatus(418)
  const config = await getConfig()

  res.json({
    storage: {
      total: config.total.maxStorage,
      used: await getStorageUsage()
    },
    files: await countFiles(req.user.id),
    folders: await countFolders(req.user.id),
    pastes: await countPastes(req.user.id),
    user: {
      name: req.user.username,
      id: req.user.id
    }
  })
}
