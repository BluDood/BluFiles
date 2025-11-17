import { z } from 'zod'

export const username = z.string().min(3).max(32)
export const password = z.string().min(8)
export const id = z.cuid()

export const loginSchema = z.object({
  username,
  password
})

export const registerSchema = z.object({
  username,
  password
})

export const genericShareSchema = z.object({
  shareId: z.string().optional()
})

export const getRawFileSchema = z.object({
  token: z.string().optional(),
  shareId: z.string().optional()
})

export const createFileSchema = z.object({
  name: z.string().min(1).max(128),
  folderId: z.string().optional(),
  data: z.instanceof(Buffer),
  share: z.preprocess(val => {
    if (val === undefined) return false
    if (val === 'true') return true
    if (val === 'false') return false
    return Boolean(val)
  }, z.boolean().optional())
})

export const updateFileSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  folderId: z.string().nullable().optional()
})

export const createFolderSchema = z.object({
  name: z.string().min(1).max(128),
  parentId: z.string().optional()
})

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  parentId: z.string().nullable().optional()
})

export const createPasteSchema = z.object({
  name: z.string().min(1).max(128),
  content: z.string().min(1),
  type: z.string(),
  share: z.preprocess(val => {
    if (val === undefined) return false
    if (val === 'true') return true
    if (val === 'false') return false
    return Boolean(val)
  }, z.boolean().optional())
})

export const updatePasteSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  content: z.string().min(1).optional(),
  type: z.string().optional()
})

export const deletePasteSchema = z.object({
  id
})

export const createTokenSchema = z.object({
  name: z.string().min(1).max(128)
})

export const deleteTokenSchema = z.object({
  id: z.enum(['all', 'except']).or(id)
})

export const createCollectionSchema = z.object({
  name: z.string().min(1).max(128)
})

export const updateCollectionSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  fileIds: z.array(id).optional()
})

export const createShareSchema = z.object({
  type: z.enum(['file', 'folder', 'collection', 'paste']),
  id
})
