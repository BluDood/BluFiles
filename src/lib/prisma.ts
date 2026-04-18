import { PrismaClient } from '../../generated/prisma/index.js'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
})
const prisma = new PrismaClient({ adapter })

export default prisma
export * from '../../generated/prisma/index.js'
