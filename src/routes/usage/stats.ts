import { Request, Response } from 'express'

import { countFiles, countFolders, getStorageUsage } from '#lib/files.js'
import { countCollections } from '#lib/collections.js'
import { countTokens } from '#lib/tokens.js'
import { countShares } from '#lib/shares.js'
import { countPastes } from '#lib/paste.js'
import { getConfig } from '#lib/config.js'

export async function get(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.token.type !== 'user') return res.sendStatus(418)
  const config = await getConfig()

  res.json({
    storage: {
      current: await getStorageUsage(req.user.id),
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
    tokens: {
      current: await countTokens(req.user.id, true),
      max: config.user.maxTokens
    }
  })
}
