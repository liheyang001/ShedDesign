import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import config from '../config/env.js'
import type { GardenAnalysis } from '../types/garden.js'

const ANALYSIS_PROMPT = `Analyze this garden image and return ONLY a JSON object with no markdown, no code fences, no explanation.

Required JSON format:
{
  "estimatedSize": {"width": <number, meters>, "height": <number, meters>},
  "orientation": "<N|S|E|W|NE|SE|SW|NW>",
  "sunlight": {"morning": "<full-sun|partial-sun|partial-shade|shade>", "afternoon": "<same>", "evening": "<same>"},
  "existingStructures": ["<string>"],
  "availableSpaces": [
    {"x": <number>, "y": <number>, "width": <number>, "height": <number>, "score": <0-1>}
  ],
  "terrain": "<flat|sloped|irregular>",
  "drainage": "<good|moderate|poor>"
}

Return at least 3 availableSpaces. Return ONLY the JSON object.`

const VALID_ORIENTATIONS = new Set(['N', 'S', 'E', 'W', 'NE', 'SE', 'SW', 'NW'])
const VALID_SUNLIGHT = new Set(['full-sun', 'partial-sun', 'partial-shade', 'shade'])
const VALID_TERRAIN = new Set(['flat', 'sloped', 'irregular'])
const VALID_DRAINAGE = new Set(['good', 'moderate', 'poor'])

function isValidAnalysis(data: unknown): data is GardenAnalysis {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>

  if (!d.estimatedSize || typeof (d.estimatedSize as any).width !== 'number') return false
  if (!VALID_ORIENTATIONS.has(d.orientation as string)) return false
  if (!d.sunlight) return false
  const s = d.sunlight as Record<string, unknown>
  if (!VALID_SUNLIGHT.has(s.morning as string)) return false
  if (!Array.isArray(d.existingStructures)) return false
  if (!Array.isArray(d.availableSpaces) || d.availableSpaces.length === 0) return false
  if (!VALID_TERRAIN.has(d.terrain as string)) return false
  if (!VALID_DRAINAGE.has(d.drainage as string)) return false

  return true
}

function fallbackAnalysis(): GardenAnalysis {
  return {
    estimatedSize: { width: 15, height: 20 },
    orientation: 'N',
    sunlight: { morning: 'full-sun', afternoon: 'partial-sun', evening: 'partial-shade' },
    existingStructures: ['house', 'fence'],
    availableSpaces: [
      { x: 3, y: 5, width: 4, height: 4, score: 0.8 },
      { x: 8, y: 8, width: 3, height: 3, score: 0.65 },
      { x: 1, y: 12, width: 5, height: 4, score: 0.55 },
    ],
    terrain: 'flat',
    drainage: 'good',
  }
}

const mimeTypeMap: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export async function analyzeGardenImage(imagePath: string): Promise<GardenAnalysis> {
  if (!config.geminiApiKey) {
    console.warn('GEMINI_API_KEY not set — returning mock analysis')
    return fallbackAnalysis()
  }

  const genAI = new GoogleGenerativeAI(config.geminiApiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const imageData = fs.readFileSync(imagePath)
  const base64Data = imageData.toString('base64')
  const ext = imagePath.split('.').pop()?.toLowerCase() ?? 'jpeg'
  const mimeType = mimeTypeMap[ext] ?? 'image/jpeg'

  let responseText: string
  try {
    const response = await model.generateContent([
      { inlineData: { data: base64Data, mimeType } },
      ANALYSIS_PROMPT,
    ])
    responseText = response.response.text().trim()
  } catch (err) {
    console.error('Gemini API call failed:', err)
    return fallbackAnalysis()
  }

  // Strip markdown code fences if Gemini wraps the JSON
  const stripped = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const jsonMatch = stripped.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('Gemini response did not contain JSON:', responseText.slice(0, 200))
    return fallbackAnalysis()
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    console.error('Failed to parse Gemini JSON response')
    return fallbackAnalysis()
  }

  if (!isValidAnalysis(parsed)) {
    console.error('Gemini response failed schema validation:', JSON.stringify(parsed).slice(0, 200))
    return fallbackAnalysis()
  }

  return parsed
}
