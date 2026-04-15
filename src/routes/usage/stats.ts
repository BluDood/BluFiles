import { Request, Response } from 'express'

import { countFiles, countFolders, getStorageUsage } from '#lib/files.js'
import { countCollections } from '#lib/collections.js'
import { getUserMaxLimits } from '#lib/config.js'
import { countTokens } from '#lib/tokens.js'
import { countShares } from '#lib/shares.js'
import { countPastes } from '#lib/paste.js'

/**
 * Get usage stats
 *
 * Returns the authenticated user's current usage counters for storage, files, folders,
 * pastes, collections, shares, and tokens alongside their configured per-user limits.
 */
export async function get(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401)
  if (req.user.token.type !== 'user') return res.sendStatus(418)

  const userLimits = await getUserMaxLimits(req.user.id)
  if (!userLimits) return res.sendStatus(403)

  res.json({
    storage: {
      current: (await getStorageUsage(req.user.id)).toString(),
      max: userLimits.storage.toString()
    },
    files: {
      current: await countFiles(req.user.id),
      max: userLimits.files
    },
    folders: {
      current: await countFolders(req.user.id),
      max: userLimits.folders
    },
    pastes: {
      current: await countPastes(req.user.id),
      max: userLimits.pastes
    },
    collections: {
      current: await countCollections(req.user.id),
      max: userLimits.collections
    },
    shares: {
      current: await countShares(req.user.id),
      max: userLimits.shares
    },
    tokens: {
      current: await countTokens(req.user.id, true),
      max: userLimits.tokens
    }
  })
}
