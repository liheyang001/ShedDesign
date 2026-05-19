import express from 'express'
import cors from 'cors'
import uploadRoutes from './routes/upload.js'
import config from './config/env.js'

const app = express()

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

app.use('/api', uploadRoutes)

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 根路由
app.get('/', (req, res) => {
  res.json({ message: 'ShedDesign API Server', version: '0.1.0' })
})

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({
    error: config.nodeEnv === 'development' ? err.message : 'Internal server error',
  })
})

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// 启动服务器
const server = app.listen(config.port, () => {
  console.log(`🚀 ShedDesign API Server 运行在 http://localhost:${config.port}`)
  console.log(`📝 环境: ${config.nodeEnv}`)
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('正在关闭服务器...')
  server.close(() => {
    console.log('服务器已关闭')
    process.exit(0)
  })
})

export default app
