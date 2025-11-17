import { Request, Response } from 'express'

import { countFiles, countFolders, getFiles } from '#lib/files.js'
import { countCollections } from '#lib/collections.js'
import { getStorageUsage } from '#lib/filesystem.js'
import { countShares } from '#lib/shares.js'
import { countPastes } from '#lib/paste.js'
import { getConfig } from '#lib/config.js'

export async function get(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.token.type !== 'user') return res.sendStatus(418)
  const config = await getConfig()

  const fileIds = (await getFiles(req.user.id, true)).map(f => f.id)
  const storageUsage = await getStorageUsage(fileIds)

  res.json({
    storage: {
      current: storageUsage,
      max: config.user.maxStorage
    },
    files: {
      current: await countFiles(req.user.id),
      max: config.user.maxFiles
    },
    folders: {
      current: await countFolders(req.user.id),
      max: config.user.maxFolders
    },
    pastes: {
      current: await countPastes(req.user.id),
      max: config.user.maxPastes
    },
    collections: {
      current: await countCollections(req.user.id),
      max: config.user.maxCollections
    },
    shares: {
      current: await countShares(req.user.id),
      max: config.user.maxShares
    },
    user: {
      name: req.user.username,
      id: req.user.id
    }
  })
}
