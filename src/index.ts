import express from 'express'
import { setupMiddlewares } from './lib/middlewares.js'

const app = express()
await setupMiddlewares(app)

app.listen(1337, async () => {
  console.log('http://localhost:1337')
})
