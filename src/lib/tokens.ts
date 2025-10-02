import { hash, random } from '#lib/utils.js'
import prisma, { Token, TokenType } from '#lib/prisma.js'

interface FilteredToken {
  id: string
  type: TokenType
  createdAt: Date
  usedAt: Date | null
  userAgent: string | null
  me: boolean
  name: string | null
}

export const filterToken = (
  token:
    | Token
    | (Token & {
        me: boolean
      })
) => {
  const t: FilteredToken = {
    id: token.id,
    type: token.type,
    createdAt: token.createdAt,
    usedAt: token.usedAt,
    userAgent: token.userAgent,
    me: false,
    name: token.name
  }

  if ('me' in token) t.me = token.me

  return t
}

export async function createToken({
  userId,
  type,
  userAgent,
  name
}: {
  userId: string
  type?: TokenType
  userAgent?: string
  name?: string
}) {
  const token = random(64)

  const details = await prisma.token.create({
    data: {
      userId,
      hash: hash(token),
      type: type || 'user',
      userAgent: userAgent || null,
      name: name || null
    }
  })

  return {
    ...details,
    token
  }
}

export async function getToken({ id, token }: { id?: string; token?: string }) {
  return await prisma.token.findFirst({
    where: token ? { hash: hash(token) } : { id },
    include: {
      user: true
    }
  })
}

export async function getTokens(userId: string) {
  return await prisma.token.findMany({
    where: {
      userId
    }
  })
}

export async function deleteToken({
  id,
  token
}: {
  id?: string
  token?: string
}) {
  if (id)
    return await prisma.token.delete({
      where: {
        id
      }
    })
  else if (token)
    return await prisma.token.delete({
      where: {
        hash: hash(token)
      }
    })
}

export async function deleteTokens({
  userId,
  keep
}: {
  userId: string
  keep: string[]
}) {
  return await prisma.token.deleteMany({
    where: {
      userId,
      NOT: {
        hash: {
          in: keep.map(k => hash(k))
        }
      }
    }
  })
}

export async function useToken(token: string) {
  const found = await getToken({ token })
  if (!found) return false
  const updated = await prisma.token.update({
    where: {
      id: found.id
    },
    data: {
      usedAt: new Date()
    },
    include: {
      user: true
    }
  })

  return updated
}
