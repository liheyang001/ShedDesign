import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { analyzeGardenImage } from '../services/imageAnalyzer.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.resolve(__dirname, '../../uploads')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// UUID v4 format — prevents path traversal via imageId param
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

export async function uploadImage(req: Request, res: Response) {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' })
      return
    }

    const imageId = uuidv4()
    const rawExt = path.extname(req.file.originalname).toLowerCase()
    const ext = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : '.jpg'
    const filename = `${imageId}${ext}`
    const filePath = path.join(uploadsDir, filename)

    fs.writeFileSync(filePath, req.file.buffer)

    const analysis = await analyzeGardenImage(filePath)

    res.json({ imageId, filename, analysis })
  } catch (error: unknown) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Image processing failed' })
  }
}

export function getImage(req: Request, res: Response) {
  try {
    const { imageId } = req.params

    if (!UUID_REGEX.test(imageId)) {
      res.status(400).json({ error: 'Invalid image ID' })
      return
    }

    const files = fs.readdirSync(uploadsDir)
    const file = files.find(f => f.startsWith(imageId))

    if (!file) {
      res.status(404).json({ error: 'Image not found' })
      return
    }

    // Resolve and verify the final path stays within uploadsDir
    const resolved = path.resolve(uploadsDir, file)
    if (!resolved.startsWith(uploadsDir + path.sep) && resolved !== uploadsDir) {
      res.status(400).json({ error: 'Invalid image ID' })
      return
    }

    res.sendFile(resolved)
  } catch (error: unknown) {
    console.error('Get image error:', error)
    res.status(500).json({ error: 'Failed to retrieve image' })
  }
}
