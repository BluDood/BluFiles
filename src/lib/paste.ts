import prisma, { Paste } from '#lib/prisma.js'

interface FilteredPaste {
  id: string
  name: string
  type: string
  ownerId: string
  content?: string
  shareId?: string
  createdAt: Date
  updatedAt: Date
}

export const filterPaste = (
  p:
    | Paste
    | (Paste & {
        share: { id: string }
      }),
  includeContent: boolean
) => {
  const paste: FilteredPaste = {
    id: p.id,
    name: p.name,
    type: p.type,
    ownerId: p.ownerId,
    content: includeContent ? p.content : undefined,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  }

  if ('share' in p && p.share) paste.shareId = p.share.id

  return paste
}

export async function countPastes(ownerId: string | null) {
  return await prisma.paste.count({
    where: ownerId ? { ownerId } : undefined
  })
}

export async function getPaste(id: string) {
  const paste = await prisma.paste.findUnique({
    where: { id },
    include: { share: true }
  })

  return paste
}

export async function createPaste({
  name,
  ownerId,
  content,
  type
}: {
  name: string
  ownerId: string
  content: string
  type: string
}) {
  const paste = await prisma.paste.create({
    data: {
      name,
      content,
      type,
      ownerId
    }
  })

  return paste
}

export async function getPastes(ownerId: string | null) {
  const pastes = await prisma.paste.findMany({
    where: ownerId ? { ownerId } : undefined
  })

  return pastes
}

export async function deletePaste(id: string) {
  const paste = await prisma.paste.delete({
    where: { id }
  })

  return paste
}

export async function updatePaste(id: string, data: Partial<Paste>) {
  const paste = await prisma.paste.update({
    where: { id },
    data
  })

  return paste
}
