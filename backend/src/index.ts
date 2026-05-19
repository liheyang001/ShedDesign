import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import uploadRoutes from './routes/upload.js'
import config from './config/env.js'

const app = express()

app.use(cors({
  origin: config.allowedOrigins,
  credentials: true,
}))

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ limit: '1mb', extended: true }))

// Rate limiting: 30 uploads per IP per 15 minutes
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
})

// General API rate limit: 200 requests per IP per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
})

app.use('/api/upload', uploadLimiter)
app.use('/api', apiLimiter)
app.use('/api', uploadRoutes)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/', (_req, res) => {
  res.json({ message: 'ShedDesign API Server', version: '0.1.0' })
})

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(err.status ?? 500).json({
    error: config.nodeEnv === 'development' ? err.message : 'Internal server error',
  })
})

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

const server = app.listen(config.port, () => {
  console.log(`🚀 ShedDesign API running at http://localhost:${config.port}`)
  console.log(`📝 Environment: ${config.nodeEnv}`)
  console.log(`🔒 Allowed origins: ${config.allowedOrigins.join(', ')}`)
})

process.on('SIGINT', () => {
  server.close(() => process.exit(0))
})

export default app
