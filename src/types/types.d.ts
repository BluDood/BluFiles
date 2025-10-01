declare namespace Express {
  interface Request {
    user?: User & { token: Token }
  }

  interface Response {
    sendStatusMessage(status: number, message?: string): this
  }
}

interface User {
  id: string
  username: string
  type: 'user' | 'admin'
}

interface Token {
  id: string
  type: 'user' | 'uploader'
  userAgent: string | null
  hash: string
}
