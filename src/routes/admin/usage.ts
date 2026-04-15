import { Request, Response } from 'express'

import { countFiles, countFolders, getStorageUsage } from '#lib/files.js'
import { countCollections } from '#lib/collections.js'
import { countShares } from '#lib/shares.js'
import { countPastes } from '#lib/paste.js'
import { getConfig } from '#lib/config.js'

/**
 * Get global usage stats
 *
 * Returns server-wide usage counters for storage, files, folders, pastes, collections,
 * and shares alongside their configured limits. Requires an admin session token.
 */
export async function get(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.type !== 'admin') return res.sendStatus(403)
  if (req.user.token.type !== 'user') return res.sendStatus(418)
  const config = await getConfig()

  res.json({
    storage: {
      current: (await getStorageUsage()).toString(),
      max: config.total.maxStorage.toString()
    },
    files: {
      current: await countFiles(),
      max: config.total.maxFiles
    },
    folders: {
      current: await countFolders(),
      max: config.total.maxFolders
    },
    pastes: {
      current: await countPastes(),
      max: config.total.maxPastes
    },
    collections: {
      current: await countCollections(),
      max: config.total.maxCollections
    },
    shares: {
      current: await countShares(),
      max: config.total.maxShares
    }
  })
}
