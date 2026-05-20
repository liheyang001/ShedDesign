import { Router } from 'express'
import { submitQuestionnaire } from '../controllers/questionnaireController.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

router.post('/questionnaire', authenticate, submitQuestionnaire)

export default router
