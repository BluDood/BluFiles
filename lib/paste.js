import prisma from './prisma.js'

export const filterPaste = (p, includeContent) => {
  const paste = {
    id: p.id,
    name: p.name,
    type: p.type,
    ownerId: p.ownerId,
    content: includeContent ? p.content : undefined,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  }

  if (p.share) paste.shareId = p.share.id

  return paste
}

export async function countPastes(ownerId) {
  return await prisma.paste.count({
    where: ownerId ? { ownerId } : undefined
  })
}

export async function getPaste(id) {
  const paste = await prisma.paste.findUnique({
    where: { id },
    include: { share: true }
  })

  return paste
}

export async function createPaste({ name, ownerId, content, type }) {
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

export async function getPastes(ownerId) {
  const pastes = await prisma.paste.findMany({
    where: ownerId ? { ownerId } : undefined
  })

  return pastes
}

export async function deletePaste(id) {
  const paste = await prisma.paste.delete({
    where: { id }
  })

  return paste
}

export async function updatePaste(id, data) {
  const paste = await prisma.paste.update({
    where: { id },
    data
  })

  return paste
}
