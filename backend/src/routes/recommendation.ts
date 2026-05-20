import { Router } from 'express'
import { generateRecommendationHandler } from '../controllers/recommendationController.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

router.post('/generate-recommendation', authenticate, generateRecommendationHandler)

export default router
