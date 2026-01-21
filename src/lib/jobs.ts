import fs from 'fs/promises'
import cron from 'node-cron'
import path from 'path'

import { logger } from './utils.js'
import { pathToFileURL } from 'url'

const JOBS_PATH = path.join(process.cwd(), 'dist/jobs')

interface Job {
  name: string
  interval: string
  execute: () => Promise<
    { status: 'success' } | { status: 'error'; error: string }
  >
  runImmediately?: boolean
}

let registered = false

export async function registerJobs() {
  if (registered) return

  const files = await fs.readdir(JOBS_PATH)
  for (const filename of files.filter(file => file.endsWith('.js'))) {
    const { name, interval, execute, runImmediately }: Job = await import(
      pathToFileURL(path.join(JOBS_PATH, filename)).href
    )

    const task = cron.schedule(interval, async () => {
      const result = await execute()

      if (result.status === 'error')
        logger.error(`${name} failed: ${result.error}`, 'Jobs')
      else if (result.status === 'success')
        logger.info(`${name} executed successfully`, 'Jobs')
    })

    if (runImmediately) task.execute()
  }

  registered = true
  logger.info(
    `Registered ${files.length} job${files.length === 1 ? '' : 's'}`,
    'Jobs'
  )
}
