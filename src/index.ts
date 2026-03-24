import express from 'express'

import { getPackage, isDev, logger } from '#lib/utils.js'
import { setupMiddlewares } from '#lib/middlewares.js'
import { registerJobs } from '#lib/jobs.js'

const app = express()
await setupMiddlewares(app)

process.on('SIGTERM', () => process.exit(0))

const PORT = process.env.PORT || 1337
app.listen(PORT, async () => {
  const pkg = await getPackage()

  logger.info(`BluFiles ${pkg.version} running on port ${PORT}`)
  if (isDev) logger.warn('Running in development mode')

  await registerJobs()
})
