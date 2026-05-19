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

router.post('/upload', upload.single('image'), uploadImage)
router.get('/image/:imageId', getImage)

export default router
