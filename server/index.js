import express from 'express'
import cors from 'cors'
import { initDB } from './db.js'
import authRouter from './auth.js'
import apiRouter from './routes.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (req, res) => res.json({ ok: true, app: 'tishikgasha' }))
app.use('/api/auth', authRouter)
app.use('/api', apiRouter)

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => res.status(500).json({ error: err.message || 'server error' }))

const PORT = process.env.PORT || 8000
initDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => console.log('TishkGasha API listening on ' + PORT))
  })
  .catch((e) => {
    console.error('Failed to start:', e)
    process.exit(1)
  })
