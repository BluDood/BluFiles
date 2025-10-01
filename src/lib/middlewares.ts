import express, {
  Request,
  Response,
  NextFunction,
  Application
} from 'express'
import { router } from 'express-file-routing'
import mp from 'parse-multipart-data'
import cors from 'cors'
import { useToken } from './tokens.js'
import path from 'path'

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
}
