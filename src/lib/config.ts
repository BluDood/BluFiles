import path from 'path'
import fs from 'fs/promises'
import { countFiles, countFolders, getFiles } from '#lib/files.js'
import { countPastes } from '#lib/paste.js'
import { countUsers } from '#lib/users.js'
import { getStorageUsage } from '#lib/filesystem.js'

interface Config {
  maxUsers: number
  disableRegistration: boolean | 'afterFirstUser'
  total: {
    maxFiles: number
    maxFolders: number
    maxPastes: number
    maxStorage: number
  }
  user: {
    maxFiles: number
    maxFolders: number
    maxPastes: number
    maxStorage: number
  }
}

const defaultConfig: Config = {
  maxUsers: -1,
  disableRegistration: 'afterFirstUser',
  total: {
    maxFiles: -1,
    maxFolders: -1,
    maxPastes: -1,
    maxStorage: -1
  },
  user: {
    maxFiles: -1,
    maxFolders: -1,
    maxPastes: -1,
    maxStorage: -1
  }
}

const configPath = path.resolve(path.join(process.cwd(), 'data/config.json'))

export async function getConfig() {
  try {
    const data = await fs.readFile(configPath, 'utf8')
    return {
      ...defaultConfig,
      ...JSON.parse(data)
    }
  } catch {
    return defaultConfig
  }
}

export async function setConfig(data: Config) {
  await fs.writeFile(configPath, JSON.stringify(data, null, 2))
}

await setConfig(await getConfig())

export async function setConfigValue(key: string, value: unknown) {
  const config = await getConfig()
  if (!Object.keys(config).includes(key)) return false
  config[key] = value
  await setConfig(config)
  return true
}

export async function checkRegistrationAllowed() {
  const config = await getConfig()

  if ([true, 'true'].includes(config.disableRegistration)) return false

  const users = await countUsers()
  if (config.disableRegistration === 'afterFirstUser' && users >= 1)
    return false

  if (config.maxUsers !== -1 && users >= config.maxUsers) return false

  return true
}

export async function checkFileCreationAllowed(userId: string, size: number) {
  const config = await getConfig()

  const files = await countFiles(userId)
  if (config.user.maxFiles !== -1 && files >= config.user.maxFiles) return false

  const totalFiles = await countFiles(null)
  if (config.total.maxFiles !== -1 && totalFiles >= config.total.maxFiles)
    return false

  const fileIds = (await getFiles(userId, true)).map(f => f.id)
  const storageUsage = await getStorageUsage(fileIds)
  if (
    config.user.maxStorage !== -1 &&
    storageUsage + size >= config.user.maxStorage
  )
    return false

  const totalStorageUsage = await getStorageUsage()
  if (
    config.total.maxStorage !== -1 &&
    totalStorageUsage + size >= config.total.maxStorage
  )
    return false

  return true
}

export async function checkFolderCreationAllowed(userId: string) {
  const config = await getConfig()

  const folders = await countFolders(userId)
  if (config.user.maxFolders !== -1 && folders >= config.user.maxFolders)
    return false

  const totalFolders = await countFolders(null)
  if (config.total.maxFolders !== -1 && totalFolders >= config.total.maxFolders)
    return false

  return true
}

export async function checkPasteCreationAllowed(userId: string) {
  const config = await getConfig()

  const pastes = await countPastes(userId)
  if (config.user.maxPastes !== -1 && pastes >= config.user.maxPastes)
    return false

  const totalPastes = await countPastes(null)
  if (config.total.maxPastes !== -1 && totalPastes >= config.total.maxPastes)
    return false

  return true
}
