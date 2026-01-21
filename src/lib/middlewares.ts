import express, { Request, Response, NextFunction, Application } from 'express'

import { router } from 'express-file-routing'
import cors from 'cors'
import path from 'path'

import { generateFileMetaPage } from './opengraph.js'
import { useToken } from '#lib/tokens.js'
import { getShare } from './shares.js'
import { logger } from '#lib/utils.js'

async function auth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization
  if (!auth) return next()

  const [type, token] = auth.split(' ')
  if (!type || !token) return next()

  if (type === 'token') {
    const found = await useToken(token)
    if (!found) return next()
    req.user = {
      ...found.user,
      token: {
        id: found.id,
        type: found.type,
        userAgent: found.userAgent,
        hash: found.hash
      }
    }
  }

  next()
}

async function shareRoute(req: Request, res: Response) {
  const { id } = req.params

  const userAgent = req.headers['user-agent'] || ''
  const isCrawler = /discordbot|slackbot|twitterbot/i.test(userAgent)
  if (!isCrawler) return res.redirect(`/shared?id=${id}`)

  const share = await getShare(id)
  if (!share) return res.sendStatus(404)

  const protocol = req.headers['x-forwarded-proto'] || req.protocol
  const host = req.headers['x-forwarded-host'] || req.headers.host

  const page = generateFileMetaPage(
    share.id,
    share.type,
    share[share.type]!,
    `${protocol}://${host}`
  )

  return res.send(page)
}

export async function setupMiddlewares(app: Application) {
  app.use(cors())
  app.use(express.json())
  app.use(express.raw({ type: 'application/octet-stream', limit: '100mb' }))
  app.use(auth)
  app.use(
    '/api',
    await router({ directory: path.join(process.cwd(), 'dist/routes') })
  )

  app.get('/s/:id', shareRoute)

  app.use(express.static(path.join(process.cwd(), 'web/build')))

  app.use((req: Request, res: Response) => {
    res.status(404).send()
  })

  app.use(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error(`Error: ${err.message}`, 'Express')
      res.status(500).send()
    }
  )
}
