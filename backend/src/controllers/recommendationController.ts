import type { Request, Response } from 'express'
import { generateRecommendation } from '../services/recommendationEngine.js'
import type { GardenAnalysis, UserPreferences } from '../types/garden.js'

const VALID_SHED_PURPOSE = new Set(['storage', 'workshop', 'leisure', 'other'])
const VALID_SIZE = new Set(['small', 'medium', 'large'])
const VALID_STYLE = new Set(['modern', 'traditional', 'industrial', 'cottage'])
const VALID_RAIN = new Set(['basic', 'moderate', 'professional'])
const VALID_SUNLIGHT_PREF = new Set(['full-sun', 'partial', 'shade'])
const VALID_SUNLIGHT_VAL = new Set(['full-sun', 'partial-sun', 'partial-shade', 'shade'])
const VALID_TERRAIN = new Set(['flat', 'sloped', 'irregular'])
const VALID_DRAINAGE = new Set(['good', 'moderate', 'poor'])
const VALID_ORIENTATION = new Set(['N', 'S', 'E', 'W', 'NE', 'SE', 'SW', 'NW'])

function parseAnalysis(raw: unknown): GardenAnalysis | null {
  if (!raw || typeof raw !== 'object') return null
  const a = raw as Record<string, unknown>

  const size = a.estimatedSize as Record<string, unknown> | undefined
  if (!size || typeof size.width !== 'number' || typeof size.height !== 'number') return null
  if (!VALID_ORIENTATION.has(a.orientation as string)) return null

  const sun = a.sunlight as Record<string, unknown> | undefined
  if (!sun) return null
  if (!VALID_SUNLIGHT_VAL.has(sun.morning as string)) return null
  if (!VALID_SUNLIGHT_VAL.has(sun.afternoon as string)) return null
  if (!VALID_SUNLIGHT_VAL.has(sun.evening as string)) return null

  if (!Array.isArray(a.existingStructures)) return null
  if (!Array.isArray(a.availableSpaces) || a.availableSpaces.length === 0) return null
  if (!VALID_TERRAIN.has(a.terrain as string)) return null
  if (!VALID_DRAINAGE.has(a.drainage as string)) return null

  return a as unknown as GardenAnalysis
}

function parsePreferences(raw: unknown): UserPreferences | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Record<string, unknown>

  if (!VALID_SHED_PURPOSE.has(p.shedPurpose as string)) return null
  if (!VALID_SIZE.has(p.preferredSize as string)) return null
  if (!VALID_STYLE.has(p.stylePreference as string)) return null
  if (!VALID_RAIN.has(p.rainProtection as string)) return null
  if (!VALID_SUNLIGHT_PREF.has(p.sunlightPreference as string)) return null

  const prefs: UserPreferences = {
    shedPurpose: p.shedPurpose as UserPreferences['shedPurpose'],
    preferredSize: p.preferredSize as UserPreferences['preferredSize'],
    stylePreference: p.stylePreference as UserPreferences['stylePreference'],
    rainProtection: p.rainProtection as UserPreferences['rainProtection'],
    sunlightPreference: p.sunlightPreference as UserPreferences['sunlightPreference'],
  }

  if (p.budget !== undefined) {
    const n = Number(p.budget)
    if (!isFinite(n) || n < 0) return null
    prefs.budget = n
  }

  if (p.specialRequirements !== undefined) {
    if (typeof p.specialRequirements !== 'string') return null
    prefs.specialRequirements = p.specialRequirements.slice(0, 1000)
  }

  return prefs
}

export async function generateRecommendationHandler(req: Request, res: Response): Promise<void> {
  try {
    const { analysis: rawAnalysis, preferences: rawPrefs } = req.body as {
      analysis: unknown
      preferences: unknown
    }

    const analysis = parseAnalysis(rawAnalysis)
    if (!analysis) {
      res.status(400).json({ error: 'Invalid or missing garden analysis' })
      return
    }

    const preferences = parsePreferences(rawPrefs)
    if (!preferences) {
      res.status(400).json({ error: 'Invalid or missing user preferences' })
      return
    }

    const recommendation = await generateRecommendation(analysis, preferences)
    res.json({ recommendation })
  } catch (error: unknown) {
    console.error('Recommendation error:', error)
    res.status(500).json({ error: 'Failed to generate recommendation' })
  }
}
