import express, { Request, Response, NextFunction, Application } from 'express'
import { router } from 'express-file-routing'
import mp from 'parse-multipart-data'
import cors from 'cors'
import { useToken } from '#lib/tokens.js'
import path from 'path'
import { logger } from '#lib/utils.js'
import { getShare } from './shares.js'
import { generateOpenGraphHtml } from './opengraph.js'

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
  const userAgent = req.headers['user-agent'] || ''
  const isCrawler = /discordbot|slackbot|twitterbot/i.test(userAgent)
  if (!isCrawler) return res.redirect(`/shared?id=${req.params.id}`)

  const { id } = req.params
  const share = await getShare(id)

  if (!share) return res.sendStatus(404)

  if (share.file) {
    const page = generateOpenGraphHtml({
      title: share.file.name,
      description: `Shared file: ${share.file.name} (${(
        share.file.size / 1024
      ).toFixed(2)} KB)`,
      imageUrl: `http://localhost:1337/api/file/${share.fileId}/raw?shareId=${share.id}`,
      url: `http://localhost:5173/shared?id=${share.id}`
    })

    return res.send(page)
  }
}

export async function setupMiddlewares(app: Application) {
  app.use(cors())
  app.use(express.json())
  app.use(express.raw({ type: 'multipart/form-data', limit: '100mb' }))
  app.use(parseMultipart)
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

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(`Error: ${err.message}`, 'Express')
    res.status(500).send()
  })
}
