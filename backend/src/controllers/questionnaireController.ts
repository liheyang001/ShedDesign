import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { UserPreferences } from '../types/garden.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../../data')
const FILE = path.join(DATA_DIR, 'questionnaires.json')

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const VALID: Record<string, Set<string>> = {
  shedPurpose: new Set(['storage', 'workshop', 'leisure', 'other']),
  preferredSize: new Set(['small', 'medium', 'large']),
  stylePreference: new Set(['modern', 'traditional', 'industrial', 'cottage']),
  rainProtection: new Set(['basic', 'moderate', 'professional']),
  sunlightPreference: new Set(['full-sun', 'partial', 'shade']),
}

interface QuestionnaireRecord {
  id: string
  userId: string
  imageId: string
  preferences: UserPreferences
  createdAt: string
}

function read(): QuestionnaireRecord[] {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(FILE)) return []
  try { return JSON.parse(fs.readFileSync(FILE, 'utf-8')) } catch { return [] }
}

function write(records: QuestionnaireRecord[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(records, null, 2))
}

function parsePreferences(raw: unknown): UserPreferences | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Record<string, unknown>

  for (const key of Object.keys(VALID)) {
    if (!VALID[key].has(p[key] as string)) return null
  }

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

export function submitQuestionnaire(req: Request, res: Response) {
  try {
    const { imageId, preferences: rawPrefs } = req.body as {
      imageId: unknown
      preferences: unknown
    }

    if (typeof imageId !== 'string' || !UUID_REGEX.test(imageId)) {
      res.status(400).json({ error: 'Invalid imageId' })
      return
    }

    const preferences = parsePreferences(rawPrefs)
    if (!preferences) {
      res.status(400).json({ error: 'Invalid preferences' })
      return
    }

    const userId = (req as Request & { user?: { id: string } }).user?.id ?? 'unknown'
    const record: QuestionnaireRecord = {
      id: uuidv4(),
      userId,
      imageId,
      preferences,
      createdAt: new Date().toISOString(),
    }

    const records = read()
    records.push(record)
    write(records)

    res.json({ questionnaireId: record.id, imageId, preferences })
  } catch (error: unknown) {
    console.error('Questionnaire error:', error)
    res.status(500).json({ error: 'Failed to save questionnaire' })
  }
}
