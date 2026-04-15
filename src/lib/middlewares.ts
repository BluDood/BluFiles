import express, { Request, Response, NextFunction, Application } from 'express'

import { rateLimit } from 'express-rate-limit'
import { router } from 'express-file-routing'
import mp from 'parse-multipart-data'
import cors from 'cors'
import path from 'path'

import { generateFileMetaPage, generateProtectedMetaPage } from './opengraph.js'
import { isDev, logger } from '#lib/utils.js'
import { useToken } from '#lib/tokens.js'
import { idSchema } from './schemas.js'
import { getShare } from './shares.js'

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

function parseMultipart(req: Request, res: Response, next: NextFunction) {
  const header = req.headers['content-type']
  if (!header || !header.startsWith('multipart/form-data')) return next()
  const boundary = mp.getBoundary(header)
  if (!boundary) return next()
  const parsed = mp.parse(req.body, boundary)
  req.body = Object.fromEntries(
    parsed.map(field => [
      field.name,
      field.filename ? field.data : field.data.toString()
    ])
  )
  next()
}

async function shareRoute(req: Request, res: Response) {
  const parsedParams = idSchema.safeParse(req.params)
  if (!parsedParams.success) {
    res.sendStatus(400)
    return
  }
  const { id } = parsedParams.data

  const userAgent = req.headers['user-agent'] || ''
  const isCrawler = /discordbot|slackbot|twitterbot/i.test(userAgent)
  if (!isCrawler) {
    res.redirect(`/shared?id=${id}`)
    return
  }

  const share = await getShare(id)
  if (!share) {
    res.sendStatus(404)
    return
  }

  const protocol = req.headers['x-forwarded-proto'] || req.protocol
  const host = req.headers['x-forwarded-host'] || req.headers.host

  const page = share.passwordHash
    ? generateProtectedMetaPage(share.id, `${protocol}://${host}`)
    : generateFileMetaPage(
        share.id,
        share.type,
        share[share.type]!,
        `${protocol}://${host}`
      )

  res.send(page)
}

export async function setupMiddlewares(app: Application) {
  const trustProxy = process.env.TRUST_PROXY
  if (trustProxy?.toLowerCase() === 'true') app.set('trust proxy', 1)
  if (isDev) app.use(cors())

  app.use(express.json())
  app.use(
    express.raw({
      type: ['multipart/form-data', 'application/octet-stream'],
      limit: '100mb'
    })
  )
  app.use(parseMultipart)
  app.use(auth)

  app.use(
    '/api/auth/login',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      standardHeaders: true,
      legacyHeaders: false
    })
  )

  app.use(
    '/api/auth/register',
    rateLimit({
      windowMs: 60 * 60 * 1000,
      limit: 5,
      standardHeaders: true,
      legacyHeaders: false
    })
  )

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
