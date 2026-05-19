import { Router } from 'express'
import multer from 'multer'
import { uploadImage, getImage } from '../controllers/uploadController.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('只支持图片文件'))
    } else {
      cb(null, true)
    }
  },
})

router.post(
  '/upload',
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (!err) return next()
      // multer-specific errors (file too large, wrong type)
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Maximum size is 5MB.' })
      }
      return res.status(400).json({ error: err.message || 'Invalid file' })
    })
  },
  uploadImage,
)
router.get('/image/:imageId', getImage)

export default router
