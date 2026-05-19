import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import { analyzeGardenImage } from '../services/imageAnalyzer.js'

const uploadsDir = path.join(process.cwd(), 'uploads')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

export async function uploadImage(req: Request, res: Response) {
  try {
    if (!req.file) {
      res.status(400).json({ error: '未提供图片文件' })
      return
    }

    const imageId = uuidv4()
    const ext = path.extname(req.file.originalname) || '.jpg'
    const filename = `${imageId}${ext}`
    const filePath = path.join(uploadsDir, filename)

    fs.writeFileSync(filePath, req.file.buffer)

    const analysis = await analyzeGardenImage(filePath)

    res.json({ imageId, filename, analysis })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '图像处理失败'
    console.error('上传错误:', error)
    res.status(500).json({ error: message })
  }
}

export function getImage(req: Request, res: Response) {
  try {
    const { imageId } = req.params
    const files = fs.readdirSync(uploadsDir)
    const file = files.find(f => f.startsWith(imageId))

    if (!file) {
      res.status(404).json({ error: '图片未找到' })
      return
    }

    res.sendFile(path.join(uploadsDir, file))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '获取图片失败'
    console.error('获取图片错误:', error)
    res.status(500).json({ error: message })
  }
}
