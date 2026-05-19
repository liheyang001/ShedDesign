import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiUrl: process.env.API_URL || 'http://localhost:5000',
  geminiApiKey: process.env.GEMINI_API_KEY,
  databaseUrl: process.env.DATABASE_URL,
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000'],
}

// 验证必需的环境变量
if (!config.geminiApiKey) {
  console.warn('⚠️ GEMINI_API_KEY 未设置，某些功能将不可用')
}

export default config
